import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { listAllTransactions } from '../lib/transactions'
import { supabase } from '../lib/supabase'
import Card from '../components/card'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { Wallet } from 'lucide-react'

export default function BalanceBreakdown() {
  const { type } = useParams<{ type: 'receive' | 'pay' }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    listAllTransactions().then(async (txns) => {
      const perFriend: Record<string, number> = {}

      for (const t of txns) {
        if (t.status === 'settled' || t.status === 'pending_acceptance') continue
        const iAmOwed = t.payer_id === user.id
        const friendId = iAmOwed ? t.payee_id : t.payer_id

        if (type === 'receive' && iAmOwed) {
          perFriend[friendId] = (perFriend[friendId] || 0) + Number(t.remaining_amount)
        }
        if (type === 'pay' && !iAmOwed) {
          perFriend[friendId] = (perFriend[friendId] || 0) + Number(t.remaining_amount)
        }
      }

      const friendIds = Object.keys(perFriend)
      if (friendIds.length === 0) {
        setRows([])
        setLoading(false)
        return
      }

      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', friendIds)

      const merged = (profiles || [])
        .map((p) => ({ friend: p, amount: perFriend[p.id] }))
        .sort((a, b) => b.amount - a.amount)

      setRows(merged)
      setLoading(false)
    })
  }, [user, type])

  const title = type === 'receive' ? "You'll Get" : "You'll Pay"

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Wallet} title="Nothing here" subtitle="No pending balances of this type" />
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card
              key={r.friend.id}
              onClick={() => navigate(`/friends/${r.friend.id}`)}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar name={r.friend.full_name} />
                <span className="font-medium">{r.friend.full_name}</span>
              </div>
              <p className={`font-semibold ${type === 'receive' ? 'text-receive' : 'text-owe'}`}>
                ₹{r.amount.toFixed(2)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}