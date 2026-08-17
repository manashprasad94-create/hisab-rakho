import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

// Search a user by exact email (for adding friends)
export async function searchUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}
// Store an invite for someone not yet registered
export async function createPendingInvite(email: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('pending_invites')
    .insert({ invited_by: userId, invited_email: email.trim().toLowerCase() })
    .select()
    .single()
  if (error) throw error
  return data
}

// Send a friend request (creates friendship row, status pending)
export async function sendFriendRequest(friendId: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')
  if (userId === friendId) throw new Error("Can't add yourself")

  // check if friendship already exists either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status')
    .or(`and(user_a.eq.${userId},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${userId})`)
    .maybeSingle()

  if (existing) throw new Error(`Friend request already ${existing.status}`)

  const { data, error } = await supabase
    .from('friendships')
    .insert({ user_a: userId, user_b: friendId, status: 'pending' })
    .select()
    .single()
  if (error) throw error
  return data
}

// Accept a pending friend request (only the receiver, user_b, should call this)
export async function acceptFriendRequest(friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
  if (error) throw error
}

// Reject/remove a friend request or friendship
export async function removeFriendship(friendshipId: string) {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId)
  if (error) throw error
}

// List accepted friends, joined with their profile info
export async function listFriends() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_a, user_b, status, profiles_a:user_a(id, full_name, email, avatar_url), profiles_b:user_b(id, full_name, email, avatar_url)')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .eq('status', 'accepted')
  if (error) throw error

  // normalize: always return the "other person's" profile
  return (data || []).map((f: any) => ({
    friendshipId: f.id,
    friend: f.user_a === userId ? f.profiles_b : f.profiles_a,
  }))
}

// List incoming pending requests (where current user is user_b, i.e. was invited)
export async function listPendingRequests() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('friendships')
    .select('id, user_a, profiles_a:user_a(id, full_name, email, avatar_url)')
    .eq('user_b', userId)
    .eq('status', 'pending')
  if (error) throw error
  return data
}