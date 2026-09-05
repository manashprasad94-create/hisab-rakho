import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function listMyFunds() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('group_fund_members')
    .select('fund_id, role, group_funds(id, name)')
    .eq('user_id', userId)
  if (error) throw error
  return (data || []).map((row: any) => ({
    fundId: row.fund_id,
    name: row.group_funds?.name,
    role: row.role,
  }))
}

export async function createFund(name: string) {
  const userId = useAuthStore.getState().user?.id
  console.log('createFund userId:', userId)
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

export async function getMyRoleInFund(fundId: string): Promise<'owner' | 'admin' | 'member' | null> {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('group_fund_members')
    .select('role')
    .eq('fund_id', fundId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return data.role
}

export async function listFundMembers(fundId: string) {
  const { data, error } = await supabase
    .from('group_fund_members')
    .select('id, role, user_id, profiles:user_id(full_name, email)')
    .eq('fund_id', fundId)
  if (error) throw error
  return data
}

export async function addFundMember(fundId: string, email: string, role: 'admin' | 'member') {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (profileError) throw profileError
  if (!profile) throw new Error('No registered user found with this email')

  const { data, error } = await supabase
    .from('group_fund_members')
    .insert({ fund_id: fundId, user_id: profile.id, role })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listFundTransactions(fundId: string) {
  const { data, error } = await supabase
    .from('group_fund_transactions')
    .select('*, profiles:added_by(full_name)')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFundSummary(fundId: string, month?: string) {
  const txns = await listFundTransactions(fundId)
  const targetMonth = month || new Date().toISOString().slice(0, 7)
  const scoped = txns.filter((t) => t.created_at.startsWith(targetMonth))

  let totalDeposits = 0
  let totalExpenses = 0
  for (const t of scoped) {
    if (t.type === 'deposit') totalDeposits += Number(t.amount)
    else totalExpenses += Number(t.amount)
  }
  return {
    total: totalDeposits,
    used: totalExpenses,
    remaining: totalDeposits - totalExpenses,
  }
}

export async function addFundDeposit(
  fundId: string,
  holderId: string,
  amount: number,
  reason: string,
  paymentMode: 'cash' | 'online'
) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('group_fund_transactions')
    .insert({ fund_id: fundId, type: 'deposit', amount, reason, added_by: userId, holder_id: holderId, payment_mode: paymentMode })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addFundExpense(
  fundId: string,
  amount: number,
  reason: string,
  category: string,
  paymentMode: 'cash' | 'online'
) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('group_fund_transactions')
    .insert({
      fund_id: fundId,
      type: 'expense',
      amount,
      reason,
      category,
      added_by: userId,
      holder_id: userId,
      payment_mode: paymentMode,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// Get holders (owner/admin) with their cash + online balances, scoped to a month
export async function getHolderBalances(fundId: string, month?: string) {
  const targetMonth = month || new Date().toISOString().slice(0, 7)

  const { data: members, error: membersError } = await supabase
    .from('group_fund_members')
    .select('user_id, role, profiles:user_id(full_name)')
    .eq('fund_id', fundId)
    .in('role', ['owner', 'admin'])
  if (membersError) throw membersError

  const txns = await listFundTransactions(fundId)
  const scoped = txns.filter((t) => t.created_at.startsWith(targetMonth))

  return (members || []).map((m: any) => {
    const cash = scoped
      .filter((t) => t.holder_id === m.user_id && t.payment_mode === 'cash')
      .reduce((sum, t) => sum + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0)
    const online = scoped
      .filter((t) => t.holder_id === m.user_id && t.payment_mode === 'online')
      .reduce((sum, t) => sum + (t.type === 'deposit' ? Number(t.amount) : -Number(t.amount)), 0)

    return {
      userId: m.user_id,
      name: m.profiles?.full_name,
      role: m.role,
      cash,
      online,
      total: cash + online,
    }
  })
}