import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

export async function updateProfile(updates: { full_name?: string; upi_id?: string; phone?: string })  {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const fullName = updates.full_name?.trim()
  const phone = updates.phone?.trim() || null
  const upiId = updates.upi_id?.trim() || null
  if (!fullName || fullName.length > 100) throw new Error('Enter a name of 100 characters or fewer')
  if (phone && (phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15 || !/^\+?[\d\s()-]+$/.test(phone))) {
    throw new Error('Enter a valid phone number')
  }
  if (upiId && !/^[\w.-]{2,256}@[\w.-]{2,64}$/.test(upiId)) {
    throw new Error('Enter a valid UPI ID')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone, upi_id: upiId })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
