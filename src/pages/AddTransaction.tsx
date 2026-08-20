import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Users, Search } from 'lucide-react'
import { listFriends, searchUserByEmail, searchUserByPhone, sendFriendRequest } from '../lib/friends'
import { createTransaction, createGroupExpense, checkReciprocalPending, acceptTransaction } from '../lib/transactions'
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
  const [reciprocalMatch, setReciprocalMatch] = useState<any>(null)

  // not-a-friend-yet search
  const [showNonFriendSearch, setShowNonFriendSearch] = useState(false)
  const [nonFriendMode, setNonFriendMode] = useState<'email' | 'phone'>('email')
  const [nonFriendQuery, setNonFriendQuery] = useState('')
  const [nonFriendResult, setNonFriendResult] = useState<any>(null)
  const [nonFriendMessage, setNonFriendMessage] = useState('')

  useEffect(() => {
    listFriends().then(setFriends)
  }, [])

  const toggleFriendSelection = (id: string) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const handleNonFriendSearch = async () => {
    setNonFriendMessage('')
    setNonFriendResult(null)
    const result =
      nonFriendMode === 'email' ? await searchUserByEmail(nonFriendQuery) : await searchUserByPhone(nonFriendQuery)
    if (!result) {
      setNonFriendMessage('No user found with this ' + nonFriendMode)
    } else {
      setNonFriendResult(result)
    }
  }

  const handleUseNonFriend = async () => {
    if (!nonFriendResult) return
    setFriendId(nonFriendResult.id)
    // fire a friend request in background, ignore if already exists/pending
    sendFriendRequest(nonFriendResult.id).catch(() => {})
    setShowNonFriendSearch(false)
    setNonFriendResult(null)
    setNonFriendQuery('')
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

        if (!reciprocalMatch) {
          const match = await checkReciprocalPending(friendId, Number(amount))
          if (match) {
            setReciprocalMatch(match)
            setLoading(false)
            return
          }
        }

        await createTransaction(friendId, Number(amount), reason, category, direction)
        navigate(`/friends/${friendId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    } finally {
      setLoading(false)
    }
  }

  const selectedNonFriendName = friendId && !friends.some((f) => f.friend.id === friendId) ? nonFriendResult?.full_name : null

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

          {reciprocalMatch && (
            <div className="mb-4 p-3 bg-bg-soft rounded-xl text-sm">
              <p className="text-text-muted mb-2">
                Looks like this friend already sent a similar request for ₹{reciprocalMatch.amount}. Did you mean to accept that instead of creating a new one?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    await acceptTransaction(reciprocalMatch.id)
                    navigate(`/friends/${friendId}`)
                  }}
                  className="text-xs py-1.5 px-3"
                >
                  Accept Their Request
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReciprocalMatch(null)}
                  className="text-xs py-1.5 px-3"
                >
                  No, Continue Creating New
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-text-muted font-medium">
              {mode === 'group' ? 'Split with' : 'Friend'}
            </label>
            {mode === 'single' && (
              <button
                type="button"
                onClick={() => setShowNonFriendSearch((v) => !v)}
                className="text-xs text-primary font-medium"
              >
                {showNonFriendSearch ? 'Cancel' : "Not in your friends list?"}
              </button>
            )}
          </div>

          {showNonFriendSearch && mode === 'single' && (
            <div className="mb-4 p-3 bg-bg-soft rounded-xl">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => { setNonFriendMode('email'); setNonFriendQuery(''); setNonFriendResult(null); setNonFriendMessage('') }}
                  className={`text-xs px-3 py-1 rounded-lg font-medium ${nonFriendMode === 'email' ? 'bg-primary text-white' : 'bg-white text-text-muted'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setNonFriendMode('phone'); setNonFriendQuery(''); setNonFriendResult(null); setNonFriendMessage('') }}
                  className={`text-xs px-3 py-1 rounded-lg font-medium ${nonFriendMode === 'phone' ? 'bg-primary text-white' : 'bg-white text-text-muted'}`}
                >
                  Phone
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={nonFriendMode === 'email' ? 'email' : 'tel'}
                    value={nonFriendQuery}
                    onChange={(e) => setNonFriendQuery(e.target.value)}
                    placeholder={nonFriendMode === 'email' ? 'their@email.com' : '+91 9876543210'}
                    className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="button" onClick={handleNonFriendSearch} className="text-sm py-2 px-3">
                  Search
                </Button>
              </div>
              {nonFriendMessage && <p className="text-xs text-text-muted mt-2">{nonFriendMessage}</p>}
              {nonFriendResult && (
                <div className="flex items-center justify-between mt-2 p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar name={nonFriendResult.full_name} size="sm" />
                    <span className="text-sm font-medium">{nonFriendResult.full_name}</span>
                  </div>
                  <Button type="button" onClick={handleUseNonFriend} className="text-xs py-1.5 px-3">
                    Use
                  </Button>
                </div>
              )}
            </div>
          )}

          {selectedNonFriendName && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-primary/10 rounded-xl">
              <Avatar name={selectedNonFriendName} size="sm" />
              <span className="text-sm font-medium">{selectedNonFriendName}</span>
              <span className="text-xs text-text-muted ml-auto">Friend request sent</span>
            </div>
          )}

          {friends.length === 0 ? (
            <p className="text-sm text-text-muted mb-4">No friends yet — search above to add one.</p>
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
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">
              You paid the full amount, split shows what each friend owes you.
            </p>
          )}
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  )
}