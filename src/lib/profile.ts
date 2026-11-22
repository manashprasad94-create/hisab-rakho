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

export async function uploadAvatar(file: File): Promise<string> {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)
  if (updateError) throw updateError

  return publicUrl
}