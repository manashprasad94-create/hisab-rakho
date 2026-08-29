import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function getMyFundRole(): Promise<'owner' | 'admin' | 'member' | null> {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('group_fund_members')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.role
}
export async function createFund(name: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data: fund, error: fundError } = await supabase
    .from('group_funds')
    .insert({ name, created_by: userId })
    .select()
    .single()
  if (fundError) throw fundError

  const { error: memberError } = await supabase
    .from('group_fund_members')
    .insert({ fund_id: fund.id, user_id: userId, role: 'owner' })
  if (memberError) throw memberError

  return fund
}

export async function listFundTransactions() {
  const { data, error } = await supabase
    .from('group_fund_transactions')
    .select('*, profiles:added_by(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFundSummary() {
  const txns = await listFundTransactions()
  let totalDeposits = 0
  let totalExpenses = 0
  for (const t of txns) {
    if (t.type === 'deposit') totalDeposits += Number(t.amount)
    else totalExpenses += Number(t.amount)
  }
  return {
    total: totalDeposits,
    used: totalExpenses,
    remaining: totalDeposits - totalExpenses,
  }
}

export async function addFundDeposit(amount: number, reason: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('group_fund_transactions')
    .insert({ type: 'deposit', amount, reason, added_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addFundExpense(amount: number, reason: string, category: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('group_fund_transactions')
    .insert({ type: 'expense', amount, reason, category, added_by: userId })
    .select()
    .single()
  if (error) throw error
  return data
}