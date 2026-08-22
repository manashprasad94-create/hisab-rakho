import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { listAllTransactions } from './lib/transactions'
import { registerPushNotifications } from './lib/firebase'
import {
  Home,
  Users,
  Wallet,
  User as UserIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'

import Card from './components/card'
import Button from './components/Button'
import EmptyState from './components/EmptyState'

import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

import Signup from './pages/auth/Signup'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

import LandingPage from './pages/LandingPage'

import Friends from './pages/Friends'
import AddTransaction from './pages/AddTransaction'
import FriendDetail from './pages/FriendDetail'
import Profile from './pages/Profile'
import Expenses from './pages/Expenses'
import AddExpense from './pages/AddExpense'
import BalanceBreakdown from './pages/BalanceBreakdown'
import PersonalNotes from './pages/PersonalNotes'

import { listFriends } from './lib/friends'
import Avatar from './components/Avatar'


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()

  if (!user) return null

  const items = [
    { path: '/dashboard', icon: Home, label: 'Home' },
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
            <Icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? 'text-primary' : 'text-text-muted'}
            />

            <span
              className={`text-[10px] font-medium ${
                active ? 'text-primary' : 'text-text-muted'
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  const { profile, user } = useAuthStore()

  const [toReceive, setToReceive] = useState(0)
  const [toPay, setToPay] = useState(0)
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  const refreshDashboard = () => {
    if (!user) return

    listAllTransactions().then((txns) => {
      let receive = 0
      let pay = 0

      for (const t of txns) {
        if (
          t.status === 'settled' ||
          t.status === 'pending_acceptance'
        ) {
          continue
        }

        if (t.payer_id === user.id) {
          receive += Number(t.remaining_amount)
        } else {
          pay += Number(t.remaining_amount)
        }
      }

      setToReceive(receive)
      setToPay(pay)
      setLoading(false)
    })

    listFriends().then((f) => {
      setFriends(f.slice(0, 5))
    })
  }


  /* =======================================================
     DASHBOARD REALTIME UPDATES
     ======================================================= */

  useEffect(() => {
    refreshDashboard()

    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_transactions',
        },
        () => {
          refreshDashboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])


  return (
    <div className="min-h-screen p-4 pb-24 bg-bg-soft">

      <h1 className="text-2xl font-semibold mb-5">
        Hello, {profile?.full_name?.split(' ')[0] || 'there'} 👋
      </h1>


      {/* ===================================================
          BALANCE CARDS
          =================================================== */}

      <div className="flex gap-3 mb-5">

        {/* You'll Get */}

        <Card
          onClick={() => navigate('/balance/receive')}
          className="flex-1 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft
              size={16}
              className="text-receive"
              strokeWidth={2.5}
            />

            <p className="text-xs text-text-muted font-medium">
              You'll Get
            </p>
          </div>

          <p className="text-2xl font-semibold text-receive">
            ₹{toReceive.toFixed(0)}
          </p>
        </Card>


        {/* You'll Pay */}

        <Card
          onClick={() => navigate('/balance/pay')}
          className="flex-1 p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight
              size={16}
              className="text-owe"
              strokeWidth={2.5}
            />

            <p className="text-xs text-text-muted font-medium">
              You'll Pay
            </p>
          </div>

          <p className="text-2xl font-semibold text-owe">
            ₹{toPay.toFixed(0)}
          </p>
        </Card>

      </div>


      {/* ===================================================
          ADD TRANSACTION
          =================================================== */}

      <Button
        onClick={() => navigate('/add-transaction')}
        className="w-full mb-5 flex items-center justify-center gap-2"
      >
        <Plus size={18} />
        Add Transaction
      </Button>


      {/* ===================================================
          FRIENDS HEADER
          =================================================== */}

      <div className="flex items-center justify-between mb-3">

        <h2 className="text-sm font-semibold text-text-muted">
          Friends
        </h2>

        <button
          onClick={() => navigate('/friends')}
          className="text-xs text-primary font-medium"
        >
          See all
        </button>

      </div>


      {/* ===================================================
          FRIENDS CONTENT
          =================================================== */}

      {loading ? (

        <div className="space-y-2">

          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-white/60 rounded-2xl animate-pulse border border-border"
            />
          ))}

        </div>

      ) : friends.length === 0 ? (

        <Card className="p-2">

          <EmptyState
            icon={Wallet}
            title="No friends yet"
            subtitle="Add a friend to start tracking money together"
          />

        </Card>

      ) : (

        <div className="space-y-2">

          {friends.map((f) => (

            <Card
              key={f.friendshipId}
              onClick={() => navigate(`/friends/${f.friend.id}`)}
              className="p-3 flex items-center gap-3"
            >

              <Avatar name={f.friend.full_name} />

              <span className="font-medium">
                {f.friend.full_name}
              </span>

            </Card>

          ))}

        </div>

      )}

    </div>
  )
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {

  const {
    setUser,
    setProfile,
    setLoading,
    user,
  } = useAuthStore()


  /* =======================================================
     INITIAL AUTH SESSION
     ======================================================= */

  useEffect(() => {

    // Get initial session

    supabase.auth.getSession().then(
      ({ data: { session } }) => {

        setUser(session?.user ?? null)

        setLoading(false)
      }
    )


    // Listen for auth changes

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {

          setUser(session?.user ?? null)
        }
      )


    return () => {
      listener.subscription.unsubscribe()
    }

  }, [setUser, setLoading])


  /* =======================================================
     LOAD USER PROFILE
     ======================================================= */

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
      .then(({ data }) => {

        setProfile(data)
      })


    // Register push notifications

    registerPushNotifications().catch(() => {})

  }, [user, setProfile])


  /* =======================================================
     ROUTER
     ======================================================= */

  return (

    <BrowserRouter>

      {/* Bottom navigation is hidden automatically
          when user is not logged in */}

      <BottomNav />


      <Routes>

        {/* =================================================
            PUBLIC ROUTES
            ================================================= */}

        {/* Landing page */}

        <Route
          path="/"
          element={<LandingPage />}
        />


        {/* Login */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* Signup */}

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* Forgot Password */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* Reset Password */}

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />


        {/* =================================================
            PROTECTED ROUTES
            ================================================= */}

        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />


        {/* Friends */}

        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />


        {/* Friend Details */}

        <Route
          path="/friends/:friendId"
          element={
            <ProtectedRoute>
              <FriendDetail />
            </ProtectedRoute>
          }
        />


        {/* Add Transaction */}

        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />


        {/* Profile */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />


        {/* Expenses */}

        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />


        {/* Add Expense */}

        <Route
          path="/add-expense"
          element={
            <ProtectedRoute>
              <AddExpense />
            </ProtectedRoute>
          }
        />


        {/* Balance Breakdown */}

        <Route
          path="/balance/:type"
          element={
            <ProtectedRoute>
              <BalanceBreakdown />
            </ProtectedRoute>
          }
        />
        <Route
          path="/personal-notes"
          element={
            <ProtectedRoute>
              <PersonalNotes />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  )
}


export default App