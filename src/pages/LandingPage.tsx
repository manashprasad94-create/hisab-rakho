import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  IndianRupee,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-soft text-text overflow-hidden">

      {/* =====================================================
          NAVBAR
          ===================================================== */}

      <header className="px-5 md:px-8 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <div
              className="
                w-11 h-11
                rounded-[15px]
                bg-primary
                flex items-center justify-center
                shadow-[5px_5px_12px_rgba(15,118,110,0.18),-3px_-3px_8px_rgba(255,255,255,0.9)]
              "
            >
              <IndianRupee
                size={21}
                className="text-white"
                strokeWidth={2.5}
              />
            </div>

            <div className="text-left">
              <p className="font-bold text-lg tracking-tight leading-none">
                Hisab Kitab
              </p>

              <p className="text-[10px] text-text-muted mt-1">
                Money, made simple.
              </p>
            </div>
          </button>


          <button
            onClick={() => navigate('/login')}
            className="
              px-5 py-2.5
              rounded-xl
              bg-white
              border border-border
              text-sm
              font-semibold
              shadow-[3px_3px_8px_rgba(0,0,0,0.05)]
              hover:-translate-y-0.5
              transition
            "
          >
            Login
          </button>

        </div>
      </header>


      {/* =====================================================
          HERO
          ===================================================== */}

      <main>

        <section className="px-5 md:px-8 pt-10 md:pt-16 pb-20">

          <div
            className="
              max-w-6xl
              mx-auto
              grid
              lg:grid-cols-[0.9fr_1.1fr]
              gap-12
              lg:gap-20
              items-center
            "
          >

            {/* =================================================
                HERO COPY
                ================================================= */}

            <div>

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-3
                  py-1.5
                  rounded-full
                  bg-white/80
                  border border-white
                  shadow-[3px_3px_8px_rgba(0,0,0,0.05)]
                  text-xs
                  font-medium
                  text-text-muted
                  mb-6
                "
              >
                <Sparkles
                  size={13}
                  className="text-primary"
                />

                <span>
                  Your money, finally organized.
                </span>
              </div>


              <h1
                className="
                  text-[3.3rem]
                  sm:text-6xl
                  lg:text-[4.7rem]
                  font-bold
                  tracking-[-0.045em]
                  leading-[0.98]
                "
              >
                Know exactly

                <span className="block text-primary mt-2">
                  who owes whom.
                </span>
              </h1>


              <p
                className="
                  mt-7
                  text-base
                  md:text-lg
                  text-text-muted
                  leading-relaxed
                  max-w-lg
                "
              >
                Track shared expenses, friend-to-friend payments,
                and pending dues without spreadsheets, screenshots,
                or mental calculations.
              </p>


              {/* CTA */}

              <div
                className="
                  flex
                  flex-col
                  sm:flex-row
                  gap-3
                  mt-9
                "
              >

                <button
                  onClick={() => navigate('/signup')}
                  className="
                    group
                    flex
                    items-center
                    justify-center
                    gap-2
                    px-7
                    py-4
                    rounded-2xl
                    bg-primary
                    text-white
                    font-semibold
                    shadow-[7px_7px_16px_rgba(15,118,110,0.20),-4px_-4px_10px_rgba(255,255,255,0.85)]
                    hover:-translate-y-1
                    active:translate-y-0
                    transition
                  "
                >
                  Start for free

                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition"
                  />
                </button>


                <button
                  onClick={() => navigate('/login')}
                  className="
                    px-7
                    py-4
                    rounded-2xl
                    bg-white
                    border border-border
                    font-semibold
                    shadow-[4px_4px_10px_rgba(0,0,0,0.05)]
                    hover:-translate-y-1
                    transition
                  "
                >
                  Login
                </button>

              </div>


              {/* Trust row */}

              <div
                className="
                  flex
                  flex-wrap
                  gap-x-6
                  gap-y-2
                  mt-7
                  text-xs
                  text-text-muted
                "
              >

                <span className="flex items-center gap-1.5">
                  <Check
                    size={14}
                    className="text-primary"
                  />
                  Free to use
                </span>

                <span className="flex items-center gap-1.5">
                  <Check
                    size={14}
                    className="text-primary"
                  />
                  Private records
                </span>

                <span className="flex items-center gap-1.5">
                  <Check
                    size={14}
                    className="text-primary"
                  />
                  No spreadsheets
                </span>

              </div>

            </div>


            {/* =================================================
                PREMIUM PHONE / DASHBOARD
                ================================================= */}

            <div className="relative flex justify-center lg:justify-end">

              {/* Large soft glow */}

              <div
                className="
                  absolute
                  w-72
                  h-72
                  md:w-[420px]
                  md:h-[420px]
                  rounded-full
                  bg-primary/10
                  blur-3xl
                "
              />


              {/* Phone */}

              <div
                className="
                  relative
                  w-[290px]
                  sm:w-[320px]
                  md:w-[350px]
                  rounded-[42px]
                  bg-bg-soft
                  border-[7px]
                  border-white
                  p-2
                  shadow-[18px_20px_45px_rgba(0,0,0,0.15),-12px_-12px_30px_rgba(255,255,255,0.95)]
                  rotate-[2deg]
                  hover:rotate-0
                  transition-transform
                  duration-500
                "
              >

                {/* Phone top */}

                <div
                  className="
                    absolute
                    top-3
                    left-1/2
                    -translate-x-1/2
                    w-24
                    h-5
                    rounded-full
                    bg-text
                    z-20
                  "
                />


                {/* Screen */}

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-[34px]
                    bg-bg-soft
                    pt-9
                    pb-5
                    px-4
                    min-h-[560px]
                  "
                >

                  {/* App header */}

                  <div className="flex items-center justify-between mb-5">

                    <div>

                      <p className="text-[10px] text-text-muted">
                        Good morning
                      </p>

                      <h3 className="text-lg font-bold">
                        Hello, there 👋
                      </h3>

                    </div>

                    <div
                      className="
                        w-9 h-9
                        rounded-xl
                        bg-white
                        flex items-center justify-center
                        shadow-sm
                      "
                    >
                      <Wallet
                        size={17}
                        className="text-primary"
                      />
                    </div>

                  </div>


                  {/* Balance */}

                  <div
                    className="
                      rounded-[25px]
                      bg-primary
                      text-white
                      p-5
                      shadow-[6px_7px_14px_rgba(15,118,110,0.20)]
                    "
                  >

                    <p className="text-[10px] opacity-75">
                      Total you'll receive
                    </p>

                    <p className="text-3xl font-bold mt-1">
                      ₹1,250
                    </p>

                    <div className="flex items-center gap-1.5 mt-3 text-[10px] opacity-80">
                      <ArrowDownLeft size={12} />
                      From 3 friends
                    </div>

                  </div>


                  {/* Pay card */}

                  <div className="grid grid-cols-2 gap-2.5 mt-3">

                    <MiniBalance
                      label="You'll Get"
                      amount="₹1,250"
                      receive
                    />

                    <MiniBalance
                      label="You'll Pay"
                      amount="₹450"
                    />

                  </div>


                  {/* Activity */}

                  <div className="mt-5">

                    <div className="flex justify-between items-center mb-3">

                      <p className="text-xs font-bold">
                        Recent activity
                      </p>

                      <span className="text-[9px] text-primary font-semibold">
                        See all
                      </span>

                    </div>


                    <div className="space-y-2">

                      <PhoneTransaction
                        name="Rahul"
                        description="Dinner"
                        amount="+₹500"
                        receive
                      />

                      <PhoneTransaction
                        name="Akash"
                        description="Movie tickets"
                        amount="-₹250"
                      />

                      <PhoneTransaction
                        name="Priya"
                        description="Trip expenses"
                        amount="+₹750"
                        receive
                      />

                    </div>

                  </div>


                  {/* Add transaction */}

                  <div
                    className="
                      mt-4
                      bg-white
                      rounded-2xl
                      p-3
                      flex
                      items-center
                      justify-center
                      gap-2
                      text-xs
                      font-semibold
                      text-primary
                      shadow-sm
                    "
                  >
                    <Receipt size={15} />
                    Add transaction
                  </div>


                  {/* Bottom nav preview */}

                  <div
                    className="
                      absolute
                      bottom-3
                      left-3
                      right-3
                      bg-white/95
                      rounded-2xl
                      p-2
                      flex
                      justify-around
                      shadow-[0_-2px_8px_rgba(0,0,0,0.04)]
                    "
                  >

                    <PhoneNav
                      icon={<Wallet size={15} />}
                      active
                    />

                    <PhoneNav
                      icon={<Users size={15} />}
                    />

                    <PhoneNav
                      icon={<Receipt size={15} />}
                    />

                  </div>

                </div>

              </div>


              {/* =================================================
                  FLOATING PAYMENT CARD
                  ================================================= */}

              <div
                className="
                  absolute
                  left-[-8px]
                  sm:left-[-25px]
                  bottom-12
                  bg-white
                  rounded-2xl
                  px-4
                  py-3
                  border border-white
                  shadow-[8px_8px_18px_rgba(0,0,0,0.10)]
                  flex
                  items-center
                  gap-3
                "
              >

                <div
                  className="
                    w-9 h-9
                    rounded-xl
                    bg-bg-soft
                    flex
                    items-center
                    justify-center
                    text-primary
                  "
                >
                  <Check size={17} />
                </div>

                <div>

                  <p className="text-[11px] font-bold">
                    Payment recorded
                  </p>

                  <p className="text-[9px] text-text-muted">
                    ₹200 received
                  </p>

                </div>

              </div>


              {/* Floating users card */}

              <div
                className="
                  hidden sm:flex
                  absolute
                  right-[-15px]
                  top-16
                  bg-white
                  rounded-2xl
                  px-3
                  py-2.5
                  border border-white
                  shadow-[7px_7px_16px_rgba(0,0,0,0.09)]
                  items-center
                  gap-2
                "
              >

                <div className="flex -space-x-2">

                  <AvatarLetter letter="R" />
                  <AvatarLetter letter="A" />
                  <AvatarLetter letter="P" />

                </div>

                <div>

                  <p className="text-[10px] font-bold">
                    Your friends
                  </p>

                  <p className="text-[8px] text-text-muted">
                    All your hisab in one place
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURE STRIP
            ===================================================== */}

        <section className="px-5 md:px-8 py-20 bg-white">

          <div className="max-w-6xl mx-auto">

            <div className="text-center max-w-xl mx-auto">

              <p className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-primary
              ">
                Everything in one place
              </p>

              <h2 className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
                tracking-tight
              ">
                Your money.
                <span className="text-primary">
                  {' '}Your hisab.
                </span>
              </h2>

              <p className="
                mt-4
                text-sm
                md:text-base
                text-text-muted
              ">
                No complicated spreadsheets. Just a clear view
                of what you owe and what you're owed.
              </p>

            </div>


            <div className="
              grid
              md:grid-cols-3
              gap-5
              mt-12
            ">

              <PremiumFeature
                icon={<Users size={21} />}
                title="Friends"
                description="See every transaction and balance with each friend."
              />

              <PremiumFeature
                icon={<Receipt size={21} />}
                title="Expenses"
                description="Record exactly where your shared money went."
              />

              <PremiumFeature
                icon={<Wallet size={21} />}
                title="Balances"
                description="Instantly know what you need to pay or receive."
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
            ===================================================== */}

        <section className="px-5 md:px-8 py-20">

          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">

              <p className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-primary
              ">
                How it works
              </p>

              <h2 className="
                mt-3
                text-3xl
                md:text-4xl
                font-bold
              ">
                Simple enough to use
                <span className="text-primary">
                  {' '}every day.
                </span>
              </h2>

            </div>


            <div className="
              grid
              md:grid-cols-3
              gap-5
            ">

              <Step
                number="01"
                title="Add"
                description="Record a shared expense or transaction."
              />

              <Step
                number="02"
                title="Track"
                description="See the balance automatically update."
              />

              <Step
                number="03"
                title="Settle"
                description="Pay your dues and mark them complete."
              />

            </div>

          </div>

        </section>


        {/* =====================================================
            SECURITY
            ===================================================== */}

        <section className="px-5 md:px-8 pb-20">

          <div
            className="
              max-w-5xl
              mx-auto
              rounded-[2rem]
              bg-white
              border border-border
              p-7
              md:p-9
              flex
              flex-col
              md:flex-row
              items-center
              gap-5
              shadow-[6px_6px_15px_rgba(0,0,0,0.06)]
            "
          >

            <div
              className="
                w-14 h-14
                shrink-0
                rounded-2xl
                bg-bg-soft
                flex
                items-center
                justify-center
                text-primary
              "
            >
              <ShieldCheck size={27} />
            </div>

            <div className="text-center md:text-left">

              <h3 className="text-lg font-bold">
                Built with your privacy in mind.
              </h3>

              <p className="
                mt-1
                text-sm
                text-text-muted
                leading-relaxed
              ">
                Your account and records are protected with
                Supabase authentication and database security.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FINAL CTA
            ===================================================== */}

        <section className="px-5 md:px-8 pb-20">

          <div
            className="
              max-w-4xl
              mx-auto
              text-center
              rounded-[2.5rem]
              bg-bg-soft
              border border-white
              p-10
              md:p-14
              shadow-[10px_10px_25px_rgba(0,0,0,0.10),-8px_-8px_20px_rgba(255,255,255,0.9)]
            "
          >

            <div
              className="
                mx-auto
                w-12 h-12
                rounded-2xl
                bg-primary
                flex
                items-center
                justify-center
                text-white
                shadow-[5px_5px_12px_rgba(15,118,110,0.20)]
              "
            >
              <IndianRupee size={22} />
            </div>


            <h2
              className="
                mt-5
                text-3xl
                md:text-4xl
                font-bold
                tracking-tight
              "
            >
              Ready to settle your
              <span className="text-primary">
                {' '}hisab?
              </span>
            </h2>


            <p className="
              mt-3
              text-sm
              md:text-base
              text-text-muted
            ">
              Start keeping track of your shared money today.
            </p>


            <button
              onClick={() => navigate('/signup')}
              className="
                mt-7
                inline-flex
                items-center
                gap-2
                px-7
                py-3.5
                rounded-2xl
                bg-primary
                text-white
                font-semibold
                shadow-[6px_6px_15px_rgba(15,118,110,0.20)]
                hover:-translate-y-1
                transition
              "
            >
              Create free account
              <ArrowRight size={18} />
            </button>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="
        bg-white
        border-t border-border
        px-5
        md:px-8
        py-7
      ">

        <div
          className="
            max-w-6xl
            mx-auto
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-3
          "
        >

          <div className="flex items-center gap-2">

            <div
              className="
                w-8 h-8
                rounded-xl
                bg-primary
                flex
                items-center
                justify-center
              "
            >
              <IndianRupee
                size={16}
                className="text-white"
              />
            </div>

            <span className="text-sm font-bold">
              Hisab Kitab
            </span>

          </div>


          <p className="text-xs text-text-muted">
            Simple. Clear. Organized.
          </p>


          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Hisab Kitab
          </p>

        </div>

      </footer>

    </div>
  )
}


