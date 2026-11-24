// Supabase Edge Function: twilio-whatsapp
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { adminClient } from '../_shared/auth.ts'

function twimlResponse(message: string): Response {
  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${safeMessage}</Message>
</Response>`

  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  })
}

// Fallback rule-based parsing if Groq is not configured or fails
function fallbackParser(text: string, friendNames: string[]) {
  const clean = text.toLowerCase().trim()

  // 1. Stats check
  if (
    clean.includes('stats') ||
    clean.includes('balance') ||
    clean.includes('hisab') ||
    clean.includes('how much')
  ) {
    return { intent: 'get_stats' }
  }

  // 2. Help / Greeting
  if (['hi', 'hello', 'hey', 'help', 'menu'].includes(clean)) {
    return { intent: 'help' }
  }

  // 3. Look for amount
  const amountMatch = clean.match(/(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees|inr)?/)
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null

  if (amount) {
    // Check if any known friend's name is in the message
    for (const name of friendNames) {
      if (clean.includes(name.toLowerCase())) {
        const forMatch = clean.match(/for\s+([^,\.]+?)(?:\s+today|\s+yesterday|$)/i)
        const reason = forMatch ? forMatch[1].trim() : 'Expense'
        const direction = clean.includes('he paid') || clean.includes('they paid') || clean.includes('lent me') ? 'they_paid' : 'i_paid'
        return {
          intent: 'friend_transaction',
          amount,
          friend_name: name,
          direction,
          reason,
          category: 'other',
        }
      }
    }

    // 4. Personal expense
    if (clean.includes('expense') || clean.includes('spent') || clean.includes('paid')) {
      const forMatch = clean.match(/for\s+([^,\.]+?)(?:\s+expense|\s+today|\s+yesterday|$)/i)
      const note = forMatch ? forMatch[1].trim() : 'Personal expense'
      let category = 'other'
      if (/lunch|dinner|breakfast|food|chai|coffee|snack|tea/.test(clean)) category = 'food'
      else if (/auto|cab|uber|ola|bus|metro|petrol|fuel|travel/.test(clean)) category = 'travel'
      else if (/recharge|bill|wifi|electricity/.test(clean)) category = 'utilities'
      else if (/movie|game|fun/.test(clean)) category = 'entertainment'

      return {
        intent: 'personal_expense',
        amount,
        category,
        note,
        date: new Date().toISOString().split('T')[0],
      }
    }
  }

  return { intent: 'unknown' }
}

async function parseWithAI(text: string, userName: string, friends: { id: string; name: string }[]) {
  const clean = text.toLowerCase().trim()

  // Instant fast-path for common short queries (0ms latency, zero Groq dependency)
  if (['hi', 'hello', 'hey', 'help', 'menu'].includes(clean)) {
    return { intent: 'help' }
  }
  if (['stats', 'balance', 'hisab', 'summary'].includes(clean)) {
    return { intent: 'get_stats' }
  }

  const apiKey = Deno.env.get('GROQ_API_KEY')
  if (!apiKey) {
    console.log('GROQ_API_KEY not found, using fallback parser')
    return fallbackParser(text, friends.map(f => f.name))
  }

  const today = new Date().toISOString().split('T')[0]
  const prompt = `You are an AI parser for the "Hisab Kitab" expense tracker on WhatsApp.
User name: "${userName}".
User's friends: ${JSON.stringify(friends)}.
Today's date: ${today}.

Classify user's input into one of these intents:
1. "friend_transaction": When recording an expense, bill, or loan with a friend.
   Format: {"intent":"friend_transaction","amount":number,"friend_name":"name","matched_friend_id":"id or null","direction":"i_paid"|"they_paid","reason":"short reason","category":"food"|"travel"|"shopping"|"entertainment"|"utilities"|"other"}
   Note: direction is "i_paid" if user paid and friend owes user. "they_paid" if friend paid and user owes them.
2. "personal_expense": When user logs a personal expense (no friend involved).
   Format: {"intent":"personal_expense","amount":number,"category":"food"|"travel"|"shopping"|"entertainment"|"utilities"|"other","note":"short note","date":"YYYY-MM-DD"}
3. "get_stats": When user asks for balances, summary, who owes whom, stats.
   Format: {"intent":"get_stats"}
4. "help": Greeting or asking for instructions.
   Format: {"intent":"help"}
5. "unknown": Unclear intent.
   Format: {"intent":"unknown"}

Output ONLY raw JSON with no Markdown quotes or commentary.`

  // Use fast llama-3.1-8b-instant with 5-second timeout so Twilio never times out
  const model = Deno.env.get('TRANSACTION_AI_MODEL') || 'llama-3.1-8b-instant'

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text.trim() },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const errText = await res.text()
      console.error(`Groq error (${res.status}):`, errText)
      return fallbackParser(text, friends.map(f => f.name))
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    return JSON.parse(content)
  } catch (err) {
    console.error('Groq call failed, using fallback parser:', err)
    return fallbackParser(text, friends.map(f => f.name))
  }
}

serve(async (req) => {
  if (req.method === 'GET') {
    return new Response('Twilio WhatsApp webhook is active.', { status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const formData = await req.formData()
    const rawFrom = formData.get('From')?.toString() || '' // e.g. "whatsapp:+919876543210"
    const text = formData.get('Body')?.toString() || '' // e.g. "add 35rs in account of rahul for lunch today"

    console.log(`[Twilio Webhook] Received from: ${rawFrom}, text: "${text}"`)

    if (!rawFrom || !text.trim()) {
      return twimlResponse("Empty message received.")
    }

    // 1. Clean phone number
    const cleanPhone = rawFrom.replace(/^whatsapp:/i, '').trim()
    const last10Digits = cleanPhone.replace(/\D/g, '').slice(-10)

    if (!last10Digits || last10Digits.length < 10) {
      return twimlResponse("⚠️ Could not verify sender phone number.")
    }

    const supabaseAdmin = adminClient()

    // 2. Identify user from profiles table
    const { data: allProfiles, error: pError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone')
      .not('phone', 'is', null)

    if (pError) {
      console.error('Error querying profiles:', pError)
      throw pError
    }

    const user = allProfiles?.find((p) => {
      if (!p.phone) return false
      const digits = p.phone.replace(/\D/g, '')
      return digits.endsWith(last10Digits)
    })

    if (!user) {
      console.log(`[Twilio Webhook] No user found with phone ending in ${last10Digits}`)
      return twimlResponse(
        `⚠️ Your WhatsApp number (${cleanPhone}) is not linked to any Hisab Kitab account.\n\n` +
        `To link it:\n` +
        `1. Open Hisab Kitab\n` +
        `2. Go to Profile\n` +
        `3. Enter your Phone Number (${cleanPhone})\n` +
        `4. Click Save Changes`
      )
    }

    console.log(`[Twilio Webhook] Authenticated user: ${user.full_name} (${user.id})`)

    // 3. Fetch user's friends list
    const { data: friendships, error: fError } = await supabaseAdmin
      .from('friendships')
      .select('id, user_a, user_b, profiles_a:user_a(id, full_name), profiles_b:user_b(id, full_name)')
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq('status', 'accepted')

    if (fError) {
      console.error('Error querying friendships:', fError)
      throw fError
    }

    const friendsList: { id: string; name: string }[] = (friendships || [])
      .map((f: any) => {
        const friend = f.user_a === user.id ? f.profiles_b : f.profiles_a
        return friend ? { id: friend.id, name: friend.full_name } : null
      })
      .filter((item): item is { id: string; name: string } => item !== null)

    // 4. Parse intent with AI / Fallback
    const parsed: any = await parseWithAI(text, user.full_name, friendsList)
    console.log('[Twilio Webhook] Parsed intent:', JSON.stringify(parsed))

    // 5. Execute based on intent
    switch (parsed.intent) {
      case 'friend_transaction': {
        const amount = Number(parsed.amount)
        if (!amount || amount <= 0) {
          return twimlResponse("⚠️ Please specify a valid amount (e.g. 'Add 35rs in account of Rahul').")
        }

        // Match friend
        let matchedFriend = friendsList.find(f => f.id === parsed.matched_friend_id)
        if (!matchedFriend && parsed.friend_name) {
          const query = parsed.friend_name.toLowerCase()
          matchedFriend = friendsList.find(f => f.name.toLowerCase().includes(query))
        }

        if (!matchedFriend) {
          const names = friendsList.map(f => `• ${f.name}`).join('\n')
          return twimlResponse(
            `❌ Could not find "${parsed.friend_name || 'friend'}" in your friends list.\n\n` +
            (names ? `Your friends are:\n${names}` : `You have not added any friends on Hisab Kitab yet.`)
          )
        }

        const isUserPayer = parsed.direction !== 'they_paid'
        const payerId = isUserPayer ? user.id : matchedFriend.id
        const payeeId = isUserPayer ? matchedFriend.id : user.id
        const reason = parsed.reason || 'Expense'
        const category = parsed.category || 'other'

        // Insert friend transaction
        const { error: txError } = await supabaseAdmin.from('friend_transactions').insert({
          created_by: user.id,
          payer_id: payerId,
          payee_id: payeeId,
          amount,
          remaining_amount: amount,
          reason,
          category,
          status: 'pending_acceptance',
        })

        if (txError) {
          console.error('Error inserting friend transaction:', txError)
          throw txError
        }

        // In-app notification to the friend
        await supabaseAdmin.from('notifications').insert({
          user_id: matchedFriend.id,
          title: 'New transaction request',
          body: `${user.full_name} wants to record ₹${amount.toFixed(0)} for "${reason}".`,
          type: 'transaction',
          read: false,
          action_url: `/friends/${user.id}`,
        })

        return twimlResponse(
          `✅ *Transaction Recorded!*\n\n` +
          `• Friend: *${matchedFriend.name}*\n` +
          `• Amount: *₹${amount.toFixed(0)}*\n` +
          `• Reason: *${reason}*\n` +
          `• Type: *${isUserPayer ? "You'll Get" : "You'll Pay"}*\n\n` +
          `📬 Approval request sent to ${matchedFriend.name}.`
        )
      }

      case 'personal_expense': {
        const amount = Number(parsed.amount)
        if (!amount || amount <= 0) {
          return twimlResponse("⚠️ Please specify a valid expense amount.")
        }

        const category = parsed.category || 'other'
        const note = parsed.note || 'Expense'
        const spentOn = parsed.date || new Date().toISOString().split('T')[0]

        const { error: expError } = await supabaseAdmin.from('personal_expenses').insert({
          user_id: user.id,
          amount,
          category,
          note,
          spent_on: spentOn,
          payment_mode: 'online',
        })

        if (expError) {
          console.error('Error inserting personal expense:', expError)
          throw expError
        }

        return twimlResponse(
          `✅ *Personal Expense Logged!*\n\n` +
          `• Amount: *₹${amount.toFixed(0)}*\n` +
          `• Category: *${category}*\n` +
          `• Note: *${note}*\n` +
          `• Date: *${spentOn}*`
        )
      }

      case 'get_stats': {
        const { data: txs, error: statsError } = await supabaseAdmin
          .from('friend_transactions')
          .select('payer_id, payee_id, remaining_amount, payer:profiles!friend_transactions_payer_id_fkey(full_name), payee:profiles!friend_transactions_payee_id_fkey(full_name)')
          .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
          .in('status', ['pending', 'partially_paid'])

        if (statsError) {
          console.error('Error fetching stats:', statsError)
          throw statsError
        }

        let toReceive = 0
        let toPay = 0
        const friendMap: Record<string, { name: string; net: number }> = {}

        for (const t of (txs || [])) {
          const amt = Number(t.remaining_amount) || 0
          if (t.payer_id === user.id) {
            toReceive += amt
            const fid = t.payee_id
            const name = (t as any).payee?.full_name || 'Friend'
            friendMap[fid] = friendMap[fid] || { name, net: 0 }
            friendMap[fid].net += amt
          } else {
            toPay += amt
            const fid = t.payer_id
            const name = (t as any).payer?.full_name || 'Friend'
            friendMap[fid] = friendMap[fid] || { name, net: 0 }
            friendMap[fid].net -= amt
          }
        }

        const lines = Object.values(friendMap)
          .filter(f => f.net !== 0)
          .slice(0, 5)
          .map(f => f.net > 0 
            ? `• ${f.name}: *+₹${f.net.toFixed(0)}* (You get)` 
            : `• ${f.name}: *-₹${Math.abs(f.net).toFixed(0)}* (You pay)`)
          .join('\n')

        return twimlResponse(
          `📊 *Hisab Kitab Summary for ${user.full_name}*\n\n` +
          `🟢 *You'll Get:* ₹${toReceive.toFixed(0)}\n` +
          `🔴 *You'll Pay:* ₹${toPay.toFixed(0)}\n\n` +
          (lines ? `*Top Friends Breakdown:*\n${lines}` : `_All balances settled!_`)
        )
      }

      case 'help': {
        return twimlResponse(
          `👋 *Hi ${user.full_name}! Welcome to Hisab Kitab on WhatsApp.*\n\n` +
          `Here is what you can text me:\n\n` +
          `1️⃣ *Add Friend Transaction:*\n` +
          `_"Add 35rs in account of Rahul for lunch today"_\n\n` +
          `2️⃣ *Add Personal Expense:*\n` +
          `_"Add 50 rs for lunch expenses today"_\n\n` +
          `3️⃣ *View Account Stats:*\n` +
          `_"Tell me my account stats"_\n\n` +
          `Everything syncs with your app immediately! 🚀`
        )
      }

      default: {
        return twimlResponse(
          `🤔 I couldn't understand that message.\n\n` +
          `Try examples like:\n` +
          `• "Add 35 in account of Rahul for lunch"\n` +
          `• "Add 50 for coffee expenses today"\n` +
          `• "Tell me my account stats"`
        )
      }
    }
  } catch (err) {
    console.error('Error handling Twilio webhook:', err)
    return twimlResponse("⚠️ An error occurred while processing your request. Please try again.")
  }
})
