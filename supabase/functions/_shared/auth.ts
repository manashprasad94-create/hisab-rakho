import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

export async function authenticatedUser(req: Request) {
  const token = req.headers.get('Authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  try {
    const { data, error } = await adminClient().auth.getUser(token)
    return error ? null : data.user
  } catch {
    return null
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function claimQuota(userId: string, channel: 'notification' | 'reminder' | 'ocr', limit: number) {
  const { data, error } = await adminClient().rpc('claim_outbound_quota', {
    p_user_id: userId,
    p_channel: channel,
    p_limit: limit,
  })
  if (error) throw error
  return data === true
}
