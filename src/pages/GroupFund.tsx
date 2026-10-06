import StatusMessage from '../components/StatusMessage'
import LoadingState from '../components/LoadingState'
import PageHeader from '../components/PageHeader'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PiggyBank, MinusCircle, PlusCircle, History, Users } from 'lucide-react'
import { getMyRoleInFund, getHolderBalances } from '../lib/groupFund'
import { errorMessage } from '../lib/errorMessage'
import { supabase } from '../lib/supabase'
import Card from '../components/card'
import Button from '../components/Button'

export default function GroupFund() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [role, setRole] = useState<'owner' | 'admin' | 'member' | null>(null)
  const [holderBalances, setHolderBalances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [notMember, setNotMember] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!fundId) return
    try {
      const r = await getMyRoleInFund(fundId)
      if (!r) {
        setNotMember(true)
        return
      }
      setRole(r)
      setHolderBalances(await getHolderBalances(fundId))
    } catch (err) {
      setError(errorMessage(err, 'Could not load fund'))
    } finally {
      setLoading(false)
    }
  }, [fundId])

  useEffect(() => {
    loadData()
    if (!fundId) return
    const channel = supabase.channel(`group-fund-${fundId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'group_fund_balances', filter: `fund_id=eq.${fundId}`,
      }, () => { loadData() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fundId, loadData])

  if (loading) {
    return (
      <div className="app-page">
        <LoadingState label="Loading fund balances" />
      </div>
    )
  }

  if (notMember) {
    return (
      <div className="app-page">
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
    <div className="app-page">
      <button onClick={() => navigate('/group-funds')} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> All Funds
      </button>
      <PageHeader title={<> <PiggyBank size={22} className="text-primary" /> Group Fund </>} />
      <p className="text-xs text-text-muted mb-4">Shared with your group · {role}</p>
      {error && <StatusMessage>{error}</StatusMessage>}

      <div className="bg-primary text-white rounded-2xl p-6 mb-4 shadow-sm">
        <p className="text-sm opacity-80">Total Remaining</p>
        <p className="text-3xl font-semibold mt-1">₹{totalRemaining.toFixed(2)}</p>
      </div>

      {holderBalances.length > 0 && (
        <div className="record-list mb-4">
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
        {role === 'owner' && (
          <Button onClick={() => navigate(`/group-fund/${fundId}/deposit`)} className="flex-1 flex items-center justify-center gap-2">
            <PlusCircle size={16} /> Add Money
          </Button>
        )}
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
