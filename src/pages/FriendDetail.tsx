import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input } from '../components/FormControls'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import UpiPaymentModal from '../components/UpiPaymentModal'
import Card from '../components/card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { sendEmailReminder } from '../lib/notify'
import { errorMessage } from '../lib/errorMessage'

export default function FriendDetail() {
  const { friendId } = useParams<{ friendId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const targetId = searchParams.get('transaction')
  const [linkedTransaction, setLinkedTransaction] = useState<any>(null)
  const [friend, setFriend] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pendingByTxn, setPendingByTxn] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const loadData = useCallback(async () => {
    if (!friendId) return
    setError('')
    try {
      const { data: friendProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', friendId)
        .single()
      if (profileError) throw profileError
      setFriend(friendProfile)

      const txns = await listTransactionsWithFriend(friendId)
      setTransactions(txns)
      setHasMore(txns.length === 50)

      let target = null
      if (targetId && /^[0-9a-f-]{36}$/i.test(targetId) && user && !txns.some((t) => t.id === targetId)) {
        const { data, error: targetError } = await supabase.from('friend_transactions')
          .select('*').eq('id', targetId)
          .or(`and(payer_id.eq.${user.id},payee_id.eq.${friendId}),and(payer_id.eq.${friendId},payee_id.eq.${user.id})`)
          .maybeSingle()
        if (targetError) throw targetError
        target = data
      }
      setLinkedTransaction(target)
      if (targetId && !target && !txns.some((t) => t.id === targetId)) {
        setActionError('The linked transaction is unavailable or has been removed.')
      }
      const visible = target ? [...txns, target] : txns
      const ids = visible.filter((t) => t.status !== 'settled' && t.status !== 'pending_acceptance').map((t) => t.id)
      const records = await getPendingPaymentRecords(ids)
      const pendingMap: Record<string, any[]> = {}
      for (const record of records) {
        if (!pendingMap[record.transaction_id]) pendingMap[record.transaction_id] = []
        pendingMap[record.transaction_id].push(record)
      }
      setPendingByTxn(pendingMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load friend details')
    } finally {
      setLoading(false)
    }
  }, [friendId, targetId, user])

  useEffect(() => {
    if (!loading && targetId) {
      document.getElementById(`transaction-${targetId}`)?.scrollIntoView({ block: 'center' })
    }
  }, [loading, targetId, transactions, linkedTransaction])

  const loadMore = async () => {
    if (!friendId || loadingMore) return
    setLoadingMore(true)
    try {
      const next = await listTransactionsWithFriend(friendId, transactions.length)
      const ids = next.filter((t) => t.status !== 'settled' && t.status !== 'pending_acceptance').map((t) => t.id)
      const records = await getPendingPaymentRecords(ids)
      const morePending: Record<string, any[]> = {}
      for (const record of records) {
        if (!morePending[record.transaction_id]) morePending[record.transaction_id] = []
        morePending[record.transaction_id].push(record)
      }
      setTransactions((current) => [...current, ...next])
      setPendingByTxn((current) => ({ ...current, ...morePending }))
      setHasMore(next.length === 50)
    } catch (err) {
      setActionError(errorMessage(err, 'Could not load more transactions'))
    } finally {
      setLoadingMore(false)
    }
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
  }, [friendId, loadData])

  const netBalance = transactions.reduce((sum, t) => {
    if (t.status === 'settled' || t.status === 'pending_acceptance') return sum
    if (t.payer_id === user?.id) return sum + Number(t.remaining_amount)
    return sum - Number(t.remaining_amount)
  }, 0)

  // Group transactions by date (e.g. "15 Aug 2026")
  const visibleTransactions = linkedTransaction && !transactions.some((t) => t.id === linkedTransaction.id)
    ? [...transactions, linkedTransaction] : transactions
  const groupedByDate = visibleTransactions.reduce((groups: Record<string, any[]>, t) => {
    const dateKey = new Date(t.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
    return groups
  }, {})

  const runAction = async (action: () => Promise<unknown>) => {
    setActionError('')
    try {
      await action()
      await loadData()
      return true
    } catch (err) {
      setActionError(errorMessage(err, 'Could not update the transaction'))
      return false
    }
  }

  const handleMarkPaid = async (transactionId: string, amount: number) => {
    await runAction(() => markAsPaid(transactionId, amount))
  }

  const handleConfirm = async (paymentRecordId: string) => {
    await runAction(() => confirmPayment(paymentRecordId))
  }

  const handleReject = async (paymentRecordId: string) => {
    await runAction(() => rejectPayment(paymentRecordId))
  }

  const handleAcceptTxn = async (transactionId: string) => {
    await runAction(() => acceptTransaction(transactionId))
  }

  const handleRejectTxn = async (transactionId: string) => {
    await runAction(() => rejectTransaction(transactionId))
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
    if (await runAction(() => editPendingTransaction(t.id, Number(editAmount), editReason, t.category))) {
      setEditingId(null)
    }
  }
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [remindingIds, setRemindingIds] = useState<Set<string>>(new Set())

  const handleRemind = async (id: string) => {
    if (remindingIds.has(id) || remindedIds.has(id)) return
    setActionError('')
    setRemindingIds((prev) => new Set(prev).add(id))
    try {
      await sendEmailReminder(id)
      setRemindedIds((prev) => new Set(prev).add(id))
    } catch (err) {
      setActionError(errorMessage(err, 'Could not send reminder'))
    } finally {
      setRemindingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const [upiModalState, setUpiModalState] = useState<{
    isOpen: boolean
    amount: number
    reason: string
    transactionId: string
  }>({
    isOpen: false,
    amount: 0,
    reason: '',
    transactionId: '',
  })

  if (loading) {
    return (
      <div className="app-page">
        <LoadingState label="Loading transactions" />
      </div>
    )
  }

  if (!friend) {
    return <div className="app-page"><StatusMessage>{error || 'Friend not found'}</StatusMessage><Button variant="secondary" onClick={() => navigate('/friends')}>Back to Friends</Button></div>
  }

  return (
    <div className="app-page">
      {error && <StatusMessage>{error}</StatusMessage>}
      {actionError && <StatusMessage>{actionError}</StatusMessage>}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center gap-3 mb-4">
        <Avatar name={friend.full_name} size="lg" src={friend.avatar_url || undefined} />
        <div>
          <PageHeader title={<> {friend.full_name} </>} />
          <p className="text-sm text-text-muted">{friend.email}</p>
        </div>
      </div>

      <div className={`balance-panel ${netBalance >= 0 ? 'balance-panel-receive' : 'balance-panel-pay'}`}>
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

      {visibleTransactions.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Receipt} title="No transactions yet" subtitle="Add one to start tracking with this friend" />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateLabel, txnsOnDate]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-text-muted mb-2">{dateLabel}</p>
              <div className="record-list">
                {txnsOnDate.map((t) => {
                  const iAmPayee = t.payee_id === user?.id
                  const iCreatedIt = t.created_by === user?.id
                  const pending = pendingByTxn[t.id] || []
                  const needsMyAcceptance = t.status === 'pending_acceptance' && !iCreatedIt
                  const isSettled = t.status === 'settled'

                  return (
                    <div key={t.id} id={`transaction-${t.id}`} className={t.id === targetId ? 'rounded-2xl ring-2 ring-primary scroll-mt-4' : ''}>
                    <Card
                      className={`p-3 transaction-row ${needsMyAcceptance ? 'border-primary border-2' : ''} ${
                        isSettled
                          ? 'bg-success-soft'
                          : t.status !== 'pending_acceptance'
                          ? 'bg-bg'
                          : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {isSettled && <CheckCircle2 size={16} className="text-receive shrink-0" />}
                          <div>
                            <p className="record-title">{t.reason || 'No reason'}</p>
                            <p className="record-meta text-text-muted capitalize">{t.category}</p>
                            <div className="record-status">
                              <Badge tone={isSettled ? 'success' : 'pending'}>
                              {t.status === 'pending_acceptance'
                                ? 'awaiting response'
                                : isSettled
                                ? `settled · originally ₹${t.amount}`
                                : t.status.replace('_', ' ')}
                              </Badge>
                              {!isSettled && <span className={`record-direction ${iAmPayee ? 'text-owe' : 'text-receive'}`}>
                                {iAmPayee ? "You'll pay" : "You'll receive"}
                              </span>}
                            </div>
                          </div>
                        </div>
                        <p className={`record-amount font-semibold ${isSettled ? 'text-receive' : iAmPayee ? 'text-owe' : 'text-receive'}`}>
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
                              onClick={() => handleRemind(t.id)}
                              disabled={remindedIds.has(t.id) || remindingIds.has(t.id)}
                              className="text-xs text-primary font-medium disabled:text-text-muted disabled:opacity-70"
                            >
                              {remindingIds.has(t.id) ? 'Sending...' : remindedIds.has(t.id) ? 'Reminded ✓' : 'Remind'}
                            </button>
                          </div>
                        </div>
                      )}

                      {t.status === 'pending_acceptance' && iCreatedIt && editingId === t.id && (
                        <div className="mt-3 p-3 bg-bg-soft rounded-xl">
                          <label htmlFor="frienddetail-field-14" className="block text-xs mb-1 text-text-muted font-medium">Amount</label>
                          <Input id="frienddetail-field-14"
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="w-full mb-2 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <label htmlFor="frienddetail-field-15" className="block text-xs mb-1 text-text-muted font-medium">Reason</label>
                          <Input id="frienddetail-field-15"
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
                              {(friend.upi_id || friend.phone) && (
                                <Button
                                  onClick={() => setUpiModalState({
                                    isOpen: true,
                                    amount: Number(t.remaining_amount),
                                    reason: t.reason || 'Payment',
                                    transactionId: t.id,
                                  })}
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
                                <Button onClick={() => handleConfirm(p.id)} className="text-xs py-1.5 px-3">
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
                                onClick={() => handleRemind(t.id)}
                                disabled={remindedIds.has(t.id) || remindingIds.has(t.id)}
                                className="text-xs text-primary font-medium disabled:text-text-muted disabled:opacity-70"
                              >
                                {remindingIds.has(t.id) ? 'Sending...' : remindedIds.has(t.id) ? 'Reminded ' : 'Remind'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {hasMore && (
            <Button variant="secondary" onClick={loadMore} loading={loadingMore} className="w-full">
              {loadingMore ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      )}

      {friend && (
        <UpiPaymentModal
          isOpen={upiModalState.isOpen}
          onClose={() => setUpiModalState((prev) => ({ ...prev, isOpen: false }))}
          friend={friend}
          amount={upiModalState.amount}
          reason={upiModalState.reason}
          transactionId={upiModalState.transactionId}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  )
}
