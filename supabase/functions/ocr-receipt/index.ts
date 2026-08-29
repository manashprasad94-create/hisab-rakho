
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { imageBase64 } = await req.json()
    console.log('OCR-RECEIPT-V2-STARTING')
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
                text: 'This is a UPI payment success screenshot. Look carefully at the numbers actually shown in the image and extract the exact total amount paid (do not guess or use a placeholder number) and a short 3-5 word description (merchant/payee name if visible). Do not show your reasoning or thinking process. Respond with ONLY the final JSON object, nothing else, using this exact structure: {"amount": "<the exact number you see in the image>", "note": "<short description>"}. If you genuinely cannot find any amount in the image, use {"amount": "", "note": ""}.',
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
    console.log('groq status', response.status)
    console.log('groq raw result', JSON.stringify(result))
    const content = result.choices?.[0]?.message?.content ?? '{}'
    console.log('extracted content', content)

    let parsed
    try {
      // strip any <think>...</think> reasoning block the model may output before the JSON
      const withoutThinking = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      const cleaned = withoutThinking.replace(/```json|```/g, '').trim()

      // extract just the {...} JSON object in case there's any leftover text around it
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { amount: '', note: '' }
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
