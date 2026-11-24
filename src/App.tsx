import AppNavigation from './components/AppNavigation'
import PageHeader from './components/PageHeader'
import StatusMessage from './components/StatusMessage'
import LoadingState from './components/LoadingState'
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'
import { getFriendBalanceTotals } from './lib/transactions'
import { registerPushNotifications } from './lib/firebase'
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'

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
import GroupFundsList from './pages/GroupFundsList'
import GroupFund from './pages/GroupFund'
import AddFundExpense from './pages/AddFundExpense'
import DepositFund from './pages/DepositFund'
import GroupFundHistory from './pages/GroupFundHistory'
import FundMembers from './pages/FundMembers'
import { PiggyBank } from 'lucide-react'
import ShareTarget from './pages/ShareTarget'
import { listFriends } from './lib/friends'
import Avatar from './components/Avatar'
import { getUnreadCount } from './lib/updates'
import { Bell } from 'lucide-react'
import Updates from './pages/Updates'


function RootRoute() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return <div className="app-page"><LoadingState label="Loading your account" /></div>
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <LandingPage />
}


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  const location = useLocation()

  if (loading) {
    return (
      <div className="app-page"><LoadingState label="Loading your account" /></div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search + location.hash }} />
  }

  return <>{children}</>
}


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

function RouteFrame({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  const { pathname } = useLocation()
  const publicRoute = ["/", "/login", "/signup", "/forgot-password", "/reset-password"].includes(pathname)
  return <main id="main-content" tabIndex={-1} className={user && !publicRoute ? "app-workspace" : "public-workspace"}>{children}</main>
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  const { profile, user } = useAuthStore()

  const [toReceive, setToReceive] = useState(0)
  const [toPay, setToPay] = useState(0)
  const [friends, setFriends] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  const navigate = useNavigate()

  const refreshDashboard = useCallback(() => {
    if (!user) return
    setDashboardError('')

    getFriendBalanceTotals().then((totals) => {
      setToReceive(Number(totals.to_receive))
      setToPay(Number(totals.to_pay))
    }).catch((err) => {
      setDashboardError(err instanceof Error ? err.message : 'Could not load balances')
    }).finally(() => setLoading(false))

    listFriends().then((f) => {
      setFriends(f.slice(0, 5))
    }).catch((err) => setDashboardError(err instanceof Error ? err.message : 'Could not load friends'))

    getUnreadCount().then(setUnreadCount)
  }, [user])


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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          getUnreadCount().then(setUnreadCount)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, refreshDashboard])

  return (
    <div className="app-page">
      <PageHeader title={<>Hello, {profile?.full_name?.split(' ')[0] || 'there'}</>} description="Your money, all in one place.">
        <Link to="/updates" className="dashboard-notifications" aria-label={unreadCount ? 'Updates, ' + unreadCount + ' unread' : 'Updates'}>
          <Bell size={21} aria-hidden="true" />
          {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
      </PageHeader>
      {dashboardError && <StatusMessage>{dashboardError}</StatusMessage>}
      <div className="dashboard-balances">
        <Card onClick={() => navigate('/balance/receive')} className="dashboard-balance">
          <div className="dashboard-balance-title"><ArrowDownLeft size={18} className="text-receive" aria-hidden="true" />You'll Get</div>
          {loading ? <div className="skeleton h-9 w-3/4 rounded" aria-label="Loading balance" /> : <p className="balance-value text-receive">₹{toReceive.toFixed(0)}</p>}
        </Card>
        <Card onClick={() => navigate('/balance/pay')} className="dashboard-balance">
          <div className="dashboard-balance-title"><ArrowUpRight size={18} className="text-owe" aria-hidden="true" />You'll Pay</div>
          {loading ? <div className="skeleton h-9 w-3/4 rounded" aria-label="Loading balance" /> : <p className="balance-value text-owe">₹{toPay.toFixed(0)}</p>}
        </Card>
      </div>
      <Button onClick={() => navigate('/add-transaction')} className="w-full sm:w-auto"><Plus size={18} aria-hidden="true" />Add Transaction</Button>
      <div className="dashboard-tools">
        <Card onClick={() => navigate('/group-funds')}>
          <span className="tool-icon"><PiggyBank size={22} aria-hidden="true" /></span>
          <div className="flex-1 min-w-0"><p className="font-semibold">Group Fund</p><p className="text-sm text-text-muted mt-1">View shared fund balance</p></div>
          <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
        </Card>
        {unreadCount > 0 && <Card onClick={() => navigate('/updates')}>
          <span className="tool-icon"><Bell size={22} aria-hidden="true" /></span>
          <div className="flex-1 min-w-0"><p className="font-semibold">New updates received</p><p className="text-sm text-text-muted mt-1">{unreadCount} unseen {unreadCount === 1 ? 'update' : 'updates'}</p></div>
          <ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
        </Card>}
      </div>
      <div className="section-heading"><h2>Friends</h2><Link to="/friends">See all <ChevronRight size={16} aria-hidden="true" /></Link></div>
      {loading ? <LoadingState label="Loading friends" /> : friends.length === 0 ? (
        <Card><EmptyState icon={Wallet} title="No friends yet" subtitle="Add a friend to start tracking money together" /></Card>
      ) : <div className="record-list">{friends.map((f) => (
        <Card key={f.friendshipId} onClick={() => navigate('/friends/' + f.friend.id)} className="p-4 flex items-center gap-4">
          <Avatar name={f.friend.full_name} src={f.friend?.avatar_url || undefined} /><span className="font-semibold flex-1 min-w-0">{f.friend.full_name}</span><ChevronRight size={18} className="text-text-muted" aria-hidden="true" />
        </Card>
      ))}</div>}
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

      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppNavigation />
      <RouteFrame>


      <Routes>

        {/* =================================================
            PUBLIC ROUTES
            ================================================= */}

        {/* Landing page — redirects to Dashboard if already logged in */}

        <Route
          path="/"
          element={<RootRoute />}
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
        <Route
          path="/group-funds"
          element={
            <ProtectedRoute>
              <GroupFundsList />
            </ProtectedRoute>
          }
        />
                <Route
          path="/updates"
          element={
            <ProtectedRoute>
              <Updates />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-fund/:fundId"
          element={
            <ProtectedRoute>
              <GroupFund />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-fund/:fundId/add-expense"
          element={
            <ProtectedRoute>
              <AddFundExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-fund/:fundId/deposit"
          element={
            <ProtectedRoute>
              <DepositFund />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-fund/:fundId/history"
          element={
            <ProtectedRoute>
              <GroupFundHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group-fund/:fundId/members"
          element={
            <ProtectedRoute>
              <FundMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share-target"
          element={
            <ProtectedRoute>
              <ShareTarget />
            </ProtectedRoute>
          }
        />

      </Routes>
      </RouteFrame>

    </BrowserRouter>
  )
}


export default App
