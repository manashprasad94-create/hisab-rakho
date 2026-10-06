import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'
import { sendNotification } from './notify'

// Create a group expense: payer covers total, splits equally among all participants (excluding payer)
export async function createGroupExpense(
  participantIds: string[],
  totalAmount: number,
  reason: string,
  category: string
) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')
  if (participantIds.length === 0) throw new Error('Select at least one participant')
  if (new Set(participantIds).size !== participantIds.length || participantIds.includes(userId)) {
    throw new Error('Choose each friend only once')
  }

  const totalCents = Math.round(totalAmount * 100)
  if (!Number.isSafeInteger(totalCents) || Math.abs(totalAmount * 100 - totalCents) > 1e-8 ||
      totalCents < participantIds.length + 1) {
    throw new Error('Enter enough for at least ₹0.01 per person, with at most two decimal places')
  }
  const shareCents = Math.floor(totalCents / (participantIds.length + 1))
  const extraCents = totalCents % (participantIds.length + 1)

  const { error } = await supabase.rpc('create_group_expense_atomic', {
    p_participant_ids: participantIds,
    p_total_amount: totalAmount,
    p_reason: reason,
    p_category: category,
  })
  if (error) throw error

  // notify each participant
  const payerName = useAuthStore.getState().profile?.full_name || 'Someone'
  for (const [index, friendId] of participantIds.entries()) {
    const splitAmount = ((shareCents + (index < extraCents ? 1 : 0)) / 100).toFixed(2)
    sendNotification(
      friendId,
      'Group expense added',
      `${payerName} split "${reason || 'an expense'}" — your share is ₹${splitAmount}`
    )
  }

}
// Check if the friend already has a pending_acceptance transaction claiming the reverse direction
export async function checkReciprocalPending(friendId: string, amount: number) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('friend_transactions')
    .select('*')
    .eq('status', 'pending_acceptance')
    .eq('created_by', friendId)
    .eq('payer_id', friendId)
    .eq('payee_id', userId)
    .eq('amount', amount)
  if (error) throw error

  return data && data.length > 0 ? data[0] : null
}
// Create a transaction. direction: 'i_paid' means current user paid for friend (friend owes current user).
// Create the same transaction amount individually for multiple friends (not split)
export async function createBulkTransactions(
  friendIds: string[],
  amount: number,
  reason: string,
  category: string
) {
  if (!friendIds.length || new Set(friendIds).size !== friendIds.length) {
    throw new Error('Select each friend only once')
  }
  const { error } = await supabase.rpc('create_bulk_transactions_atomic', {
    p_friend_ids: friendIds,
    p_amount: amount,
    p_reason: reason,
    p_category: category,
  })
  if (error) throw error

  const creatorName = useAuthStore.getState().profile?.full_name || 'Someone'
  for (const friendId of friendIds) {
    sendNotification(friendId, 'New transaction request',
      `${creatorName} wants to record ₹${amount} — ${reason || 'no reason'}. Please review.`)
  }
}
// 'they_paid' means friend paid for current user (current user owes friend).
export async function createTransaction(
  friendId: string,
  amount: number,
  reason: string,
  category: string,
  direction: 'i_paid' | 'they_paid'
) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase.rpc('create_friend_transaction', {
    p_friend_id: friendId,
    p_amount: amount,
    p_reason: reason,
    p_category: category,
    p_direction: direction,
  })
  if (error) throw error

  const recipientId = friendId
  const creatorName = useAuthStore.getState().profile?.full_name || 'Someone'
  sendNotification(
    recipientId,
    'New transaction request',
    `${creatorName} wants to record ₹${amount} — ${reason || 'no reason'}. Please review.`,
    `/friends/${userId}`
  )

  return data
}

// Edit a transaction while it's still pending_acceptance (only the creator can do this)
export async function editPendingTransaction(
  transactionId: string,
  amount: number,
  reason: string,
  category: string
) {
  const { data, error } = await supabase.rpc('edit_pending_friend_transaction', {
    p_transaction_id: transactionId,
    p_amount: amount,
    p_reason: reason,
    p_category: category,
  })
  if (error) throw error
  return data
}

