import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function createExternalTransaction(
  contactName: string,
  amount: number,
  reason: string,
  category: string,
  direction: 'they_owe_me' | 'i_owe_them'
) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('external_transactions')
    .insert({
      user_id: userId,
      contact_name: contactName,
      amount,
      remaining_amount: amount,
      direction,
      reason,
      category,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listExternalTransactions() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('external_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markExternalAsSettled(id: string) {
  const { error } = await supabase
    .from('external_transactions')
    .update({ status: 'settled', remaining_amount: 0, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteExternalTransaction(id: string) {
  const { error } = await supabase.from('external_transactions').delete().eq('id', id)
  if (error) throw error
}