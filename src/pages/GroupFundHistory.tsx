import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { listFundTransactions } from '../lib/groupFund'
import Card from '../components/card'
import EmptyState from '../components/EmptyState'

export default function GroupFundHistory() {
  const navigate = useNavigate()
  const [txns, setTxns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFundTransactions().then((data) => {
      setTxns(data)
      setLoading(false)
    })
  }, [])

  const groupedByDate = txns.reduce((groups: Record<string, any[]>, t) => {
    const dateKey = new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(t)
    return groups
  }, {})

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Fund History</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : txns.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Receipt} title="No activity yet" subtitle="Deposits and expenses will show up here" />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold text-text-muted mb-2">{dateLabel}</p>
              <div className="space-y-2">
                {items.map((t) => (
                  <Card key={t.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {t.type === 'deposit' ? (
                        <ArrowDownLeft size={16} className="text-receive shrink-0" />
                      ) : (
                        <ArrowUpRight size={16} className="text-owe shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{t.reason || (t.type === 'deposit' ? 'Fund deposit' : 'Expense')}</p>
                        <p className="text-xs text-text-muted">
                          {t.type === 'expense' && t.category ? `${t.category} · ` : ''}by {t.profiles?.full_name || 'Someone'}
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
        </div>
      )}
    </div>
  )
}