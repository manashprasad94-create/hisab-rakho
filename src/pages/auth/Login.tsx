import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Wallet } from 'lucide-react'
import { signIn } from '../../lib/auth'
import Card from '../../components/card'
import Button from '../../components/Button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-sm">
            <Wallet size={26} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold">Welcome Back</h1>
          <p className="text-sm text-text-muted mt-1">Login to Hisab Kitab</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            {error && <p className="text-owe text-sm mb-4">{error}</p>}

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mb-6 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <p className="text-center text-sm mt-4">
              <a href="/forgot-password" className="text-primary font-medium">Forgot Password?</a>
            </p>
            <p className="text-center text-sm text-text-muted mt-2">
              New here? <a href="/signup" className="text-primary font-medium">Create Account</a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}