/* =========================================================
   MINI BALANCE
   ========================================================= */

function MiniBalance({
  label,
  amount,
  receive = false,
}: {
  label: string
  amount: string
  receive?: boolean
}) {
  return (
    <div
      className="
        rounded-2xl
        bg-white
        p-3
        shadow-sm
      "
    >

      <div className="flex items-center gap-1 mb-1">

        {receive ? (
          <ArrowDownLeft
            size={11}
            className="text-receive"
          />
        ) : (
          <ArrowUpRight
            size={11}
            className="text-owe"
          />
        )}

        <span className="text-[9px] text-text-muted">
          {label}
        </span>

      </div>

      <p
        className={`
          text-lg
          font-bold
          ${receive ? 'text-receive' : 'text-owe'}
        `}
      >
        {amount}
      </p>

    </div>
  )
}


/* =========================================================
   PHONE TRANSACTION
   ========================================================= */

function PhoneTransaction({
  name,
  description,
  amount,
  receive = false,
}: {
  name: string
  description: string
  amount: string
  receive?: boolean
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        bg-white
        rounded-2xl
        px-3
        py-2.5
        shadow-sm
      "
    >

      <div className="flex items-center gap-2.5">

        <div
          className="
            w-8 h-8
            rounded-full
            bg-bg-soft
            flex
            items-center
            justify-center
            text-[10px]
            font-bold
            text-primary
          "
        >
          {name.charAt(0)}
        </div>

        <div>

          <p className="text-[10px] font-semibold">
            {name}
          </p>

          <p className="text-[8px] text-text-muted">
            {description}
          </p>

        </div>

      </div>


      <p
        className={`
          text-[11px]
          font-bold
          ${receive ? 'text-receive' : 'text-owe'}
        `}
      >
        {amount}
      </p>

    </div>
  )
}


