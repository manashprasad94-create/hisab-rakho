import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Receipt, CheckCircle2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  listTransactionsWithFriend,
  markAsPaid,
  confirmPayment,
  rejectPayment,
  getPendingPaymentRecords,
  acceptTransaction,
  rejectTransaction,
  editPendingTransaction,
} from '../lib/transactions'
import { generateUpiLink } from '../lib/upi'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { sendEmailReminder } from '../lib/notify'

export default function FriendDetail() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const { user , profile } = useAuthStore()
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
      if (t.status !== 'settled' && t.status !== 'pending_acceptance') {
        pendingMap[t.id] = await getPendingPaymentRecords(t.id)
      }
    }
    setPendingByTxn(pendingMap)
    setLoading(false)
  }

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel(`friend-detail-${friendId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_transactions' }, () => {
        loadData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_records' }, () => {
        loadData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [friendId])

  const netBalance = transactions.reduce((sum, t) => {
    if (t.status === 'settled' || t.status === 'pending_acceptance') return sum
    if (t.payer_id === user?.id) return sum + Number(t.remaining_amount)
    return sum - Number(t.remaining_amount)
  }, 0)

  // Group transactions by date (e.g. "15 Aug 2026")
  const groupedByDate = transactions.reduce((groups: Record<string, any[]>, t) => {
    const dateKey = new Date(t.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
    return groups
  }, {})

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

  const handleAcceptTxn = async (transactionId: string) => {
    await acceptTransaction(transactionId)
    loadData()
  }

  const handleRejectTxn = async (transactionId: string) => {
    await rejectTransaction(transactionId)
    loadData()
  }

    const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editReason, setEditReason] = useState('')

  const startEdit = (t: any) => {
    setEditingId(t.id)
    setEditAmount(String(t.amount))
    setEditReason(t.reason || '')
  }

  const saveEdit = async (t: any) => {
    if (!editAmount || Number(editAmount) <= 0) return
    await editPendingTransaction(t.id, Number(editAmount), editReason, t.category)
    setEditingId(null)
    loadData()
  }
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())

  const handleRemind = async (message: string, id: string) => {
    await sendEmailReminder(friend.email, friend.full_name, message)
    setRemindedIds((prev) => new Set(prev).add(id))
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
        <p className="text-sm opacity-80">{netBalance >= 0 ? "You'll get" : "You'll pay"}</p>
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
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateLabel, txnsOnDate]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-text-muted mb-2">{dateLabel}</p>
              <div className="space-y-2">
                {txnsOnDate.map((t) => {
                  const iAmPayee = t.payee_id === user?.id
                  const iCreatedIt = t.created_by === user?.id
                  const pending = pendingByTxn[t.id] || []
                  const needsMyAcceptance = t.status === 'pending_acceptance' && !iCreatedIt
                  const isSettled = t.status === 'settled'

                  return (
                    <Card
                      key={t.id}
                      className={`p-3 ${needsMyAcceptance ? 'border-primary border-2' : ''} ${
                        isSettled
                          ? 'bg-primary/5 border-primary/20'
                          : t.status !== 'pending_acceptance'
                          ? 'bg-owe/5 border-owe/20'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {isSettled && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                          <div>
                            <p className="font-medium text-sm">{t.reason || 'No reason'}</p>
                            <p className="text-xs text-text-muted capitalize">
                              {t.category} ·{' '}
                              {t.status === 'pending_acceptance'
                                ? 'awaiting response'
                                : isSettled
                                ? `settled · originally ₹${t.amount}`
                                : t.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <p className={`font-semibold ${isSettled ? 'text-primary' : iAmPayee ? 'text-owe' : 'text-receive'}`}>
                          {isSettled ? '✓' : `₹${Number(t.remaining_amount).toFixed(2)}`}
                        </p>
                      </div>

                      {needsMyAcceptance && (
                        <div className="mt-3 flex gap-2">
                          <Button onClick={() => handleAcceptTxn(t.id)} className="text-xs py-1.5 px-3 flex-1">
                            Accept
                          </Button>
                          <Button variant="danger" onClick={() => handleRejectTxn(t.id)} className="text-xs py-1.5 px-3 flex-1">
                            Reject
                          </Button>
                        </div>
                      )}

                      {t.status === 'pending_acceptance' && iCreatedIt && editingId !== t.id && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-text-muted">Waiting for {friend.full_name} to accept...</p>
                          <div className="flex items-center gap-3">
                            <button onClick={() => startEdit(t)} className="text-xs text-primary font-medium flex items-center gap-1">
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              onClick={() => handleRemind(`${profile?.full_name || 'Someone'} is reminding you to accept the payment of ₹${t.amount} — ${t.reason || 'no reason'} — in Hisab Kitab. Open here: ${window.location.origin}/friends/${user?.id}`, t.id)}
                              disabled={remindedIds.has(t.id)}
                              className="text-xs text-primary font-medium disabled:text-text-muted disabled:opacity-70"
                            >
                              {remindedIds.has(t.id) ? 'Reminded ✓' : 'Remind'}
                            </button>
                          </div>
                        </div>
                      )}

                      {t.status === 'pending_acceptance' && iCreatedIt && editingId === t.id && (
                        <div className="mt-3 p-3 bg-bg-soft rounded-xl">
                          <label className="block text-xs mb-1 text-text-muted font-medium">Amount</label>
                          <input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full mb-2 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <label className="block text-xs mb-1 text-text-muted font-medium">Reason</label>
                          <input
                            type="text"
                            value={editReason}
                            onChange={(e) => setEditReason(e.target.value)}
                            className="w-full mb-3 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => saveEdit(t)} className="text-xs py-1.5 px-3 flex-1">Save</Button>
                            <Button variant="secondary" onClick={() => setEditingId(null)} className="text-xs py-1.5 px-3 flex-1">Cancel</Button>
                          </div>
                        </div>
                      )}

                      {t.status !== 'settled' && t.status !== 'pending_acceptance' && (
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

                          {!iAmPayee &&
                            pending.map((p) => (
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
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs text-text-muted">Waiting for confirmation...</span>
                              <button
                                onClick={() => handleRemind(`${profile?.full_name || 'Someone'} is reminding you to confirm the payment of ₹${t.remaining_amount} — ${t.reason || 'no reason'} — in Hisab Kitab. Open here: ${window.location.origin}/friends/${user?.id}`, t.id)}
                                disabled={remindedIds.has(t.id)}
                                className="text-xs text-primary font-medium disabled:text-text-muted disabled:opacity-70"
                              >
                                {remindedIds.has(t.id) ? 'Reminded ' : 'Remind'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}