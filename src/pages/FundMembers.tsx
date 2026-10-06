import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input } from '../components/FormControls'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus } from 'lucide-react'
import { listFundMembers, addFundMember, getMyRoleInFund } from '../lib/groupFund'
import { errorMessage } from '../lib/errorMessage'
import Card from '../components/card'
import Badge from '../components/Badge'
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

  const loadData = useCallback(async () => {
    if (!fundId) return
    try {
      const r = await getMyRoleInFund(fundId)
      setIsOwner(r === 'owner')
      if (!r) throw new Error('You are not a member of this fund')
      setMembers(await listFundMembers(fundId))
    } catch (err) {
      setMessage(errorMessage(err, 'Could not load members'))
    } finally {
      setLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    loadData()
  }, [loadData])

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
      setMessage(errorMessage(err, 'Failed to add member'))
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> <Users size={20} className="text-primary" /> Members </>} />
      {!isOwner && message && <p role="alert" className="text-owe text-sm mb-3">{message}</p>}

      {isOwner && (
        <Card className="p-4 mb-4">
          <label htmlFor="fundmembers-field-18" className="block text-sm mb-1 text-text-muted font-medium">Add member by email</label>
          <Input id="fundmembers-field-18"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="their@email.com"
            className="w-full mb-3 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2 mb-3">
            <button aria-pressed={role === 'member'}
              type="button"
              onClick={() => setRole('member')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${role === 'member' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
            >
              View-only Member
            </button>
            <button aria-pressed={role === 'admin'}
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${role === 'admin' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}
            >
              Admin (can add expenses)
            </button>
          </div>
          {message && <StatusMessage tone="info">{message}</StatusMessage>}
          <Button onClick={handleAdd} loading={adding} className="w-full flex items-center justify-center gap-2">
            <UserPlus size={16} /> {adding ? 'Adding...' : 'Add Member'}
          </Button>
        </Card>
      )}

      {loading ? (
        <LoadingState />
      ) : (
        <div className="record-list">
          {members.map((m) => (
            <Card key={m.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={m.profiles?.full_name || '?'} size="sm" />
                <span className="text-sm font-medium">{m.profiles?.full_name}</span>
              </div>
              <span className="capitalize"><Badge>{m.role}</Badge></span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
