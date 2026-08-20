import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  Wallet,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'

import { signIn } from '../../lib/auth'


export default function Login() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()


  /* =====================================================
     LOGIN
     ===================================================== */

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()

    setError('')
    setLoading(true)

    try {

      await signIn(email, password)

      // IMPORTANT:
      // Dashboard is now /dashboard,
      // while / is the public landing page.

      navigate('/dashboard')

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
    <div
      className="
        min-h-screen
        bg-bg-soft
        px-5
        py-8
        flex
        items-center
        justify-center
      "
    >

      <div className="w-full max-w-md">


        {/* =================================================
            BRAND
            ================================================= */}

        <div className="flex justify-center mb-7">

          <Link
            to="/"
            className="flex items-center gap-3"
          >

            <div
              className="
                w-11 h-11
                rounded-[15px]
                bg-primary
                flex
                items-center
                justify-center
                shadow-[5px_5px_12px_rgba(15,118,110,0.18)]
              "
            >
              <Wallet
                size={21}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>


            <div>

              <p
                className="
                  text-lg
                  font-bold
                  tracking-tight
                  leading-none
                "
              >
                Hisab Kitab
              </p>

              <p
                className="
                  text-[10px]
                  text-text-muted
                  mt-1
                "
              >
                Money, made simple.
              </p>

            </div>

          </Link>

        </div>


        {/* =================================================
            HEADER
            ================================================= */}

        <div className="text-center mb-6">

          <h1
            className="
              text-3xl
              md:text-4xl
              font-bold
              tracking-tight
            "
          >
            Welcome back
          </h1>

          <p
            className="
              text-sm
              text-text-muted
              mt-2
            "
          >
            Login to continue managing your hisab.
          </p>

        </div>


        {/* =================================================
            CLAY CONTAINER
            ================================================= */}

        <div
          className="
            bg-bg-soft
            rounded-[2rem]
            border border-white
            p-2
            shadow-[10px_10px_25px_rgba(0,0,0,0.10),-8px_-8px_20px_rgba(255,255,255,0.9)]
          "
        >

          <div
            className="
              bg-white
              rounded-[1.7rem]
              p-6
              md:p-7
            "
          >

            <form onSubmit={handleSubmit}>


              {/* =================================================
                  ERROR
                  ================================================= */}

              {error && (

                <div
                  className="
                    mb-5
                    px-4
                    py-3
                    rounded-xl
                    bg-red-50
                    border border-red-100
                    text-sm
                    text-owe
                    leading-relaxed
                  "
                >
                  {error}
                </div>

              )}


              {/* =================================================
                  EMAIL
                  ================================================= */}

              <label
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  mb-2
                  text-text
                  font-semibold
                "
              >

                <Mail
                  size={15}
                  className="text-primary"
                />

                Email

              </label>


              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="
                  w-full
                  px-4
                  py-3
                  bg-bg-soft
                  border border-border
                  rounded-xl
                  text-sm
                  placeholder:text-text-muted/60
                  focus:outline-none
                  focus:ring-2
                  focus:ring-primary/20
                  focus:border-primary
                  transition
                "
              />


              {/* =================================================
                  PASSWORD
                  ================================================= */}

              <div className="
                flex
                items-center
                justify-between
                mt-5
                mb-2
              "
              >

                <label
                  className="
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-text
                    font-semibold
                  "
                >

                  <Lock
                    size={15}
                    className="text-primary"
                  />

                  Password

                </label>


                <Link
                  to="/forgot-password"
                  className="
                    text-xs
                    text-primary
                    font-semibold
                    hover:underline
                  "
                >
                  Forgot password?
                </Link>

              </div>


              <div className="relative">

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="
                    w-full
                    px-4
                    py-3
                    pr-12
                    bg-bg-soft
                    border border-border
                    rounded-xl
                    text-sm
                    placeholder:text-text-muted/60
                    focus:outline-none
                    focus:ring-2
                    focus:ring-primary/20
                    focus:border-primary
                    transition
                  "
                />


                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    p-1.5
                    text-text-muted
                    hover:text-primary
                    transition
                  "
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}

                </button>

              </div>


              {/* =================================================
                  LOGIN BUTTON
                  ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className="
                  group
                  w-full
                  mt-6
                  py-3.5
                  rounded-xl
                  bg-primary
                  text-white
                  font-semibold
                  text-sm
                  flex
                  items-center
                  justify-center
                  gap-2
                  shadow-[5px_5px_12px_rgba(15,118,110,0.18)]
                  hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  transition
                "
              >

                {loading ? (

                  <>
                    <span
                      className="
                        w-4 h-4
                        border-2
                        border-white/40
                        border-t-white
                        rounded-full
                        animate-spin
                      "
                    />

                    Logging in...

                  </>

                ) : (

                  <>
                    Login

                    <ArrowRight
                      size={17}
                      className="
                        group-hover:translate-x-1
                        transition
                      "
                    />

                  </>

                )}

              </button>


              {/* =================================================
                  SIGNUP
                  ================================================= */}

              <p
                className="
                  text-center
                  text-sm
                  text-text-muted
                  mt-5
                "
              >

                New to Hisab Kitab?{' '}

                <Link
                  to="/signup"
                  className="
                    text-primary
                    font-semibold
                    hover:underline
                  "
                >
                  Create account
                </Link>

              </p>

            </form>

          </div>

        </div>


        {/* =================================================
            SECURITY
            ================================================= */}

        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            mt-5
            text-[11px]
            text-text-muted
          "
        >

          <ShieldCheck
            size={13}
            className="text-primary"
          />

          Your account is securely protected.

        </div>


        {/* =================================================
            BACK TO LANDING
            ================================================= */}

        <div className="text-center mt-5">

          <Link
            to="/"
            className="
              text-xs
              text-text-muted
              hover:text-primary
              transition
            "
          >
            ← Back to Hisab Kitab
          </Link>

        </div>

      </div>

    </div>
  )
}