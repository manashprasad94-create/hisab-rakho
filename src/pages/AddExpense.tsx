import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UtensilsCrossed, Fuel, ShoppingBag, Plane, Film, HeartPulse, GraduationCap, MoreHorizontal } from 'lucide-react'
import { addExpense } from '../lib/expenses'
import Card from '../components/card'
import Button from '../components/Button'

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'fuel', label: 'Fuel', icon: Fuel },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'medical', label: 'Medical', icon: HeartPulse },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

export default function AddExpense() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [amount, setAmount] = useState(searchParams.get('amount') || '')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState(searchParams.get('note') || '')
  const [spentOn, setSpentOn] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMode, setPaymentMode] = useState<'cash' | 'online'>('online')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!note.trim()) return setError('Enter a reason')

    setLoading(true)
    try {
      await addExpense(Number(amount), category, note, spentOn, paymentMode)
      navigate('/expenses')
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
      <h1 className="text-xl font-semibold mb-4">Add Expense</h1>

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
          <div className="grid grid-cols-4 gap-2 mb-4">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition ${
                  category === id ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            ))}
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
          <input
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label className="block text-sm mb-1 text-text-muted font-medium">Reason</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Lunch with friends"
            className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </div>
  )
}