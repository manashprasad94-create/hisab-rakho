import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { addFundDeposit, listFundMembers } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'

export default function AddFunds() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('online')
  const [holders, setHolders] = useState<any[]>([])
  const [holderId, setHolderId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!fundId) return
    listFundMembers(fundId).then((members) => {
      const filtered = members.filter((m: any) => m.role === 'owner' || m.role === 'admin')
      setHolders(filtered)
      if (filtered.length > 0) setHolderId(filtered[0].user_id)
    })
  }, [fundId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!fundId || !holderId) return

    setLoading(true)
    try {
      await addFundDeposit(fundId, holderId, Number(amount), reason, paymentMode)
      navigate(`/group-fund/${fundId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add funds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Add Funds</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          {error && <p className="text-owe text-sm mb-3">{error}</p>}

          <label className="block text-sm mb-2 text-text-muted font-medium">Held By</label>
          <div className="flex gap-2 mb-4">
            {holders.map((h: any) => (
              <button
                key={h.user_id}
                type="button"
                onClick={() => setHolderId(h.user_id)}
                className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
                  holderId === h.user_id ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
                }`}
              >
                {h.profiles?.full_name || 'Unknown'}
              </button>
            ))}
          </div>

          <label className="block text-sm mb-1 text-text-muted font-medium">Amount</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-border rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="block text-sm mb-2 text-text-muted font-medium">Payment Mode</label>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
                paymentMode === 'cash' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
              }`}
            >
              Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('online')}
              className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
                paymentMode === 'online' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
              }`}
            >
              Online
            </button>
          </div>

          <label className="block text-sm mb-1 text-text-muted font-medium">Note</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. September contribution — all members"
            className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Add Funds'}
        </Button>
      </form>
    </div>
  )
}