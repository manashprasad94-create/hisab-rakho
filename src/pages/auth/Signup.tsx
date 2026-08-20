import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mail,
  Lock,
  User,
  Wallet,
  MailCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  ShieldCheck,
} from 'lucide-react'

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

    return (
      <div
        className="
          min-h-screen
          bg-bg-soft
          px-5
          flex
          items-center
          justify-center
        "
      >

        <div className="w-full max-w-md">

          {/* Brand */}

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
                />
              </div>

              <span className="
                text-lg
                font-bold
                tracking-tight
              ">
                Hisab Kitab
              </span>

            </Link>

          </div>


          {/* Confirmation card */}

          <div
            className="
              bg-bg-soft
              rounded-[2rem]
              border border-white
              p-2
              shadow-[10px_10px_25px_rgba(0,0,0,0.10),-8px_-8px_20px_rgba(255,255,255,0.9)]
            "
          >

            <Card
              className="
                p-7
                md:p-9
                text-center
                rounded-[1.7rem]
              "
            >

              {/* Icon */}

              <div
                className="
                  w-16 h-16
                  rounded-[20px]
                  bg-bg-soft
                  flex
                  items-center
                  justify-center
                  mx-auto
                  mb-5
                  text-primary
                  shadow-[inset_3px_3px_7px_rgba(0,0,0,0.05)]
                "
              >
                <MailCheck
                  size={29}
                  strokeWidth={2}
                />
              </div>


              <h1 className="
                text-2xl
                font-bold
                tracking-tight
              ">
                Check your email
              </h1>


              <p className="
                text-sm
                text-text-muted
                leading-relaxed
                mt-3
              ">
                We sent a confirmation link to
              </p>


              <p className="
                text-sm
                font-semibold
                text-text
                mt-1
                break-all
              ">
                {email}
              </p>


              <p className="
                text-xs
                text-text-muted
                leading-relaxed
                mt-4
              ">
                Click the link in the email to activate
                your account and start using Hisab Kitab.
              </p>


              {/* Security note */}

              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  mt-6
                  px-4
                  py-3
                  rounded-xl
                  bg-bg-soft
                  text-xs
                  text-text-muted
                "
              >
                <ShieldCheck
                  size={15}
                  className="text-primary"
                />

                Your account is protected.
              </div>


              <Link
                to="/login"
                className="
                  inline-flex
                  items-center
                  gap-2
                  mt-6
                  text-sm
                  font-semibold
                  text-primary
                  hover:gap-3
                  transition-all
                "
              >
                Go to Login
                <ArrowRight size={16} />
              </Link>

            </Card>

          </div>

        </div>

      </div>
    )
  }


  /* =====================================================
     SIGNUP FORM
     ===================================================== */

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

              <p className="
                text-lg
                font-bold
                tracking-tight
                leading-none
              ">
                Hisab Kitab
              </p>

              <p className="
                text-[10px]
                text-text-muted
                mt-1
              ">
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
            Create your account
          </h1>

          <p className="
            text-sm
            text-text-muted
            mt-2
          ">
            Start keeping your hisab simple.
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

          <Card
            className="
              p-6
              md:p-7
              rounded-[1.7rem]
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
                  "
                >
                  {error}
                </div>

              )}


              {/* =================================================
                  FULL NAME
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
                <User
                  size={15}
                  className="text-primary"
                />

                Full Name
              </label>


              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
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
                  EMAIL
                  ================================================= */}

              <label
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  mt-5
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

              <label
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  mt-5
                  mb-2
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


              <div className="relative">

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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
                  PASSWORD REQUIREMENT
                  ================================================= */}

              <div className="
                flex
                items-center
                gap-1.5
                mt-2
                text-[11px]
                text-text-muted
              ">

                <Check
                  size={12}
                  className="text-primary"
                />

                Minimum 6 characters

              </div>


              {/* =================================================
                  SUBMIT
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

                    Creating account...
                  </>
                ) : (
                  <>
                    Get Started

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
                  LOGIN
                  ================================================= */}

              <p
                className="
                  text-center
                  text-sm
                  text-text-muted
                  mt-5
                "
              >
                Already have an account?{' '}

                <Link
                  to="/login"
                  className="
                    text-primary
                    font-semibold
                    hover:underline
                  "
                >
                  Login
                </Link>
              </p>

            </form>

          </Card>

        </div>


        {/* =================================================
            TRUST
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

          Your information is securely protected.
        </div>


        {/* Back */}

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