/* =========================================================
   PHONE NAV
   ========================================================= */

function PhoneNav({
  icon,
  active = false,
}: {
  icon: React.ReactNode
  active?: boolean
}) {
  return (
    <div
      className={`
        w-8 h-8
        rounded-xl
        flex
        items-center
        justify-center
        ${active ? 'text-primary bg-bg-soft' : 'text-text-muted'}
      `}
    >
      {icon}
    </div>
  )
}


/* =========================================================
   AVATAR LETTER
   ========================================================= */

function AvatarLetter({
  letter,
}: {
  letter: string
}) {
  return (
    <div
      className="
        w-7 h-7
        rounded-full
        bg-primary
        border-2
        border-white
        flex
        items-center
        justify-center
        text-[9px]
        font-bold
        text-white
      "
    >
      {letter}
    </div>
  )
}


/* =========================================================
   PREMIUM FEATURE
   ========================================================= */

function PremiumFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="
        group
        bg-bg-soft
        rounded-[1.75rem]
        border border-white
        p-6
        shadow-[7px_7px_16px_rgba(0,0,0,0.07),-5px_-5px_12px_rgba(255,255,255,0.9)]
        hover:-translate-y-1.5
        transition
      "
    >

      <div
        className="
          w-12 h-12
          rounded-2xl
          bg-white
          flex
          items-center
          justify-center
          text-primary
          shadow-sm
          group-hover:scale-105
          transition
        "
      >
        {icon}
      </div>


      <h3 className="
        mt-5
        text-lg
        font-bold
      ">
        {title}
      </h3>


      <p className="
        mt-2
        text-sm
        text-text-muted
        leading-relaxed
      ">
        {description}
      </p>

    </div>
  )
}


/* =========================================================
   STEP
   ========================================================= */

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div
      className="
        relative
        bg-white
        rounded-[1.75rem]
        border border-border
        p-7
        shadow-[5px_5px_13px_rgba(0,0,0,0.05)]
      "
    >

      <p
        className="
          text-5xl
          font-black
          text-primary/10
        "
      >
        {number}
      </p>


      <h3 className="
        text-xl
        font-bold
        mt-3
      ">
        {title}
      </h3>


      <p className="
        mt-2
        text-sm
        text-text-muted
        leading-relaxed
      ">
        {description}
      </p>

    </div>
  )
}