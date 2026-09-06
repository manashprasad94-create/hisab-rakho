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

// Holder balances now come from a directly-editable table (backend-managed top-ups)
export async function getHolderBalances(fundId: string) {
  const { data, error } = await supabase
    .from('group_fund_balances')
    .select('*, profiles:user_id(full_name)')
    .eq('fund_id', fundId)
  if (error) throw error
  return (data || []).map((b: any) => ({
    userId: b.user_id,
    name: b.profiles?.full_name,
    cash: Number(b.cash_balance),
    online: Number(b.online_balance),
    total: Number(b.cash_balance) + Number(b.online_balance),
  }))
}

async function deductFromBalance(fundId: string, userId: string, amount: number, mode: 'cash' | 'online') {
  const { data: current, error: fetchError } = await supabase
    .from('group_fund_balances')
    .select('cash_balance, online_balance')
    .eq('fund_id', fundId)
    .eq('user_id', userId)
    .single()
  if (fetchError) throw fetchError

  const field = mode === 'cash' ? 'cash_balance' : 'online_balance'
  const newValue = Number(current[field]) - amount

  const { error: updateError } = await supabase
    .from('group_fund_balances')
    .update({ [field]: newValue, updated_at: new Date().toISOString() })
    .eq('fund_id', fundId)
    .eq('user_id', userId)
  if (updateError) throw updateError
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

  await deductFromBalance(fundId, userId, amount, paymentMode)

  return data
}