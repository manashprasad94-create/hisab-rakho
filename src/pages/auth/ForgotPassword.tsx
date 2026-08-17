import { useState } from 'react'
import { Mail, MailCheck } from 'lucide-react'
import { requestPasswordReset } from '../../lib/auth'
import Card from '../../components/card'
import Button from '../../components/Button'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
            <MailCheck size={26} className="text-primary" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold mb-2">Check your email</h1>
          <p className="text-text-muted text-sm">We sent a password reset link to {email}.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-1">Reset Password</h1>
        <p className="text-sm text-text-muted text-center mb-6">Enter your email, we'll send a reset link</p>

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
              className="w-full mb-6 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <p className="text-center text-sm text-text-muted mt-4">
              <a href="/login" className="text-primary font-medium">Back to Login</a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  )
}