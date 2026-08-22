import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { imageBase64 } = await req.json()
    const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? ''

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.6-27b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a UPI payment success screenshot. Extract the total amount paid and a short 3-5 word description (merchant/payee name if visible). Respond ONLY in this exact JSON format with no other text: {"amount": "123.45", "note": "short description"}. If you cannot find an amount, use {"amount": "", "note": ""}.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    })

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content ?? '{}'

    let parsed
    try {
      const cleaned = content.replace(/```json|```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = { amount: '', note: '' }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})