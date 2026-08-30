import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function listUpdates(limit = 15) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function markUpdateRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
  if (error) throw error
}