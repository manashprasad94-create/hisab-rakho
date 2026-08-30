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

  useEffect(() => {
    listUpdates(50).then((data) => {
      setUpdates(data)
      setLoading(false)
    })
  }, [])

  const handleClick = async (u: any) => {
    if (!u.read) {
      await markUpdateRead(u.id)
      setUpdates((prev) => prev.map((x) => (x.id === u.id ? { ...x, read: true } : x)))
    }
    if (u.action_url) navigate(u.action_url)
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Bell size={20} className="text-primary" /> Updates
      </h1>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : updates.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Bell} title="No updates yet" subtitle="Activity from friends and your group fund will show up here" />
        </Card>
      ) : (
        <div className="space-y-2">
          {updates.map((u) => (
            <Card
              key={u.id}
              onClick={() => handleClick(u)}
              className={`p-3 ${!u.read ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!u.read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                <div className={!u.read ? '' : 'pl-3.5'}>
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="text-xs text-text-muted">{u.body}</p>
                  <p className="text-[10px] text-text-muted mt-1">{new Date(u.created_at).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}