import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'
import { listFundMembers, addFundMember, getMyRoleInFund } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

export default function FundMembers() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [message, setMessage] = useState('')
  const [adding, setAdding] = useState(false)

  const loadData = async () => {
    if (!fundId) return
    const r = await getMyRoleInFund(fundId)
    setIsOwner(r === 'owner')
    const data = await listFundMembers(fundId)
    setMembers(data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [fundId])

  const handleAdd = async () => {
    if (!fundId || !email.trim()) return
    setAdding(true)
    setMessage('')
    try {
      await addFundMember(fundId, email, role)
      setEmail('')
      setMessage('Member added')
      loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Users size={20} className="text-primary" /> Members
      </h1>

      {isOwner && (
        <Card className="p-4 mb-4">
          <label className="block text-sm mb-1 text-text-muted font-medium">Add member by email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="their@email.com"
            className="w-full mb-3 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRole('member')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${role === 'member' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
            >
              View-only Member
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${role === 'admin' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
            >
              Admin (can add expenses)
            </button>
          </div>
          {message && <p className="text-xs text-text-muted mb-2">{message}</p>}
          <Button onClick={handleAdd} disabled={adding} className="w-full flex items-center justify-center gap-2">
            <UserPlus size={16} /> {adding ? 'Adding...' : 'Add Member'}
          </Button>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={m.profiles?.full_name || '?'} size="sm" />
                <span className="text-sm font-medium">{m.profiles?.full_name}</span>
              </div>
              <span className="text-xs text-text-muted capitalize">{m.role}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}