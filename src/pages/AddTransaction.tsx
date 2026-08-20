import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { listFriends } from '../lib/friends'
import { createTransaction, createGroupExpense } from '../lib/transactions'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

export default function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedFriend = searchParams.get('friendId') || ''

  const [friends, setFriends] = useState<any[]>([])
  const [friendId, setFriendId] = useState(preselectedFriend)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('other')
  const [direction] = useState<'i_paid' | 'they_paid'>('i_paid')
  const [mode, setMode] = useState<'single' | 'group'>('single')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listFriends().then(setFriends)
  }, [])

  const toggleFriendSelection = (id: string) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount')

    setLoading(true)
    try {
      if (mode === 'group') {
        if (selectedFriends.length === 0) return setError('Select at least one friend')
        await createGroupExpense(selectedFriends, Number(amount), reason, category)
        navigate('/')
      } else {
        if (!friendId) return setError('Select a friend')
        await createTransaction(friendId, Number(amount), reason, category, direction)
        navigate(`/friends/${friendId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-xl font-semibold mb-4">Add Transaction</h1>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
            mode === 'single' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
          }`}
        >
          One Friend
        </button>
        <button
          type="button"
          onClick={() => setMode('group')}
          className={`flex-1 py-2 rounded-xl font-medium border text-sm transition flex items-center justify-center gap-1.5 ${
            mode === 'group' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
          }`}
        >
          <Users size={14} /> Split with Group
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          {error && <p className="text-owe text-sm mb-3">{error}</p>}

          <label className="block text-sm mb-2 text-text-muted font-medium">
            {mode === 'group' ? 'Split with' : 'Friend'}
          </label>
          {friends.length === 0 ? (
            <p className="text-sm text-text-muted mb-4">No friends yet — add one first.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
              {friends.map((f) => {
                const isSelected = mode === 'group' ? selectedFriends.includes(f.friend.id) : friendId === f.friend.id
                return (
                  <button
                    key={f.friend.id}
                    type="button"
                    onClick={() => (mode === 'group' ? toggleFriendSelection(f.friend.id) : setFriendId(f.friend.id))}
                    className={`flex flex-col items-center gap-1 shrink-0 ${isSelected ? '' : 'opacity-60'}`}
                  >
                    <div className={`rounded-full ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                      <Avatar name={f.friend.full_name} />
                    </div>
                    <span className="text-[11px] font-medium max-w-[60px] truncate">{f.friend.full_name}</span>
                  </button>
                )
              })}
            </div>
          )}
          {mode === 'group' && selectedFriends.length > 0 && amount && (
            <p className="text-xs text-text-muted mb-4">
              Split ₹{amount} between you + {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} = ₹
              {(Number(amount) / (selectedFriends.length + 1)).toFixed(2)} each
            </p>
          )}

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

          <label className="block text-sm mb-1 text-text-muted font-medium">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Pizza Party"
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label className="block text-sm mb-1 text-text-muted font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>

          {mode === 'single' && (
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">
              You paid, your friend will need to accept this before it counts.
            </p>
          )}
          {mode === 'group' && (
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">You paid the full amount, split shows what each friend owes you.</p>
          )}
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  )
}