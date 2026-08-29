import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PiggyBank, Plus, MinusCircle, History, Users } from 'lucide-react'
import { getMyRoleInFund, getFundSummary } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'

export default function GroupFund() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const [summary, setSummary] = useState({ total: 0, used: 0, remaining: 0 })
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
    const s = await getFundSummary(fundId)
    setSummary(s)
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
  const canAddFunds = role === 'owner'

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
        <p className="text-sm opacity-80">Remaining</p>
        <p className="text-3xl font-semibold mt-1">₹{summary.remaining.toFixed(2)}</p>
        <div className="flex justify-between mt-4 pt-4 border-t border-white/20 text-sm">
          <div>
            <p className="opacity-70">Total Added</p>
            <p className="font-medium">₹{summary.total.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="opacity-70">Total Used</p>
            <p className="font-medium">₹{summary.used.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {canAddFunds && (
          <Button onClick={() => navigate(`/group-fund/${fundId}/add-funds`)} className="flex-1 flex items-center justify-center gap-2">
            <Plus size={16} /> Add Funds
          </Button>
        )}
        {canAddExpense && (
          <Button variant="secondary" onClick={() => navigate(`/group-fund/${fundId}/add-expense`)} className="flex-1 flex items-center justify-center gap-2">
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