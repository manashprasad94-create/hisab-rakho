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

  const splitAmount = Math.round((totalAmount / (participantIds.length + 1)) * 100) / 100 // +1 includes payer's own share

  const { data: groupExpense, error: groupError } = await supabase
    .from('group_expenses')
    .insert({ created_by: userId, total_amount: totalAmount, reason, category })
    .select()
    .single()
  if (groupError) throw groupError

  const rows = participantIds.map((friendId) => ({
    created_by: userId,
    payer_id: userId,
    payee_id: friendId,
    amount: splitAmount,
    remaining_amount: splitAmount,
    reason,
    category,
    status: 'pending' as const,
    group_expense_id: groupExpense.id,
  }))

  const { data, error } = await supabase.from('friend_transactions').insert(rows).select()
  if (error) throw error

  // notify each participant
  const payerName = useAuthStore.getState().profile?.full_name || 'Someone'
  for (const friendId of participantIds) {
    sendNotification(
      friendId,
      'Group expense added',
      `${payerName} split "${reason || 'an expense'}" — your share is ₹${splitAmount}`
    )
  }

  return data
}
// Create a transaction. direction: 'i_paid' means current user paid for friend (friend owes current user).
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

  const payer_id = direction === 'i_paid' ? userId : friendId
  const payee_id = direction === 'i_paid' ? friendId : userId

  const { data, error } = await supabase
    .from('friend_transactions')
    .insert({
      created_by: userId,
      payer_id,
      payee_id,
      amount,
      remaining_amount: amount,
      reason,
      category,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error

  const recipientId = direction === 'i_paid' ? friendId : userId
  const payerName = useAuthStore.getState().profile?.full_name || 'Someone'
  sendNotification(
    recipientId,
    'New transaction',
    `${payerName} added a transaction of ₹${amount} — ${reason || 'no reason'}`
  )

  return data
}

// List all transactions involving current user, with friend profile joined
export async function listTransactionsWithFriend(friendId: string) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('friend_transactions')
    .select('*')
    .or(
      `and(payer_id.eq.${userId},payee_id.eq.${friendId}),and(payer_id.eq.${friendId},payee_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// List ALL friend transactions for current user (for dashboard aggregation)
export async function listAllTransactions() {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('friend_transactions')
    .select('*')
    .or(`payer_id.eq.${userId},payee_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Step 1 of settlement: payee marks that they paid some amount (creates payment_record, unconfirmed)
export async function markAsPaid(transactionId: string, amount: number) {
  const userId = useAuthStore.getState().user?.id
  if (!userId) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('payment_records')
    .insert({
      transaction_id: transactionId,
      paid_by: userId,
      amount,
    })
    .select()
    .single()
  if (error) throw error

  // notify the payee (person who is owed) that payer claims they paid
  const { data: txn } = await supabase
    .from('friend_transactions')
    .select('payee_id')
    .eq('id', transactionId)
    .single()

  if (txn) {
    const payerName = useAuthStore.getState().profile?.full_name || 'Someone'
    sendNotification(
      txn.payee_id,
      'Payment claimed',
      `${payerName} marked ₹${amount} as paid — please confirm`
    )
  }

  return data
}

// Step 2 of settlement: payer confirms receipt -> reduces remaining_amount, updates status
export async function confirmPayment(paymentRecordId: string, transactionId: string, amount: number) {
  // confirm the payment record
  const { error: confirmError } = await supabase
    .from('payment_records')
    .update({ confirmed: true, confirmed_at: new Date().toISOString() })
    .eq('id', paymentRecordId)
  if (confirmError) throw confirmError

  // fetch current transaction to compute new remaining amount
  const { data: txn, error: fetchError } = await supabase
    .from('friend_transactions')
    .select('remaining_amount')
    .eq('id', transactionId)
    .single()
  if (fetchError) throw fetchError

  const newRemaining = Math.max(0, Number(txn.remaining_amount) - amount)
  const newStatus = newRemaining === 0 ? 'settled' : 'partially_paid'

  const { error: updateError } = await supabase
    .from('friend_transactions')
    .update({ remaining_amount: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', transactionId)
  if (updateError) throw updateError

  // notify the payer that their payment was confirmed
  const { data: paymentRecord } = await supabase
    .from('payment_records')
    .select('paid_by')
    .eq('id', paymentRecordId)
    .single()

  if (paymentRecord) {
    sendNotification(
      paymentRecord.paid_by,
      'Payment confirmed',
      `Your payment of ₹${amount} was confirmed`
    )
  }
}

// Reject a claimed payment
export async function rejectPayment(paymentRecordId: string) {
  const { data: record, error } = await supabase
    .from('payment_records')
    .update({ rejected: true, rejected_at: new Date().toISOString() })
    .eq('id', paymentRecordId)
    .select()
    .single()
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
export async function getPendingPaymentRecords(transactionId: string) {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('transaction_id', transactionId)
    .eq('confirmed', false)
    .eq('rejected', false)
  if (error) throw error
  return data
}