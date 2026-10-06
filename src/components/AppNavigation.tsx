import { Link, useLocation } from 'react-router-dom'
import { Bell, Home, IndianRupee, PiggyBank, StickyNote, User, Users, Wallet } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Avatar from './Avatar'

const destinations = [
  { path: '/dashboard', label: 'Home', icon: Home, matches: ['/dashboard', '/balance/'] },
  { path: '/friends', label: 'Friends', icon: Users, matches: ['/friends', '/add-transaction'] },
  { path: '/expenses', label: 'Expenses', icon: Wallet, matches: ['/expenses', '/add-expense'] },
  { path: '/group-funds', label: 'Group funds', icon: PiggyBank, matches: ['/group-funds', '/group-fund/'], desktop: true },
  { path: '/personal-notes', label: 'Personal notes', icon: StickyNote, matches: ['/personal-notes'], desktop: true },
  { path: '/updates', label: 'Updates', icon: Bell, matches: ['/updates'], desktop: true },
  { path: '/profile', label: 'Profile', icon: User, matches: ['/profile'] },
]

export default function AppNavigation() {
  const { user, profile } = useAuthStore()
  const { pathname } = useLocation()
  if (!user || ['/', '/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname)) return null
  return <nav className="app-navigation" aria-label="Main navigation">
    <Link to="/dashboard" className="navigation-brand"><span className="navigation-brand-icon"><IndianRupee size={21} aria-hidden="true" /></span>Hisab Kitab</Link>
    <p className="navigation-caption">Money, made simple.</p>
    <div className="navigation-items">
      {destinations.map(({ path, label, icon: Icon, matches, desktop }) => {
        const active = matches.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : prefix + '/'))
        return <Link key={path} to={path} aria-current={active ? 'page' : undefined}
          className={`navigation-link ${active ? 'active' : ''} ${desktop ? 'navigation-desktop' : ''}`}>
          <Icon size={21} strokeWidth={active ? 2 : 1.7} aria-hidden="true" /><span>{label}</span>
        </Link>
      })}
    </div>
    <Link to="/profile" className="navigation-account"><Avatar name={profile?.full_name || 'You'} />
      <div className="min-w-0"><p className="text-sm font-semibold">{profile?.full_name || 'Your account'}</p><p className="text-xs text-text-muted">Manage profile</p></div>
    </Link>
  </nav>
}
