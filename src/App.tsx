import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { listAllTransactions } from './lib/transactions'
import { registerPushNotifications } from './lib/firebase'
import { Home, Users, Wallet, User as UserIcon, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import Card from './components/card'
import Button from './components/Button'
import EmptyState from './components/EmptyState'
import { useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import Friends from './pages/Friends'
import AddTransaction from './pages/AddTransaction'
import FriendDetail from './pages/FriendDetail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Profile from './pages/Profile'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  if (!user) return null

  const items = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/expenses', icon: Wallet, label: 'Expenses' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around py-2 px-2 max-w-lg mx-auto">
      {items.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition"
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className={active ? 'text-primary' : 'text-text-muted'} />
            <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-text-muted'}`}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Dashboard() {
  const { profile, user } = useAuthStore()
  const [toReceive, setToReceive] = useState(0)
  const [toPay, setToPay] = useState(0)
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    listAllTransactions().then((txns) => {
      let receive = 0
      let pay = 0
     for (const t of txns) {
        if (t.status === 'settled' || t.status === 'pending_acceptance') continue
        if (t.payer_id === user.id) receive += Number(t.remaining_amount)
        else pay += Number(t.remaining_amount)
      }
      setToReceive(receive)
      setToPay(pay)
      setRecent(txns.slice(0, 5))
      setLoading(false)
    })
  }, [user])

  return (
    <div className="min-h-screen p-4 pb-24 bg-bg-soft">
      <h1 className="text-2xl font-semibold mb-5">Hello, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>

      <div className="flex gap-3 mb-5">
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft size={16} className="text-receive" strokeWidth={2.5} />
            <p className="text-xs text-text-muted font-medium">To Receive</p>
          </div>
          <p className="text-2xl font-semibold text-receive">₹{toReceive.toFixed(0)}</p>
        </Card>
        <Card className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight size={16} className="text-owe" strokeWidth={2.5} />
            <p className="text-xs text-text-muted font-medium">To Pay</p>
          </div>
          <p className="text-2xl font-semibold text-owe">₹{toPay.toFixed(0)}</p>
        </Card>
      </div>

      <Button onClick={() => navigate('/add-transaction')} className="w-full mb-5 flex items-center justify-center gap-2">
        <Plus size={18} /> Add Transaction
      </Button>

      <h2 className="text-sm font-semibold text-text-muted mb-3">Recent Activity</h2>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <Card className="p-2">
          <EmptyState icon={Wallet} title="No transactions yet" subtitle="Add one to start tracking money with friends" />
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((t) => (
            <Card
              key={t.id}
              onClick={() => navigate(`/friends/${t.payer_id === user?.id ? t.payee_id : t.payer_id}`)}
              className="p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-sm">{t.reason || 'Transaction'}</p>
                <p className="text-xs text-text-muted capitalize">{t.status.replace('_', ' ')}</p>
              </div>
              <p className={`font-semibold ${t.payer_id === user?.id ? 'text-receive' : 'text-owe'}`}>
                ₹{Number(t.remaining_amount).toFixed(0)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function App() {
  const { setUser, setProfile, setLoading, user } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setLoading])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data))

    registerPushNotifications().catch(() => {})
  }, [user, setProfile])

  return (
    <BrowserRouter>
    <BottomNav />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends/:friendId"
          element={
            <ProtectedRoute>
              <FriendDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-expense"
          element={
            <ProtectedRoute>
              <AddExpense />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    
  )
}

export default App
