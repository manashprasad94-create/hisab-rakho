import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function addExpense(amount: number, category: string, note: string, spentOn: string, paymentMode: 'cash' | 'online' = 'online') {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('personal_expenses')
    .insert({ user_id: userId, amount, category, note, spent_on: spentOn, payment_mode: paymentMode })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listExpenses() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('personal_expenses')
    .select('*')
    .eq('user_id', userId)
    .order('spent_on', { ascending: false })
  if (error) throw error
  return data
}
export async function updateExpense(
  id: string,
  updates: { amount?: number; category?: string; note?: string; spent_on?: string; payment_mode?: 'cash' | 'online' }
) {
  const { data, error } = await supabase
    .from('personal_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('personal_expenses').delete().eq('id', id)
  if (error) throw error
}

// Aggregated totals by category, for current month by default
export async function getCategorySummary(month?: string) {
  const expenses = await listExpenses()
  const targetMonth = month || new Date().toISOString().slice(0, 7) // "YYYY-MM"

  const filtered = expenses.filter((e) => e.spent_on.startsWith(targetMonth))
  const summary: Record<string, number> = {}
  let total = 0

  for (const e of filtered) {
    summary[e.category] = (summary[e.category] || 0) + Number(e.amount)
    total += Number(e.amount)
  }

  return { summary, total, count: filtered.length }
}