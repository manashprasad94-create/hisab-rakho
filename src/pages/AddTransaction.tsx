import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input, Select } from '../components/FormControls'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Users, Search } from 'lucide-react'
import { listFriends, searchUserByEmail, searchUserByPhone, sendFriendRequest } from '../lib/friends'
import { createTransaction, createGroupExpense, createBulkTransactions, checkReciprocalPending, acceptTransaction } from '../lib/transactions'
import { createExternalTransaction } from '../lib/externalTransactions'
import { errorMessage } from '../lib/errorMessage'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import FriendSelect from '../components/FriendSelect'
import TransactionQuickEntry from '../components/TransactionQuickEntry'

export default function AddTransaction() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedFriend = searchParams.get('friendId') || ''

  const [friends, setFriends] = useState<any[]>([])
  const [friendId, setFriendId] = useState(preselectedFriend)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('other')
  const [direction, setDirection] = useState<'i_paid' | 'they_paid'>('i_paid')
  const [mode, setMode] = useState<'single' | 'group' | 'bulk'>('single')
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

  // personal note (for people not on the app)
  const [showPersonalNote, setShowPersonalNote] = useState(false)
  const [noteName, setNoteName] = useState('')
  const [noteDirection, setNoteDirection] = useState<'they_owe_me' | 'i_owe_them'>('they_owe_me')
  useEffect(() => {
    listFriends().then(setFriends).catch((err) => {
      setError(err instanceof Error ? err.message : 'Could not load friends')
    })
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
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 ||
        Math.abs(Number(amount) * 100 - Math.round(Number(amount) * 100)) > 1e-8) {
      return setError('Enter a valid amount with at most two decimal places')
    }

    setLoading(true)
    try {
      if (showPersonalNote) {
        if (!noteName.trim()) return setError('Enter a name')
        await createExternalTransaction(noteName, Number(amount), reason, category, noteDirection)
        navigate('/personal-notes')
        return
      }

      if (mode === 'group') {
        if (selectedFriends.length === 0) return setError('Select at least one friend')
        await createGroupExpense(selectedFriends, Number(amount), reason, category)
        navigate('/')
      } else if (mode === 'bulk') {
        if (selectedFriends.length === 0) return setError('Select at least one friend')
        await createBulkTransactions(selectedFriends, Number(amount), reason, category)
        navigate('/')
      } else {
        if (!friendId) return setError('Select a friend')

        if (direction === 'they_paid' && !reciprocalMatch) {
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
      setError(errorMessage(err, 'Failed to create transaction'))
    } finally {
      setLoading(false)
    }
  }

       const selectedNonFriendName = friendId && !friends.some((f) => f.friend.id === friendId) ? nonFriendResult?.full_name : null

  return (
    <div className="app-page">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted mb-3 text-sm">
        <ArrowLeft size={16} /> Back
      </button>
      <PageHeader title={<> Add Transaction </>} />

      <TransactionQuickEntry friends={friends.map((f) => ({ id: f.friend.id, name: f.friend.full_name || 'Unnamed friend' }))} onApply={(draft) => {
        setMode(draft.mode!); setAmount(draft.amount!); setReason(draft.reason); setCategory(draft.category)
        setDirection(draft.direction!); setReciprocalMatch(null); setError('')
        if (draft.mode === 'single') setFriendId(draft.friendIds[0])
        else setSelectedFriends(draft.friendIds)
        setShowPersonalNote(false); setShowNonFriendSearch(false); setNonFriendResult(null)
        requestAnimationFrame(() => document.getElementById('addtransaction-field-8')?.focus())
      }} />

      <div className="transaction-modes mb-4">
        <button aria-pressed={mode === 'single'}
          type="button"
          onClick={() => setMode('single')}
          className={`flex-1 py-2 rounded-xl font-medium border text-sm transition ${
            mode === 'single' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
          }`}
        >
          One Friend
        </button>
        <button aria-pressed={mode === 'group'}
          type="button"
          onClick={() => setMode('group')}
          className={`flex-1 py-2 rounded-xl font-medium border text-sm transition flex items-center justify-center gap-1.5 ${
            mode === 'group' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
          }`}
        >
          <Users size={14} /> Split
        </button>
        <button aria-pressed={mode === 'bulk'}
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 py-2 rounded-xl font-medium border text-sm transition flex items-center justify-center gap-1.5 ${
            mode === 'bulk' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
          }`}
        >
          <Users size={14} /> Same Amount Each
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-4 mb-4">
          {error && <StatusMessage>{error}</StatusMessage>}

          {mode === 'single' && !showPersonalNote && (
            <div className="flex gap-2 mb-4" aria-label="Who paid">
              <button aria-pressed={direction === 'i_paid'} type="button" onClick={() => setDirection('i_paid')}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium ${direction === 'i_paid' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}>
                I paid
              </button>
              <button aria-pressed={direction === 'they_paid'} type="button" onClick={() => setDirection('they_paid')}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium ${direction === 'they_paid' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'}`}>
                They paid
              </button>
            </div>
          )}

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
            {mode === 'single' && !showPersonalNote && (
              <button
                type="button"
                onClick={() => setShowNonFriendSearch((v) => !v)}
                className="text-xs text-primary font-medium"
              >
                {showNonFriendSearch ? 'Cancel' : "Not in your friends list?"}
              </button>
            )}
          </div>

          {mode === 'single' && showNonFriendSearch && !showPersonalNote && (
            <button
              type="button"
              onClick={() => { setShowNonFriendSearch(false); setShowPersonalNote(true) }}
              className="text-xs text-primary font-medium mb-3 block"
            >
              They don't use Hisab Kitab? Add as a personal note instead →
            </button>
          )}

          {showPersonalNote && (
            <div className="mb-4 p-3 bg-bg-soft rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-text-muted">Personal note — only visible to you, self-managed</p>
                <button
                  type="button"
                  onClick={() => setShowPersonalNote(false)}
                  className="text-xs text-primary font-medium"
                >
                  Cancel
                </button>
              </div>
              <label htmlFor="addtransaction-field-6" className="block text-sm mb-1 text-text-muted font-medium">Their Name</label>
              <Input id="addtransaction-field-6"
                type="text"
                value={noteName}
                onChange={(e) => setNoteName(e.target.value)}
                placeholder="e.g. Neighbor Sharma"
                className="w-full mb-3 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <label className="block text-sm mb-2 text-text-muted font-medium">Direction</label>
              <div className="flex gap-2">
                <button aria-pressed={noteDirection === 'they_owe_me'}
                  type="button"
                  onClick={() => setNoteDirection('they_owe_me')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                    noteDirection === 'they_owe_me' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
                  }`}
                >
                  They Owe Me
                </button>
                <button aria-pressed={noteDirection === 'i_owe_them'}
                  type="button"
                  onClick={() => setNoteDirection('i_owe_them')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                    noteDirection === 'i_owe_them' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted'
                  }`}
                >
                  I Owe Them
                </button>
              </div>
            </div>
          )}

          {showNonFriendSearch && mode === 'single' && (
            <div className="mb-4 p-3 bg-bg-soft rounded-xl">
              <div className="flex gap-2 mb-2">
                <button aria-pressed={nonFriendMode === 'email'}
                  type="button"
                  onClick={() => { setNonFriendMode('email'); setNonFriendQuery(''); setNonFriendResult(null); setNonFriendMessage('') }}
                  className={`text-xs px-3 py-1 rounded-lg font-medium ${nonFriendMode === 'email' ? 'bg-primary text-white' : 'bg-white text-text-muted'}`}
                >
                  Email
                </button>
                <button aria-pressed={nonFriendMode === 'phone'}
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
                  <Input aria-label="Search by email or phone"
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

          {!showPersonalNote && (friends.length === 0 ? (
            <p className="text-sm text-text-muted mb-4">No friends yet — search above to add one.</p>
          ) : (
            <FriendSelect
              key={mode}
              friends={friends.map((f) => ({ id: f.friend.id, name: f.friend.full_name }))}
              multiple={mode !== 'single'}
              selectedIds={mode === 'single' ? (friendId ? [friendId] : []) : selectedFriends}
              onSelect={mode === 'single' ? setFriendId : toggleFriendSelection}
            />
          ))}
          {mode === 'group' && selectedFriends.length > 0 && amount && (
            <p className="text-xs text-text-muted mb-4">
              Split ₹{amount} between you + {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''}.
              Shares are rounded to cents; some may differ by ₹0.01.
            </p>
          )}
                    {mode === 'bulk' && selectedFriends.length > 0 && amount && (
            <p className="text-xs text-text-muted mb-4">
              Each of {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''} will get their own ₹{amount} transaction
            </p>
          )}

          <label htmlFor="addtransaction-field-8" className="block text-sm mb-1 text-text-muted font-medium">Amount</label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">₹</span>
            <Input id="addtransaction-field-8"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-border rounded-xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label htmlFor="addtransaction-field-9" className="block text-sm mb-1 text-text-muted font-medium">Reason</label>
          <Input id="addtransaction-field-9"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Pizza Party"
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label htmlFor="addtransaction-field-10" className="block text-sm mb-1 text-text-muted font-medium">Category</label>
          <Select id="addtransaction-field-10"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="food">Food</option>
            <option value="travel">Travel</option>
            <option value="shopping">Shopping</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </Select>

          {mode === 'single' && (
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">
              {direction === 'i_paid' ? 'You paid' : 'Your friend paid'}; your friend will need to accept this before it counts.
            </p>
          )}
          {mode === 'group' && (
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">
              You paid the full amount, split shows what each friend owes you.
            </p>
          )}
                    {mode === 'bulk' && (
            <p className="text-xs text-text-muted bg-bg-soft p-3 rounded-xl">
              Each selected friend will owe you the full ₹{amount || '0'} separately.
            </p>
          )}
        </Card>

        <Button type="submit" loading={loading} className="w-full">
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  )
}
