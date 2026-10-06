// Supabase Edge Function: send-notification (FCM V1 API)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { create as createJWT, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts'
import { adminClient, authenticatedUser, claimQuota, corsHeaders, json } from '../_shared/auth.ts'

const allowedTitles = new Set([
  'Group expense added', 'New transaction request', 'Transaction accepted',
  'Transaction rejected', 'Payment claimed', 'Payment confirmed', 'Payment rejected',
])

async function getAccessToken(clientEmail: string, privateKey: string) {
  const keyData = privateKey.replace(/\\n/g, '\n')

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(keyData),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const jwt = await createJWT(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: getNumericDate(3600),
      iat: getNumericDate(0),
    },
    cryptoKey
  )

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function pemToArrayBuffer(pem: string) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const user = await authenticatedUser(req)
  if (!user) return json({ error: 'Sign in required' }, 401)

  try {
    const { recipientId, title, body, actionUrl } = await req.json()
    if (typeof recipientId !== 'string' || !/^[0-9a-f-]{36}$/i.test(recipientId) ||
        typeof title !== 'string' || !allowedTitles.has(title) ||
        typeof body !== 'string' || body.length < 1 || body.length > 300 ||
        (actionUrl != null && (typeof actionUrl !== 'string' || !/^\/friends\/[0-9a-f-]{36}$/i.test(actionUrl)))) {
      return json({ error: 'Invalid notification' }, 400)
    }

    const supabaseAdmin = adminClient()
    if (recipientId !== user.id) {
      const { data: friendship, error: friendshipError } = await supabaseAdmin
        .from('friendships')
        .select('id')
        .or(`and(user_a.eq.${user.id},user_b.eq.${recipientId}),and(user_a.eq.${recipientId},user_b.eq.${user.id})`)
        .eq('status', 'accepted')
        .limit(1)
      if (friendshipError) throw friendshipError
      if (!friendship?.length) {
        const { data: transaction, error: transactionError } = await supabaseAdmin
          .from('friend_transactions')
          .select('id')
          .or(`and(payer_id.eq.${user.id},payee_id.eq.${recipientId}),and(payer_id.eq.${recipientId},payee_id.eq.${user.id})`)
          .limit(1)
        if (transactionError) throw transactionError
        if (!transaction?.length) return json({ error: 'Recipient is not related to this account' }, 403)
      }
    }
    if (!(await claimQuota(user.id, 'notification', 60))) {
      return json({ error: 'Notification limit reached. Try later.' }, 429)
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .eq('id', recipientId)
      .single()

    if (profileError) throw profileError

    const { error: insertError } = await supabaseAdmin.from('notifications').insert({
      user_id: recipientId,
      title,
      body,
      type: 'transaction',
      read: false,
      action_url: actionUrl || null,
    })
    if (insertError) throw insertError

    if (!profile?.fcm_token) return json({ success: true, push: false })

    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL') ?? ''
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY') ?? ''
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID') ?? ''

    const accessToken = await getAccessToken(clientEmail, privateKey)

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            data: {
              title,
              body,
              url: actionUrl || '/dashboard',
            },
          },
        }),
      }
    )

    return json({ success: true, push: fcmResponse.ok })
  } catch (err) {
    console.error('send-notification failed', err)
    return json({ error: 'Notification failed' }, 500)
  }
})
