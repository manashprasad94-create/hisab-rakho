import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function updateProfile(updates: { full_name?: string; upi_id?: string; phone?: string })  {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}