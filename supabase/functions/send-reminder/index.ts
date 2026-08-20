import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { toEmail, toName, message } = await req.json()

    const client = new SmtpClient()
    await client.connectTLS({
      hostname: 'smtp.gmail.com',
      port: 465,
      username: Deno.env.get('GMAIL_USER') ?? '',
      password: Deno.env.get('GMAIL_APP_PASSWORD') ?? '',
    })

    await client.send({
      from: Deno.env.get('GMAIL_USER') ?? '',
      to: toEmail,
      subject: 'Hisab Kitab — Reminder',
      content: `Hi ${toName || ''},\n\n${message}\n\n— Sent via Hisab Kitab`,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})