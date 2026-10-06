import Button from '../../components/Button'
import StatusMessage from '../../components/StatusMessage'
import { Input } from '../../components/FormControls'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, IndianRupee, Eye, EyeOff, ShieldCheck, User, MailCheck } from 'lucide-react'

import { signUp } from '../../lib/auth'
import { useAuthStore } from '../../store/authStore'
import Card from '../../components/card'


export default function Signup() {

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()

  const user = useAuthStore((s) => s.user)


  /* =====================================================
     REDIRECT AFTER EMAIL CONFIRMATION
     ===================================================== */

  useEffect(() => {

    if (submitted && user) {
      navigate('/dashboard')
    }

  }, [submitted, user, navigate])


  /* =====================================================
     FALLBACK REDIRECT
     ===================================================== */

  useEffect(() => {

    if (!submitted) return

    const timer = setTimeout(() => {

      if (!user) {
        navigate('/login')
      }

    }, 15000)

    return () => clearTimeout(timer)

  }, [submitted, user, navigate])


  /* =====================================================
     SIGNUP
     ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError('')
    setLoading(true)

    try {

      await signUp(email, password, fullName)

      setSubmitted(true)

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Signup failed'
      )

    } finally {

      setLoading(false)

    }
  }


  /* =====================================================
     EMAIL CONFIRMATION SCREEN
     ===================================================== */

  if (submitted) {
    return <div className="auth-page"><div className="auth-container">
      <Link to="/" className="auth-brand"><span className="navigation-brand-icon"><IndianRupee size={21} aria-hidden="true" /></span>Hisab Kitab</Link>
      <Card className="auth-card text-center"><div className="empty-state-icon mx-auto"><MailCheck size={26} className="text-primary" aria-hidden="true" /></div>
        <h1>Check your email</h1><p className="auth-description">We sent a confirmation link to <strong className="text-text">{email}</strong></p>
        <p className="text-sm text-text-muted mb-6">Click the link in the email to activate your account and start using Hisab Kitab.</p>
        <Button onClick={() => navigate('/login')} className="w-full">Go to Login</Button>
        <p className="text-sm text-text-muted mt-5">Your account is protected.</p>
      </Card>
    </div></div>
  }


  /* =====================================================
     SIGNUP FORM
     ===================================================== */

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="auth-brand"><span className="navigation-brand-icon"><IndianRupee size={21} aria-hidden="true" /></span>Hisab Kitab</Link>
        <Card className="auth-card">
          <h1>Create your account</h1>
          <p className="auth-description">Start keeping your hisab simple.</p>
          <form onSubmit={handleSubmit}>
            {error && <StatusMessage>{error}</StatusMessage>}
            <div className="auth-field"><label htmlFor="signup-name">Full Name</label><div className="relative"><User size={18} className="auth-field-icon" aria-hidden="true" /><Input id="signup-name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="pl-11" /></div></div>
            <div className="auth-field"><label htmlFor="signup-email">Email</label><div className="relative"><Mail size={18} className="auth-field-icon" aria-hidden="true" /><Input id="signup-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-11" /></div></div>
            <div className="auth-field">
              <div className="flex items-center justify-between gap-3"><label htmlFor="signup-password">Password</label></div>
              <div className="relative"><Lock size={18} className="auth-field-icon" aria-hidden="true" /><Input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11 pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
              </div><p className="text-xs text-text-muted mt-2">Minimum 6 characters</p>
            </div>
            <Button type="submit" loading={loading} className="w-full">{loading ? 'Creating account...' : 'Get Started'}</Button>
            <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
          </form>
        </Card>
        <p className="text-sm text-text-muted flex items-center justify-center gap-2 mt-5"><ShieldCheck size={16} className="text-primary" aria-hidden="true" />Your information is securely protected.</p>
        <Link to="/" className="auth-back">Back to Hisab Kitab</Link>
      </div>
    </div>
  )
}