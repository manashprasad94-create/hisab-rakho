import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

// Search a user by exact email (for adding friends)
export async function searchUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

// Search a user by exact phone number (for adding friends)
export async function searchUserByPhone(phone: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('phone', phone.trim())
    .maybeSingle()
  if (error) throw error
  return data
}

// Store an invite for someone not yet registered
export async function createPendingInvite(email: string) {
  const { data, error } = await supabase.rpc('create_pending_invite', {
    p_email: email.trim().toLowerCase(),
  })
  if (error) throw error
  return data
}

// Send a friend request (creates friendship row, status pending)
export async function sendFriendRequest(friendId: string) {
  const { data, error } = await supabase.rpc('send_friend_request', {
    p_friend_id: friendId,
  })
  if (error) throw error
  return data
}

// Accept a pending friend request
export async function acceptFriendRequest(friendshipId: string) {
  const { error } = await supabase.rpc('accept_friend_request', {
    p_friendship_id: friendshipId,
  })
  if (error) throw error
}

// Reject/remove a friend request or friendship
export async function removeFriendship(friendshipId: string) {
  const { error } = await supabase.rpc('remove_friendship', {
    p_friendship_id: friendshipId,
  })
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

  return (data || []).map((f: any) => ({
    friendshipId: f.id,
    friend: f.user_a === userId ? f.profiles_b : f.profiles_a,
  }))
}

// List incoming pending requests
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
