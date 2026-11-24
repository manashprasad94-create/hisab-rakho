import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { listFriendBalances } from '../lib/transactions'
import { listFriends } from '../lib/friends'
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
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError('')
    Promise.all([listFriendBalances(), listFriends()]).then(([balances, friendsList]) => {
      const avatarMap = new Map(friendsList.map((f: any) => [f.friend?.id, f.friend?.avatar_url]))
      setRows(balances.filter((row) => row.direction === type).map((row) => ({
        friend: {
          id: row.friend_id,
          full_name: row.full_name || 'Friend',
          avatar_url: avatarMap.get(row.friend_id) || null,
        },
        amount: Number(row.amount),
      })))
      setLoading(false)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load balances')
      setLoading(false)
    })
  }, [user, type])

  const title = type === 'receive' ? "You'll Get" : "You'll Pay"

  return (
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> {title} </>} />
      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <LoadingState />
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
                <Avatar name={r.friend.full_name} src={r.friend.avatar_url || undefined} />
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
