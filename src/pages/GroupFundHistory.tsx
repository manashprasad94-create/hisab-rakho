import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Receipt, Download } from 'lucide-react'
import { listFundTransactions } from '../lib/groupFund'
import { exportToCsv } from '../lib/exportCsv'
import Card from '../components/card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function GroupFundHistory() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!fundId) return
    let active = true
    setLoading(true)
    setError('')
    listFundTransactions(fundId).then((data) => {
      if (!active) return
      setTxns(data)
      setHasMore(data.length === 50)
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Could not load fund history')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [fundId])

  const loadMore = async () => {
    if (!fundId || loadingMore) return
    setLoadingMore(true)
    try {
      const data = await listFundTransactions(fundId, txns.length)
      setTxns((current) => [...current, ...data])
      setHasMore(data.length === 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load more history')
    } finally {
      setLoadingMore(false)
    }
  }

  const groupedByDate = txns.reduce((groups: Record<string, any[]>, t) => {
    const dateKey = new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
    return groups
  }, {})

  return (
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-center justify-between mb-4">
        <PageHeader title={<> Fund History </>} />
        {txns.length > 0 && (
          <Button
            variant="secondary"
            onClick={() =>
              exportToCsv(
                'hisab-kitab-fund-history.csv',
                txns.map((t) => ({
                  date: new Date(t.created_at).toLocaleDateString('en-IN'),
                  type: t.type,
                  amount: t.amount,
                  reason: t.reason,
                  category: t.category || '',
                  added_by: t.profiles?.full_name || '',
                  holder_id: t.holder_id || '',
                  payment_mode: t.payment_mode || '',
                }))
              )
            }
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <Download size={14} /> Export loaded
          </Button>
        )}
      </div>

      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <LoadingState />
      ) : txns.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Receipt} title="No activity yet" subtitle="Deposits and expenses will show up here" />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-text-muted mb-2">{dateLabel}</p>
              <div className="record-list">
                {items.map((t) => (
                  <Card key={t.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.type === 'deposit' ? (
                        <ArrowDownLeft size={16} className="text-receive shrink-0" />
                      ) : (
                        <ArrowUpRight size={16} className="text-owe shrink-0" />
                      )}
                      <div>
                        <p className="record-title">{t.reason || (t.type === 'deposit' ? 'Fund deposit' : 'Expense')}</p>
                        <p className="record-meta text-text-muted">
                          {t.type === 'expense' && t.category ? `${t.category} · ` : ''}{t.payment_mode ? `${t.payment_mode} · ` : ''}by {t.profiles?.full_name || 'Someone'}
                        </p>
                      </div>
                    </div>
                    <p className={`font-semibold ${t.type === 'deposit' ? 'text-receive' : 'text-owe'}`}>
                      {t.type === 'deposit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <Button variant="secondary" loading={loadingMore} onClick={loadMore} className="w-full">
              {loadingMore ? 'Loading...' : 'Load more'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