// Accept a pending_acceptance transaction — only the non-creator party should call this
export async function acceptTransaction(transactionId: string) {
  const userId = useAuthStore.getState().user?.id
  const { data, error } = await supabase.rpc('accept_friend_transaction', {
    p_transaction_id: transactionId,
  })
  if (error) throw error

  if (data && data.created_by !== userId) {
    const accepterName = useAuthStore.getState().profile?.full_name || 'Someone'
    sendNotification(
      data.created_by,
      'Transaction accepted',
      `${accepterName} accepted your transaction of ₹${data.amount}`,
      `/friends/${userId}`
    )
  }

  return data
}

// Reject a pending_acceptance transaction — removes it entirely
export async function rejectTransaction(transactionId: string) {
  const { data, error } = await supabase.rpc('reject_friend_transaction', {
    p_transaction_id: transactionId,
  })
  if (error) throw error

    if (data) {
    const userId = useAuthStore.getState().user?.id
    sendNotification(data.created_by, 'Transaction rejected', `Your transaction of ₹${data.amount} was rejected`, `/friends/${userId}`)
  }
}

// Reject a claimed payment
// List all transactions involving current user, with friend profile joined
export async function listTransactionsWithFriend(friendId: string, offset = 0, limit = 50) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('friend_transactions')
    .select('*')
    .or(
      `and(payer_id.eq.${userId},payee_id.eq.${friendId}),and(payer_id.eq.${friendId},payee_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data
}

export async function getFriendBalanceTotals() {
  const { data, error } = await supabase.rpc('get_friend_balance_totals')
  if (error) throw error
  return (data as { to_receive: number; to_pay: number }[] | null)?.[0] || { to_receive: 0, to_pay: 0 }
}

export async function listFriendBalances() {
  const { data, error } = await supabase.rpc('list_friend_balances')
  if (error) throw error
  return (data as { friend_id: string; full_name: string | null; amount: number; direction: 'receive' | 'pay' }[] | null) || []
}

// Step 1 of settlement: payee marks that they paid some amount (creates payment_record, unconfirmed)
export async function markAsPaid(transactionId: string, amount: number) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase.rpc('claim_friend_payment', {
    p_transaction_id: transactionId,
    p_amount: amount,
  })
  if (error) throw error

  // Notify the person owed, who must confirm receipt.
  const { data: txn } = await supabase
    .from('friend_transactions')
    .select('payer_id')
    .eq('id', transactionId)
    .single()

  if (txn) {
    const payerName = useAuthStore.getState().profile?.full_name || 'Someone'
    const userId = useAuthStore.getState().user?.id
    sendNotification(
      txn.payer_id,
      'Payment claimed',
      `${payerName} marked ₹${amount} as paid — please confirm`,
      `/friends/${userId}`
    )
  }

  return data
}

// Step 2 of settlement: payer confirms receipt -> reduces remaining_amount, updates status
export async function confirmPayment(paymentRecordId: string) {
  const { data: confirmedAmount, error } = await supabase.rpc('confirm_friend_payment', {
    p_payment_record_id: paymentRecordId,
  })
  if (error) throw error

  // notify the payer that their payment was confirmed
  const { data: paymentRecord } = await supabase
    .from('payment_records')
    .select('paid_by')
    .eq('id', paymentRecordId)
    .single()

  if (paymentRecord) {
    const userId = useAuthStore.getState().user?.id
    sendNotification(
      paymentRecord.paid_by,
      'Payment confirmed',
      `Your payment of ₹${confirmedAmount} was confirmed`,
      `/friends/${userId}`
    )
  }
}

// Reject a claimed payment
export async function rejectPayment(paymentRecordId: string) {
  const { data: record, error } = await supabase.rpc('reject_friend_payment', {
    p_payment_record_id: paymentRecordId,
  })
  if (error) throw error

  if (record) {
    sendNotification(
      record.paid_by,
      'Payment rejected',
      `Your claimed payment of ₹${record.amount} was rejected — please check with the other person`
    )
  }
}

// Get unconfirmed payment records for a transaction (pending confirmation)
export async function getPendingPaymentRecords(transactionIds: string[]) {
  if (transactionIds.length === 0) return []
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .in('transaction_id', transactionIds)
    .eq('confirmed', false)
    .eq('rejected', false)
  if (error) throw error
  return data
}
