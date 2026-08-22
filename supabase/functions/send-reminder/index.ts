import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { toEmail, toName, message } = await req.json()
    const brevoApiKey = Deno.env.get('BREVO_API_KEY') ?? ''
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? ''

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify({
        sender: { name: 'Hisab Kitab', email: senderEmail },
        to: [{ email: toEmail, name: toName || '' }],
        subject: 'Hisab Kitab — Reminder',
        htmlContent: `<p>Hi ${toName || ''},</p><p>${message}</p><p>— Sent via Hisab Kitab</p>`,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})