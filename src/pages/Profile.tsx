import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User as UserIcon} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { updateProfile } from '../lib/profile'
import { signOut } from '../lib/auth'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { profile, setProfile } = useAuthStore()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [upiId, setUpiId] = useState(profile?.upi_id || '')
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState(profile?.phone || '')


  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const updated = await updateProfile({ full_name: fullName, upi_id: upiId, phone })
      setProfile(updated)
      setMessage('Saved')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-bg-soft p-4 pb-24">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>

      <div className="flex items-center gap-3 mb-5">
        <Avatar name={fullName || 'U'} size="lg" />
        <div>
          <p className="font-semibold">{profile?.full_name}</p>
          <p className="text-sm text-text-muted">{profile?.email}</p>
          <p className="text-sm text-text-muted">{profile?.phone}</p>   
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="p-4 mb-4">
          {message && <p className="text-sm text-primary mb-3">{message}</p>}

          <label className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
            <UserIcon size={14} /> Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
            <UserIcon size={14} /> Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="w-full mb-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-muted mb-4">Needed so friends can pay you via UPI</p>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      </form>

      <Button variant="danger" onClick={handleLogout} className="w-full flex items-center justify-center gap-2">
        <LogOut size={16} /> Logout
      </Button>
    </div>
  )
}