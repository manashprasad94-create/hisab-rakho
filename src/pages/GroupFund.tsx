import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PiggyBank, MinusCircle, History, Users } from 'lucide-react'
import { getMyRoleInFund, getHolderBalances } from '../lib/groupFund'
import Card from '../components/Card'
import Button from '../components/Button'

export default function GroupFund() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const [holderBalances, setHolderBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notMember, setNotMember] = useState(false)

  const loadData = async () => {
    if (!fundId) return
    const r = await getMyRoleInFund(fundId)
    if (!r) {
      setNotMember(true)
      setLoading(false)
      return
    }
    setRole(r)
    const holders = await getHolderBalances(fundId)
    setHolderBalances(holders)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [fundId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-soft p-4">
        <div className="h-32 bg-white/60 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (notMember) {
    return (
      <div className="min-h-screen bg-bg-soft p-4 flex items-center justify-center">
        <Card className="p-6 text-center max-w-sm">
          <PiggyBank size={32} className="text-primary mx-auto mb-3" />
          <p className="font-medium">You're not part of this fund</p>
          <p className="text-sm text-text-muted mt-1">Ask the admin to add you if you should have access.</p>
          <Button variant="secondary" onClick={() => navigate('/dashboard', { replace: true })} className="w-full mt-4">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    )
  }

  const canAddExpense = role === 'owner' || role === 'admin'
  const totalRemaining = holderBalances.reduce((sum, h) => sum + h.total, 0)

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate('/group-funds')} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> All Funds
      </button>
      <h1 className="text-xl font-semibold mb-1 flex items-center gap-2">
        <PiggyBank size={22} className="text-primary" /> Group Fund
      </h1>
      <p className="text-xs text-text-muted mb-4">Shared with your group · {role}</p>

      <div className="bg-primary text-white rounded-2xl p-6 mb-4 shadow-sm">
        <p className="text-sm opacity-80">Total Remaining</p>
        <p className="text-3xl font-semibold mt-1">₹{totalRemaining.toFixed(2)}</p>
      </div>

      {holderBalances.length > 0 && (
        <div className="space-y-2 mb-4">
          {holderBalances.map((h) => (
            <Card key={h.userId} className="p-3">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium">{h.name}'s Balance</p>
                <p className="text-sm font-semibold text-primary">₹{h.total.toFixed(2)}</p>
              </div>
              <div className="flex gap-4 text-xs text-text-muted">
                <span>Cash: ₹{h.cash.toFixed(2)}</span>
                <span>Online: ₹{h.online.toFixed(2)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {canAddExpense && (
          <Button onClick={() => navigate(`/group-fund/${fundId}/add-expense`)} className="flex-1 flex items-center justify-center gap-2">
            <MinusCircle size={16} /> Add Expense
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => navigate(`/group-fund/${fundId}/history`)} className="flex-1 flex items-center justify-center gap-2">
          <History size={16} /> History
        </Button>
        {role === 'owner' && (
          <Button variant="ghost" onClick={() => navigate(`/group-fund/${fundId}/members`)} className="flex-1 flex items-center justify-center gap-2">
            <Users size={16} /> Members
          </Button>
        )}
      </div>
    </div>
  )
}