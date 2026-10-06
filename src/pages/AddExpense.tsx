import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input } from '../components/FormControls'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, UtensilsCrossed, ShoppingBag, Plane, Film,GraduationCap, MoreHorizontal } from 'lucide-react'
import { addExpense } from '../lib/expenses'
import { localDate } from '../lib/localDate'
import Card from '../components/card'
import Button from '../components/Button'

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'lunch', label: 'Lunch', icon: UtensilsCrossed },
  { id: 'dinner', label: 'Dinner', icon: UtensilsCrossed },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

export default function AddExpense() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [amount, setAmount] = useState(searchParams.get('amount') || '')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState(searchParams.get('note') || '')
  const [spentOn, setSpentOn] = useState(() => localDate())
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
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> Add Expense </>} />

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          {error && <StatusMessage>{error}</StatusMessage>}

          <label htmlFor="addexpense-field-1" className="block text-sm mb-1 text-text-muted font-medium">Amount</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
            <Input id="addexpense-field-1"
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
              <button aria-pressed={category === id}
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition ${
                  category === id ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary/40'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <label className="block text-sm mb-2 text-text-muted font-medium">Payment Mode</label>
          <div className="flex gap-2 mb-4">
            <button aria-pressed={paymentMode === 'cash'}
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
                paymentMode === 'cash' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
              }`}
            >
              Cash
            </button>
            <button aria-pressed={paymentMode === 'online'}
              type="button"
              onClick={() => setPaymentMode('online')}
              className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
                paymentMode === 'online' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
              }`}
            >
              Online
            </button>
          </div>
          <label htmlFor="expense-date" className="block text-sm mb-2 font-medium">Date</label>
          <Input id="expense-date"
            type="date"
            value={spentOn}
            onChange={(e) => setSpentOn(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label htmlFor="addexpense-field-3" className="block text-sm mb-1 text-text-muted font-medium">Reason</label>
          <Input id="addexpense-field-3"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Lunch with friends"
            className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </Card>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>
    </div>
  )
}
