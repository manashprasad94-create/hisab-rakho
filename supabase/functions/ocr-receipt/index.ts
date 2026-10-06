
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { authenticatedUser, claimQuota, corsHeaders, json } from '../_shared/auth.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const user = await authenticatedUser(req)
  if (!user) return json({ error: 'Sign in required' }, 401)
  if (Number(req.headers.get('Content-Length') || 0) > 7_000_000) {
    return json({ error: 'Image is too large' }, 413)
  }

  try {
    const reader = req.body?.getReader()
    if (!reader) return json({ error: 'Image is required' }, 400)
    const decoder = new TextDecoder()
    let payload = ''
    let bytes = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 7_000_000) {
        await reader.cancel()
        return json({ error: 'Image is too large' }, 413)
      }
      payload += decoder.decode(value, { stream: true })
    }
    payload += decoder.decode()
    const { imageBase64, mimeType = 'image/jpeg' } = JSON.parse(payload)
    if (typeof imageBase64 !== 'string' || imageBase64.length > 6_700_000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) ||
        !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return json({ error: 'Use a JPEG, PNG, or WebP image under 5 MB' }, 400)
    }
    const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? ''
    if (!groqApiKey) return json({ error: 'Receipt reader is not configured' }, 503)
    if (!(await claimQuota(user.id, 'ocr', 20))) {
      return json({ error: 'Receipt reading limit reached. Try later.' }, 429)
    }

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
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) return json({ error: 'Receipt reader is unavailable' }, 502)
    const result = await response.json()
    const content = result.choices?.[0]?.message?.content ?? '{}'

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

    return json({
      amount: typeof parsed.amount === 'string' ? parsed.amount.slice(0, 30) : '',
      note: typeof parsed.note === 'string' ? parsed.note.slice(0, 200) : '',
    })
  } catch (err) {
    console.error('ocr-receipt failed', err)
    return json({ error: 'Receipt could not be read' }, 500)
  }
})
