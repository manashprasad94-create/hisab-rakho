import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { adminClient, authenticatedUser, claimQuota, corsHeaders, json } from '../_shared/auth.ts'

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const user = await authenticatedUser(req)
  if (!user) return json({ error: 'Sign in required' }, 401)

  try {
    const { transactionId } = await req.json()
    if (typeof transactionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(transactionId)) {
      return json({ error: 'Invalid transaction' }, 400)
    }

    const admin = adminClient()
    const { data: transaction, error: transactionError } = await admin
      .from('friend_transactions')
      .select('id, created_by, payer_id, payee_id, amount, remaining_amount, reason, status')
      .eq('id', transactionId)
      .single()
    if (transactionError && transactionError.code !== 'PGRST116') throw transactionError
    if (!transaction) {
      return json({ error: 'You cannot send this reminder' }, 403)
    }

    const acceptanceReminder = transaction.status === 'pending_acceptance' && transaction.created_by === user.id
    const paymentReminder = transaction.payee_id === user.id &&
      ['pending', 'partially_paid'].includes(transaction.status)
    if (!acceptanceReminder && !paymentReminder) {
      return json({ error: 'You cannot send this reminder' }, 403)
    }
    if (paymentReminder) {
      const { data: pending, error: pendingError } = await admin
        .from('payment_records')
        .select('id')
        .eq('transaction_id', transactionId)
        .eq('paid_by', user.id)
        .eq('confirmed', false)
        .eq('rejected', false)
        .limit(1)
      if (pendingError) throw pendingError
      if (!pending?.length) return json({ error: 'No payment is waiting for confirmation' }, 400)
    }

    const recipientId = acceptanceReminder
      ? (transaction.payer_id === user.id ? transaction.payee_id : transaction.payer_id)
      : transaction.payer_id

    const { data: recipient, error: recipientError } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientId)
      .single()
    if (recipientError && recipientError.code !== 'PGRST116') throw recipientError
    if (!recipient?.email) return json({ error: 'Recipient email unavailable. Ask your friend to update their profile.' }, 400)

    const brevoApiKey = Deno.env.get('BREVO_API_KEY') ?? ''
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? ''
    if (!brevoApiKey || !senderEmail) {
      return json({ error: 'Email reminders are not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL in Supabase Edge Function secrets.' }, 503)
    }
    let transactionUrl: string | null = null
    const appUrl = Deno.env.get('APP_URL')?.trim()
    if (appUrl) {
      const base = new URL(appUrl)
      if (base.protocol !== 'https:' || base.username || base.password) {
        return json({ error: 'APP_URL must be the public HTTPS address of your app.' }, 503)
      }
      // From the recipient's account, the sender is the friend to open.
      const destination = new URL(`/friends/${user.id}`, base.origin)
      destination.searchParams.set('transaction', transactionId)
      transactionUrl = escapeHtml(destination.href)
    }
    try {
      if (!(await claimQuota(user.id, 'reminder', 10))) {
        return json({ error: 'Reminder limit reached. Try again next hour.' }, 429)
      }
    } catch (error) {
      console.error('Reminder quota check failed', error)
      const code = error && typeof error === 'object' && 'code' in error ? error.code : ''
      if (code === 'PGRST202' || code === '42883' || code === '42P01') {
        return json({ error: 'Reminder database setup is missing. Run migration 20261006000006_outbound_quotas.sql in Supabase SQL Editor.' }, 503)
      }
      throw error
    }

    const name = escapeHtml(recipient.full_name || 'there')
    const reason = escapeHtml(String(transaction.reason || 'a transaction').slice(0, 200))
    const amount = Number(acceptanceReminder ? transaction.amount : transaction.remaining_amount).toFixed(2)
    const action = acceptanceReminder ? 'review' : 'confirm'
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': brevoApiKey },
      body: JSON.stringify({
        sender: { name: 'Hisab Kitab', email: senderEmail },
        to: [{ email: recipient.email, name: recipient.full_name || '' }],
        subject: 'Hisab Kitab — Payment reminder',
        htmlContent: `<p>Hi ${name},</p><p>A payment of ₹${amount} for ${reason} is waiting for you to ${action} it in Hisab Kitab.</p>${transactionUrl ? `<p><a href="${transactionUrl}">Open transaction in Hisab Kitab</a></p>` : ''}`,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      const providerError = await response.json().catch(() => null)
      // Record the code and status without logging recipient details or email content.
      console.error('Brevo rejected reminder', { status: response.status, code: providerError?.code })
      const message = response.status === 401 || response.status === 403
        ? 'Brevo rejected email access. Check BREVO_API_KEY and that transactional email is enabled in Brevo.'
        : response.status === 400
        ? 'Brevo rejected the email. Check that BREVO_SENDER_EMAIL is a verified Brevo sender and the recipient email is valid.'
        : response.status === 402
        ? 'Brevo email credits are exhausted. Check your Brevo account.'
        : response.status === 429
        ? 'Brevo is limiting email requests. Try again later.'
        : 'The email provider is unavailable. Try again later.'
      return json({ error: message }, 502)
    }
    return json({ success: true })
  } catch (err) {
    console.error('send-reminder failed', err)
    return json({ error: 'Reminder could not be sent' }, 500)
  }
})
