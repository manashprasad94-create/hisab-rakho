import PageHeader from '../components/PageHeader'
import StatusMessage from '../components/StatusMessage'
import { Input } from '../components/FormControls'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, LogOut, User as UserIcon, StickyNote, Sun, Moon, Monitor } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { updateProfile, uploadAvatar } from '../lib/profile'
import { signOut } from '../lib/auth'
import Card from '../components/card'
import Button from '../components/Button'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { profile, setProfile } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [upiId, setUpiId] = useState(profile?.upi_id || '')
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState(profile?.phone || '')

  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setMessage('')
    try {
      const newUrl = await uploadAvatar(file)
      if (profile) setProfile({ ...profile, avatar_url: newUrl })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="app-page">
      <PageHeader title={<> Profile </> } />

      <div className="flex items-center gap-3 mb-5">
        <label className="relative cursor-pointer" style={{ opacity: avatarUploading ? 0.6 : 1, pointerEvents: avatarUploading ? 'none' : 'auto' }}>
          <Avatar name={fullName || 'U'} size="lg" src={profile?.avatar_url || undefined} />
          <span className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 flex items-center justify-center" style={{ width: 20, height: 20 }}>
            <Camera size={14} />
          </span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleAvatarChange}
            disabled={avatarUploading}
          />
        </label>
        <div>
          <p className="font-semibold">{profile?.full_name}</p>
          <p className="text-sm text-text-muted">{profile?.email}</p>
          <p className="text-sm text-text-muted">{profile?.phone}</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="p-4 mb-4">
          {message && <StatusMessage tone={message === 'Saved' ? 'success' : 'error'}>{message}</StatusMessage>}

          <label htmlFor="profile-field-20" className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
            <UserIcon size={14} /> Full Name
          </label>
          <Input id="profile-field-20"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <label htmlFor="profile-field-21" className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
            <UserIcon size={14} /> Phone Number
          </label>
          <Input id="profile-field-21"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label htmlFor="profile-upi" className="block text-sm mb-1 font-medium">UPI ID</label>
          <Input id="profile-upi"
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="yourname@upi"
            className="w-full mb-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-text-muted mb-4">Needed so friends can pay you via UPI</p>

          <Button type="submit" loading={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      </form>

      <Card className="p-4 mb-3">
        <p className="text-sm font-semibold mb-3">Appearance</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
            className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ borderColor: theme === 'light' ? 'var(--color-primary)' : 'var(--color-border)', background: theme === 'light' ? 'var(--color-accent-soft)' : 'transparent', color: theme === 'light' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Sun size={18} />
            Light
          </button>
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
            className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ borderColor: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-border)', background: theme === 'dark' ? 'var(--color-accent-soft)' : 'transparent', color: theme === 'dark' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Moon size={18} />
            Dark
          </button>
          <button
            type="button"
            aria-pressed={theme === 'system'}
            onClick={() => setTheme('system')}
            className="flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{ borderColor: theme === 'system' ? 'var(--color-primary)' : 'var(--color-border)', background: theme === 'system' ? 'var(--color-accent-soft)' : 'transparent', color: theme === 'system' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
          >
            <Monitor size={18} />
            System
          </button>
        </div>
      </Card>
      <Button variant="secondary" onClick={() => navigate('/personal-notes')} className="w-full flex items-center justify-center gap-2 mb-3">
        <StickyNote size={16} /> Personal Notes
      </Button>

      <Button variant="danger" onClick={handleLogout} className="w-full flex items-center justify-center gap-2">
        <LogOut size={16} /> Logout
      </Button>
    </div>
  )
}
