import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, StickyNote, Trash2 } from 'lucide-react'
import { listExternalTransactions, markExternalAsSettled, deleteExternalTransaction } from '../lib/externalTransactions'
import Card from '../components/card'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'

export default function PersonalNotes() {
  const navigate = useNavigate()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const data = await listExternalTransactions()
    setNotes(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkSettled = async (id: string) => {
    await markExternalAsSettled(id)
    loadData()
  }

  const handleDelete = async (id: string) => {
    await deleteExternalTransaction(id)
    loadData()
  }

  const totalTheyOwe = notes
    .filter((n) => n.direction === 'they_owe_me' && n.status !== 'settled')
    .reduce((sum, n) => sum + Number(n.remaining_amount), 0)
  const totalIOwe = notes
    .filter((n) => n.direction === 'i_owe_them' && n.status !== 'settled')
    .reduce((sum, n) => sum + Number(n.remaining_amount), 0)

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-1">Personal Notes</h1>
      <p className="text-xs text-text-muted mb-4">Only visible to you — for people who don't use Hisab Kitab</p>

      <div className="flex gap-3 mb-5">
        <Card className="flex-1 p-4">
          <p className="text-xs text-text-muted font-medium mb-1">They Owe Me</p>
          <p className="text-xl font-semibold text-receive">₹{totalTheyOwe.toFixed(0)}</p>
        </Card>
        <Card className="flex-1 p-4">
          <p className="text-xs text-text-muted font-medium mb-1">I Owe Them</p>
          <p className="text-xl font-semibold text-owe">₹{totalIOwe.toFixed(0)}</p>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : notes.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={StickyNote} title="No notes yet" subtitle="Add one from 'Add Transaction' → Not in your friends list?" />
        </Card>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => {
            const isSettled = n.status === 'settled'
            return (
              <Card
                key={n.id}
                className={`p-3 ${isSettled ? 'bg-primary/5 border-primary/20' : n.direction === 'they_owe_me' ? 'bg-receive/5 border-receive/20' : 'bg-owe/5 border-owe/20'}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{n.contact_name}</p>
                    <p className="text-xs text-text-muted">
                      {n.reason || 'No reason'} · {isSettled ? 'settled' : n.direction === 'they_owe_me' ? 'they owe you' : 'you owe them'}
                    </p>
                  </div>
                  <p className={`font-semibold ${isSettled ? 'text-primary' : n.direction === 'they_owe_me' ? 'text-receive' : 'text-owe'}`}>
                    {isSettled ? '✓' : `₹${Number(n.remaining_amount).toFixed(2)}`}
                  </p>
                </div>
                {!isSettled && (
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => handleMarkSettled(n.id)} className="text-xs py-1.5 px-3 flex-1">
                      Mark as Settled
                    </Button>
                    <button onClick={() => handleDelete(n.id)} className="text-text-muted hover:text-owe transition px-2">
                      <Trash2 size={15} />
                    </button>
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