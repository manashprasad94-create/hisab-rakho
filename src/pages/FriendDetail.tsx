import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Receipt } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  listTransactionsWithFriend,
  markAsPaid,
  confirmPayment,
  rejectPayment,
  getPendingPaymentRecords,
} from '../lib/transactions'
import { generateUpiLink } from '../lib/upi'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'

export default function FriendDetail() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [friend, setFriend] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pendingByTxn, setPendingByTxn] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    if (!friendId) return
    const { data: friendProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single()
    setFriend(friendProfile)

    const txns = await listTransactionsWithFriend(friendId)
    setTransactions(txns)

    const pendingMap: Record<string, any[]> = {}
    for (const t of txns) {
      if (t.status !== 'settled') {
        pendingMap[t.id] = await getPendingPaymentRecords(t.id)
      }
    }
    setPendingByTxn(pendingMap)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [friendId])

  const netBalance = transactions.reduce((sum, t) => {
    if (t.status === 'settled' || t.status === 'pending_acceptance') return sum
    if (t.payer_id === user?.id) return sum + Number(t.remaining_amount)
    return sum - Number(t.remaining_amount)
  }, 0)

  const handleMarkPaid = async (transactionId: string, amount: number) => {
    await markAsPaid(transactionId, amount)
    loadData()
  }

  const handleConfirm = async (paymentRecordId: string, transactionId: string, amount: number) => {
    await confirmPayment(paymentRecordId, transactionId, amount)
    loadData()
  }

  const handleReject = async (paymentRecordId: string) => {
    await rejectPayment(paymentRecordId)
    loadData()
  }

  const handlePayViaUpi = (upiId: string, name: string, amount: number, note: string) => {
    window.location.href = generateUpiLink(upiId, name, amount, note)
  }

  if (loading || !friend) {
    return (
      <div className="min-h-screen bg-bg-soft p-4">
        <div className="h-8 w-24 bg-white/60 rounded-lg animate-pulse mb-4" />
        <div className="h-32 bg-white/60 rounded-2xl animate-pulse mb-4" />
        <div className="h-12 bg-white/60 rounded-xl animate-pulse mb-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={friend.full_name} size="lg" />
        <div>
          <h1 className="text-xl font-semibold">{friend.full_name}</h1>
          <p className="text-sm text-text-muted">{friend.email}</p>
        </div>
      </div>

      <div className="bg-primary text-white rounded-2xl p-6 mb-4 shadow-sm">
        <p className="text-sm opacity-80">{netBalance >= 0 ? 'They owe you' : 'You owe them'}</p>
        <p className="text-3xl font-semibold mt-1">₹{Math.abs(netBalance).toFixed(2)}</p>
      </div>

      <Button
        variant="secondary"
        onClick={() => navigate(`/add-transaction?friendId=${friendId}`)}
        className="w-full mb-5 flex items-center justify-center gap-2"
      >
        <Plus size={18} /> Add Transaction
      </Button>

      <h2 className="text-sm font-semibold text-text-muted mb-3">Transaction List</h2>

      {transactions.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Receipt} title="No transactions yet" subtitle="Add one to start tracking with this friend" />
        </Card>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => {
            const iAmPayee = t.payee_id === user?.id
            const pending = pendingByTxn[t.id] || []

            return (
              <Card key={t.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{t.reason || 'No reason'}</p>
                    <p className="text-xs text-text-muted capitalize">{t.category} · {t.status.replace('_', ' ')}</p>
                  </div>
                  <p className={`font-semibold ${iAmPayee ? 'text-owe' : 'text-receive'}`}>
                    ₹{Number(t.remaining_amount).toFixed(2)}
                  </p>
                </div>

                {t.status !== 'settled' && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {iAmPayee && pending.length === 0 && (
                      <>
                        {friend.upi_id && (
                          <Button
                            onClick={() => handlePayViaUpi(friend.upi_id, friend.full_name, t.remaining_amount, t.reason)}
                            className="text-xs py-1.5 px-3"
                          >
                            Pay via UPI
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => handleMarkPaid(t.id, t.remaining_amount)}
                          className="text-xs py-1.5 px-3"
                        >
                          I've Paid
                        </Button>
                      </>
                    )}

                    {!iAmPayee && pending.map((p) => (
                      <div key={p.id} className="flex gap-2 items-center text-xs w-full">
                        <span className="text-text-muted flex-1">Claims paid ₹{p.amount}</span>
                        <Button onClick={() => handleConfirm(p.id, t.id, p.amount)} className="text-xs py-1.5 px-3">
                          Confirm
                        </Button>
                        <Button variant="danger" onClick={() => handleReject(p.id)} className="text-xs py-1.5 px-3">
                          Reject
                        </Button>
                      </div>
                    ))}

                    {iAmPayee && pending.length > 0 && (
                      <span className="text-xs text-text-muted">Waiting for confirmation...</span>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}