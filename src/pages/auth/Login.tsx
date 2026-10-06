import Button from '../../components/Button'
import StatusMessage from '../../components/StatusMessage'
import Card from '../../components/card'
import { Input } from '../../components/FormControls'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, IndianRupee, Eye, EyeOff, ShieldCheck } from 'lucide-react'

import { signIn } from '../../lib/auth'


export default function Login() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()


  /* =====================================================
     LOGIN
     ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError('')
    setLoading(true)

    try {

      await signIn(email, password)

      const returnTo = location.state?.returnTo
      navigate(typeof returnTo === 'string' && returnTo.startsWith('/') &&
        !returnTo.startsWith('//') && !returnTo.includes('\\')
        ? returnTo : '/dashboard', { replace: true })

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Login failed'
      )

    } finally {

      setLoading(false)

    }
  }


  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-brand"><span className="navigation-brand-icon"><IndianRupee size={21} aria-hidden="true" /></span>Hisab Kitab</Link>
        <Card className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-description">Login to continue managing your hisab.</p>
          <form onSubmit={handleSubmit}>
            {error && <StatusMessage>{error}</StatusMessage>}

            <div className="auth-field"><label htmlFor="login-email">Email</label><div className="relative"><Mail size={18} className="auth-field-icon" aria-hidden="true" /><Input id="login-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-11" /></div></div>
            <div className="auth-field">
              <div className="flex items-center justify-between gap-3"><label htmlFor="login-password">Password</label><Link to="/forgot-password" className="text-sm text-primary mb-2 font-medium">Forgot password?</Link></div>
              <div className="relative"><Lock size={18} className="auth-field-icon" aria-hidden="true" /><Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required  value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full">{loading ? 'Logging in...' : 'Login'}</Button>
            <p className="auth-footer">New to Hisab Kitab? <Link to="/signup">Create account</Link></p>
          </form>
        </Card>
        <p className="text-sm text-text-muted flex items-center justify-center gap-2 mt-5"><ShieldCheck size={16} className="text-primary" aria-hidden="true" />Your account is securely protected.</p>
        <Link to="/" className="auth-back">Back to Hisab Kitab</Link>
      </div>
    </div>
  )
}
