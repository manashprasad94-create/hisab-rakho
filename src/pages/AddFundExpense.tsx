import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, UtensilsCrossed, ShoppingBag, MoreHorizontal, Zap, Wrench } from 'lucide-react'
import { addFundExpense } from '../lib/groupFund'
import Card from '../components/card'
import Button from '../components/Button'

const CATEGORIES = [
  { id: 'groceries', label: 'Groceries', icon: ShoppingBag },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'utilities', label: 'Utilities', icon: Zap },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

export default function AddFundExpense() {
  const { fundId } = useParams<{ fundId: string }>()
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('groceries')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!reason.trim()) return setError('Enter what this was spent on')
    if (!fundId) return

    setLoading(true)
    try {
      await addFundExpense(fundId, Number(amount), reason, category)
      navigate(`/group-fund/${fundId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Add Fund Expense</h1>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          {error && <p className="text-owe text-sm mb-3">{error}</p>}

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

          <label className="block text-sm mb-2 text-text-muted font-medium">Category</label>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition ${
                  category === id ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'
                }`}
              >
                <Icon size={16} />
                <span className="text-[9px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          <label className="block text-sm mb-1 text-text-muted font-medium">Spent On</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Weekly vegetables & rice"
            className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Add Expense'}
        </Button>
      </form>
    </div>
  )
}