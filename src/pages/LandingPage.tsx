import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, IndianRupee, Users, Wallet } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-soft text-text flex flex-col">
      {/* Navbar */}
      <header className="w-full px-5 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <IndianRupee size={21} className="text-white" />
            </div>

            <span className="text-xl font-bold tracking-tight">
              Hisab Kitab
            </span>
          </button>

          {/* Login */}
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-primary hover:opacity-80 transition"
          >
            Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="px-5 pt-10 pb-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            
            {/* Left side */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-border text-xs font-medium text-text-muted mb-5">
                <CheckCircle2 size={14} className="text-primary" />
                Simple money tracking
              </div>

              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Know who owes
                <span className="text-primary"> whom.</span>
              </h1>

              <p className="mt-5 text-base md:text-lg text-text-muted leading-relaxed max-w-xl">
                Keep track of expenses, pending payments and shared
                transactions with your friends — all in one simple place.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-white font-semibold shadow-sm hover:opacity-90 transition"
                >
                  Get Started
                  <ArrowRight size={18} />
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3.5 rounded-2xl bg-white border border-border font-semibold hover:bg-gray-50 transition"
                >
                  I already have an account
                </button>
              </div>
            </div>

            {/* Right side - Dashboard preview */}
            <div className="relative">
              <div className="bg-white rounded-3xl border border-border shadow-xl p-5 max-w-md mx-auto">
                
                {/* Fake greeting */}
                <div className="mb-5">
                  <p className="text-sm text-text-muted">Good to see you 👋</p>
                  <h2 className="text-2xl font-semibold mt-1">
                    Your money overview
                  </h2>
                </div>

                {/* Balance cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl bg-green-50 p-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      <Wallet size={15} />
                      You'll Get
                    </div>

                    <p className="text-2xl font-bold text-green-600">
                      ₹1,250
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                      <Wallet size={15} />
                      You'll Pay
                    </div>

                    <p className="text-2xl font-bold text-orange-600">
                      ₹450
                    </p>
                  </div>
                </div>

                {/* Friends */}
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={17} />
                    <span className="font-semibold">Recent Friends</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Rahul</span>
                      <span className="text-green-600 font-semibold">
                        +₹500
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Akash</span>
                      <span className="text-orange-600 font-semibold">
                        -₹250
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium">Priya</span>
                      <span className="text-green-600 font-semibold">
                        +₹750
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features */}
        <section className="px-5 py-16 bg-white border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold">
                Everything you need to manage shared expenses
              </h2>

              <p className="mt-3 text-text-muted">
                No more WhatsApp messages, screenshots or mental calculations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <FeatureCard
                icon={<Wallet size={22} />}
                title="Track Expenses"
                description="Record who paid, who owes and why the money was spent."
              />

              <FeatureCard
                icon={<Users size={22} />}
                title="Manage Friends"
                description="Keep a clear record of your transactions with each friend."
              />

              <FeatureCard
                icon={<IndianRupee size={22} />}
                title="Settle Easily"
                description="See exactly how much you need to pay or receive."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to simplify your hisab?
            </h2>

            <p className="mt-3 text-text-muted">
              Create your free account and start tracking your expenses.
            </p>

            <button
              onClick={() => navigate('/signup')}
              className="mt-7 inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-primary text-white font-semibold hover:opacity-90 transition"
            >
              Create Free Account
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-5 py-6 border-t border-border bg-white">
        <div className="max-w-5xl mx-auto text-center text-sm text-text-muted">
          © {new Date().getFullYear()} Hisab Kitab. Simple. Clear. Organized.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-3xl border border-border bg-bg-soft">
      <div className="w-11 h-11 rounded-2xl bg-white border border-border flex items-center justify-center text-primary mb-4">
        {icon}
      </div>

      <h3 className="font-semibold text-lg">
        {title}
      </h3>

      <p className="mt-2 text-sm text-text-muted leading-relaxed">
        {description}
      </p>
    </div>
  )
}