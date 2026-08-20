import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Wallet, MailCheck } from 'lucide-react'
import { signUp } from '../../lib/auth'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/card'
import Button from '../../components/Button'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (submitted && user) {
      navigate('/dashboard')
    }
  }, [submitted, user, navigate])

  useEffect(() => {
    if (!submitted) return
    const timer = setTimeout(() => {
      if (!user) navigate('/login')
    }, 15000)
    return () => clearTimeout(timer)
  }, [submitted, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(email, password, fullName)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <MailCheck size={26} className="text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold mb-2">Check your email</h1>
          <p className="text-text-muted text-sm">We sent a confirmation link to {email}. Click it to activate your account.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-sm">
            <Wallet size={26} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold">Create Account</h1>
          <p className="text-sm text-text-muted mt-1">Track money. Not misunderstandings.</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-owe text-sm mb-4">{error}</p>}

            <label className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
              <User size={14} /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <label className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <label className="flex items-center gap-1.5 text-sm mb-1 text-text-muted font-medium">
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Get Started'}
            </Button>

            <p className="text-center text-sm text-text-muted mt-4">
              Already have an account? <a href="/login" className="text-primary font-medium">Login</a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}