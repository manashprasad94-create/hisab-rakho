import LoadingState from '../components/LoadingState'
import StatusMessage from '../components/StatusMessage'
import PageHeader from '../components/PageHeader'
import { Input } from '../components/FormControls'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users } from 'lucide-react'
import {
  searchUserByEmail,
  searchUserByPhone,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriends,
  listPendingRequests,
  listSentRequests,
  cancelFriendRequest,
  createPendingInvite,
} from '../lib/friends'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import { errorMessage } from '../lib/errorMessage'

export default function Friends() {
  const navigate = useNavigate()
  const [friends, setFriends] = useState<any[]>([])
  const [pending, setPending] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [searchEmail, setSearchEmail] = useState('')
  const [searchMode, setSearchMode] = useState<'email' | 'phone'>('email')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [filterQuery, setFilterQuery] = useState('')

  const loadData = async () => {
    try {
      const [f, p, s] = await Promise.all([listFriends(), listPendingRequests(), listSentRequests()])
      setFriends(f)
      setPending(p)
      setSent(s ?? [])
    } catch (err) {
      setMessage(errorMessage(err, 'Could not load friends'))
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = async () => {
    setMessage('')
    setSearchResult(null)
    try {
      const result = searchMode === 'email' ? await searchUserByEmail(searchEmail) : await searchUserByPhone(searchEmail)
      if (!result) setMessage('not_found')
      else setSearchResult(result)
    } catch (err) {
      setMessage(errorMessage(err, 'Could not search users'))
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
      setMessage(errorMessage(err, 'Failed to send request'))
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
      setMessage(errorMessage(err, 'Failed to save invite'))
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (friendshipId: string) => {
    try {
      await rejectFriendRequest(friendshipId)
      await loadData()
    } catch (err) {
      setMessage(errorMessage(err, 'Could not reject request'))
    }
  }

  const handleAccept = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId)
      await loadData()
    } catch (err) {
      setMessage(errorMessage(err, 'Could not accept request'))
    }
  }

  const handleCancel = async (friendshipId: string) => {
    try {
      await cancelFriendRequest(friendshipId)
      await loadData()
    } catch (err) {
      setMessage(errorMessage(err, 'Could not cancel request'))
    }
  }

  return (
    <div className="app-page">
      <PageHeader title={<> Friends </> } />

      <Card className="p-4 mb-4">
        <div className="flex gap-2 mb-2">
          <button aria-pressed={searchMode === 'email'}
            type="button"
            onClick={() => { setSearchMode('email'); setSearchEmail(''); setSearchResult(null); setMessage('') }}
            className={`text-xs px-3 py-1 rounded-lg font-medium ${searchMode === 'email' ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted'}`}
          >
            Email
          </button>
          <button aria-pressed={searchMode === 'phone'}
            type="button"
            onClick={() => { setSearchMode('phone'); setSearchEmail(''); setSearchResult(null); setMessage('') }}
            className={`text-xs px-3 py-1 rounded-lg font-medium ${searchMode === 'phone' ? 'bg-primary text-white' : 'bg-bg-soft text-text-muted'}`}
          >
            Phone
          </button>
        </div>
        <label htmlFor="friends-field-16" className="block text-sm mb-2 text-text-muted font-medium">
          Add friend by {searchMode === 'email' ? 'email' : 'phone'}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input id="friends-field-16"
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
              <Button variant="secondary" onClick={handleInvite} loading={loading} className="text-sm py-1.5">
                Send Invite
              </Button>
            )}
          </div>
        ) : (
          message && <StatusMessage tone="info">{message}</StatusMessage>
        )}

        {searchResult && (
          <div className="flex items-center justify-between mt-3 p-3 bg-bg-soft rounded-xl gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar name={searchResult.full_name} size="sm" src={searchResult?.avatar_url || undefined} />
              <span className="text-sm font-medium truncate">{searchResult.full_name}</span>
            </div>
            <Button size="sm" onClick={() => handleAdd(searchResult.id)} disabled={loading} className="shrink-0">
              Add
            </Button>
          </div>
        )}
      </Card>

      {pending.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-muted mb-2">Pending Requests</h2>
          <div className="record-list">
            {pending.map((req: any) => (
              <Card key={req.id} className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar name={req.profiles_a.full_name} src={req.profiles_a.avatar_url || undefined} size="sm" />
                  <span className="text-sm font-medium truncate">{req.profiles_a.full_name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => handleReject(req.id)}>
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(req.id)}>
                    Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text-muted mb-2">Sent Requests</h2>
          <div className="record-list">
            {sent.map((req: any) => (
              <Card key={req.id} className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar name={req.profiles_b.full_name} src={req.profiles_b.avatar_url || undefined} size="sm" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium block truncate">{req.profiles_b.full_name}</span>
                    <p className="text-xs text-text-muted">Request pending</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleCancel(req.id)} className="shrink-0">
                  Cancel
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
          <Input aria-label="Search records"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search your friends..."
            className="w-full pl-8 pr-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      {pageLoading ? (
        <LoadingState />
      ) : friends.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Users} title="No friends yet" subtitle="Search by email above to add your first friend" />
        </Card>
      ) : !friends.some((f) => f.friend.full_name.toLowerCase().includes(filterQuery.toLowerCase())) ? (
        <Card><EmptyState icon={Search} title="No matching friends" subtitle="Try another name or clear the search field." /></Card>
      ) : (
        <div className="record-list">
          {friends
            .filter((f) => f.friend.full_name.toLowerCase().includes(filterQuery.toLowerCase()))
            .map((f) => (
            <Card
              key={f.friendshipId}
              onClick={() => navigate(`/friends/${f.friend.id}`)}
              className="flex items-center gap-3 p-3"
            >
              <Avatar name={f.friend.full_name} src={f.friend?.avatar_url || undefined} />
              <span className="font-medium">{f.friend.full_name}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
