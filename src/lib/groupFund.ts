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
  const { data, error } = await supabase.rpc('create_group_fund_atomic', {
    p_name: name.trim(),
  })
  if (error) throw error
  return { id: data }
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
  if (error) throw error
  if (!data) return null
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
  const { data, error } = await supabase.rpc('add_group_fund_member', {
    p_fund_id: fundId,
    p_email: email.trim().toLowerCase(),
    p_role: role,
  })
  if (error) throw error
  return data
}

export async function listFundTransactions(fundId: string, offset = 0, limit = 50) {
  const { data, error } = await supabase
    .from('group_fund_transactions')
    .select('*, profiles:added_by(full_name)')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data
}

export async function getHolderBalances(fundId: string) {
  const { data, error } = await supabase
    .from('group_fund_balances')
    .select('*, profiles:user_id(full_name)')
    .eq('fund_id', fundId)
  if (error) throw error
  return (data || []).map((b: any) => ({
    userId: b.user_id,
    name: (Array.isArray(b.profiles) ? b.profiles[0] : b.profiles)?.full_name || 'Holder',
    cash: Number(b.cash_balance),
    online: Number(b.online_balance),
    total: Number(b.cash_balance) + Number(b.online_balance),
  }))
}

export async function addFundExpense(
  fundId: string,
  amount: number,
  reason: string,
  category: string,
  paymentMode: 'cash' | 'online'
) {
  const { data, error } = await supabase.rpc('spend_group_fund', {
    p_fund_id: fundId,
    p_amount: amount,
    p_reason: reason.trim(),
    p_category: category,
    p_payment_mode: paymentMode,
  })
  if (error) throw error
  return data
}

export async function depositToFundHolder(
  fundId: string,
  holderId: string,
  amount: number,
  paymentMode: 'cash' | 'online',
  reason: string,
  depositDate: string
) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100)) || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-8) {
    throw new Error('Enter an amount greater than zero with at most two decimal places')
  }

  const { error } = await supabase.rpc('deposit_group_fund', {
    p_fund_id: fundId,
    p_holder_id: holderId,
    p_amount: amount,
    p_payment_mode: paymentMode,
    p_reason: reason.trim(),
    p_deposit_date: depositDate,
  })
  if (error) throw error
}
