import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users } from 'lucide-react'
import {
  searchUserByEmail,
  searchUserByPhone,
  sendFriendRequest,
  acceptFriendRequest,
  listFriends,
  listPendingRequests,
  createPendingInvite,
} from '../lib/friends'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'

export default function Friends() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [searchMode, setSearchMode] = useState<'email' | 'phone'>('email')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')

  const loadData = async () => {
    const [f, p] = await Promise.all([listFriends(), listPendingRequests()])
    setFriends(f)
    setPending(p)
    setPageLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = async () => {
    setMessage('')
    setSearchResult(null)
    const result = searchMode === 'email' ? await searchUserByEmail(searchEmail) : await searchUserByPhone(searchEmail)
    if (!result) {
      setMessage('not_found')
    } else {
      setSearchResult(result)
    }
  }

  const handleAdd = async (friendId: string) => {
    setLoading(true)
    try {
      await sendFriendRequest(friendId)
      setMessage('Friend request sent')
      setSearchResult(null)
      setSearchEmail('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    setLoading(true)
    try {
      await createPendingInvite(searchEmail)
      setMessage('Invite saved — they will be auto-added once they sign up')
      setSearchEmail('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save invite')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId)
    loadData()
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <h1 className="text-xl font-semibold mb-4">Friends</h1>

      <Card className="p-4 mb-4">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => { setSearchMode('email'); setSearchEmail(''); setSearchResult(null); setMessage('') }}
            className={`text-xs px-3 py-1 rounded-lg font-medium ${searchMode === 'email' ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted'}`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setSearchMode('phone'); setSearchEmail(''); setSearchResult(null); setMessage('') }}
            className={`text-xs px-3 py-1 rounded-lg font-medium ${searchMode === 'phone' ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted'}`}
          >
            Phone
          </button>
        </div>
        <label className="block text-sm mb-2 text-text-muted font-medium">
          Add friend by {searchMode === 'email' ? 'email' : 'phone'}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type={searchMode === 'email' ? 'email' : 'tel'}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder={searchMode === 'email' ? 'friend@email.com' : '+91 9876543210'}
              className="w-full pl-9 pr-3 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {message === 'not_found' ? (
          <div className="mt-2 p-3 bg-bg-soft rounded-lg text-sm">
            <p className="text-text-muted mb-2">This person hasn't joined Hisab Kitab yet.</p>
            {searchMode === 'email' && (
              <Button variant="secondary" onClick={handleInvite} disabled={loading} className="text-sm py-1.5">
                Send Invite
              </Button>
            )}
          </div>
        ) : (
          message && <p className="text-sm text-text-muted mt-2">{message}</p>
        )}

        {searchResult && (
          <div className="flex items-center justify-between mt-3 p-3 bg-bg-soft rounded-xl">
            <div className="flex items-center gap-2">
              <Avatar name={searchResult.full_name} size="sm" />
              <span className="text-sm font-medium">{searchResult.full_name}</span>
            </div>
            <Button onClick={() => handleAdd(searchResult.id)} disabled={loading} className="text-sm py-1.5 px-3">
              Add
            </Button>
          </div>
        )}
      </Card>

      {pending.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-muted mb-2">Pending Requests</h2>
          <div className="space-y-2">
            {pending.map((req: any) => (
              <Card key={req.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={req.profiles_a.full_name} size="sm" />
                  <span className="text-sm font-medium">{req.profiles_a.full_name}</span>
                </div>
                <Button onClick={() => handleAccept(req.id)} className="text-sm py-1.5 px-3">
                  Accept
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
        <UserPlus size={14} /> Your Friends
      </h2>

      {friends.length > 3 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search your friends..."
            className="w-full pl-8 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {pageLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />)}
        </div>
      ) : friends.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Users} title="No friends yet" subtitle="Search by email above to add your first friend" />
        </Card>
      ) : (
        <div className="space-y-2">
          {friends
            .filter((f) => f.friend.full_name.toLowerCase().includes(filterQuery.toLowerCase()))
            .map((f) => (
            <Card
              key={f.friendshipId}
              onClick={() => navigate(`/friends/${f.friend.id}`)}
              className="flex items-center gap-3 p-3"
            >
              <Avatar name={f.friend.full_name} />
              <span className="font-medium">{f.friend.full_name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}