export type Profile = {
  id: string
  full_name: string
  email: string
  upi_id: string | null
  avatar_url: string | null
  created_at: string
}

export type FriendTransaction = {
  id: string
  created_by: string
  payer_id: string
  payee_id: string
  amount: number
  remaining_amount: number
  reason: string | null
  category: string | null
  status: 'pending' | 'partially_paid' | 'settled' | 'disputed'
  created_at: string
  updated_at: string
}

export type PaymentRecord = {
  id: string
  transaction_id: string
  paid_by: string
  amount: number
  marked_paid_at: string
  confirmed: boolean
  confirmed_at: string | null
  rejected: boolean
  rejected_at: string | null
}

export type PersonalExpense = {
  id: string
  user_id: string
  amount: number
  category: string
  note: string | null
  spent_on: string
  created_at: string
}
