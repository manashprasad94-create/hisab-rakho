import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import { listUpdates, markUpdateRead } from '../lib/updates'
import Card from '../components/card'
import EmptyState from '../components/EmptyState'

export default function Updates() {
  const navigate = useNavigate()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listUpdates(5).then((data) => {
      setUpdates(data)
    }).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load updates')
    }).finally(() => setLoading(false))
  }, [])

  const handleClick = async (u: any) => {
    try {
      if (!u.read) {
        await markUpdateRead(u.id)
        setUpdates((prev) => prev.map((x) => (x.id === u.id ? { ...x, read: true } : x)))
      }
      if (u.action_url) navigate(u.action_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark update as read')
    }
  }

  return (
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> <Bell size={20} className="text-primary" /> Updates </>} />
      {error && <StatusMessage>{error}</StatusMessage>}

      {loading ? (
        <LoadingState />
      ) : updates.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Bell} title="No updates yet" subtitle="Activity from friends and your group fund will show up here" />
        </Card>
      ) : (
        <div className="record-list">
          {updates.map((u) => (
            <Card
              key={u.id}
              onClick={() => handleClick(u)}
              className={`p-3 ${!u.read ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!u.read && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                <div className={!u.read ? '' : 'pl-3.5'}>
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="record-meta text-text-muted">{u.body}</p>
                  <p className="text-xs text-text-muted mt-1">{new Date(u.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
