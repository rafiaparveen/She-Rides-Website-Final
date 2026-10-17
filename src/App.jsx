import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import BackgroundSparkles from './components/BackgroundSparkles.jsx'
import { AppProvider } from './context/AppContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyRides from './pages/MyRides.jsx'
import Safety from './pages/Safety.jsx'
import Profile from './pages/Profile.jsx'
import Support from './pages/Support.jsx'
import Auth from './pages/Auth.jsx'
import Landing from './pages/Landing.jsx'
import CaptainDashboard from './pages/CaptainDashboard.jsx'
import CaptainMoney from './pages/CaptainMoney.jsx'
import WalletPage from './pages/Wallet.jsx'
import { useApp } from './context/AppContext.jsx'
import { useEffect, useRef, useState } from 'react'

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname} 
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-rides" element={<MyRides />} />
          <Route path="/wallet" element={<Navigate to="/" replace />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<Support />} />
          <Route path="/captain/money" element={<Navigate to="/" replace />} />
          <Route path="/about" element={<Navigate to="/#about" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function DesktopFooter() {
  return (
    <footer className="hidden lg:block border-t border-white/10 bg-midnight-950/80 px-8 py-8">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
        <div>
          <p className="font-display text-lg font-bold text-white">She<span className="text-gradient">Rides</span></p>
          <p className="mt-1 text-xs text-slate-500">Safe rides for every Karachi street.</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <a href="/safety" className="hover:text-neon-pink">Safety centre</a>
          <a href="/support" className="hover:text-neon-pink">Help & support</a>
          <a href="/profile" className="hover:text-neon-pink">Your profile</a>
        </div>
        <p className="text-xs text-slate-600">© 2026 SheRides Pakistan</p>
      </div>
    </footer>
  )
}

function CreatorCredit() {
  return (
    <footer className="border-t border-white/5 px-4 py-4 text-center text-xs text-slate-500">
      Designed with women&apos;s safety at heart · Created by Rafia Parveen
    </footer>
  )
}

function AppContent() {
  const { authUser, isInitializing, apiError } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const startupPath = useRef(location.pathname)
  const normalizedStartupPath = useRef(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedRole, setSelectedRole] = useState(null)

  useEffect(() => {
    if (normalizedStartupPath.current) return
    normalizedStartupPath.current = true
    if (startupPath.current !== '/') navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (authUser) setSelectedRole(null)
  }, [authUser])

  useEffect(() => {
    let cancelled = false
    const timers = []
    const wait = (duration) => new Promise((resolve) => {
      timers.push(setTimeout(resolve, duration))
    })
    const animateProgress = (initial, target, duration) => new Promise((resolve) => {
      const start = performance.now()
      let frameId
      let fallback
      const finish = () => {
        if (cancelled) return
        clearTimeout(fallback)
        cancelAnimationFrame(frameId)
        setLoadingProgress(target)
        resolve()
      }
      const tick = (now) => {
        if (cancelled) return
        const ratio = Math.max(0, Math.min((now - start) / duration, 1))
        setLoadingProgress(Math.round(initial + (target - initial) * ratio))
        if (ratio >= 1) {
          finish()
        } else {
          frameId = requestAnimationFrame(tick)
        }
      }
      frameId = requestAnimationFrame(tick)
      fallback = setTimeout(finish, duration + 100)
      timers.push(fallback)
    })

    async function loadWelcome() {
      setLoadingProgress(1)
      await animateProgress(1, 75, 1800)
      if (cancelled) return
      await wait(3000)
      if (cancelled) return
      await animateProgress(75, 99, 900)
      if (cancelled) return
      await wait(3000)
      if (cancelled) return
      setLoadingProgress(100)
      await wait(350)
      if (!cancelled) setShowWelcome(false)
    }

    void loadWelcome()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="min-h-screen relative text-slate-200 overflow-x-hidden">
      <BackgroundSparkles />
      <div className="relative z-10 flex flex-col min-h-screen">
        {showWelcome ? (
          <main className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-4 text-center">
            <img
              src="/reference-visuals/why-hero.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full bg-slate-950 object-cover object-center sm:object-contain"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/20 via-slate-950/55 to-slate-950/80 sm:from-slate-950/55 sm:via-slate-950/55 sm:to-slate-950/90" />
            <motion.div initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-neon-pink/50 bg-slate-950/80 shadow-glow">
                <img src="/reference-visuals/brand-badge.png" alt="" className="h-full w-full object-cover" />
              </div>
              <p className="font-display text-3xl font-bold text-white">
                She<span className="text-gradient">Rides</span>
              </p>
              <p className="mt-2 text-sm text-slate-200">Safe rides. Confident journeys.</p>
            </motion.div>
            <div className="w-full max-w-xs">
              <div
                className="h-2 overflow-hidden rounded-full border border-white/15 bg-slate-950/70 shadow-lg"
                role="progressbar"
                aria-label="Loading SheRides"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={loadingProgress}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-pink to-neon-violet transition-[width] duration-100"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold tabular-nums text-white">{loadingProgress}%</p>
            </div>
            <p className="mt-2 text-xs text-slate-200">Getting your safe ride experience ready…</p>
          </main>
        ) : isInitializing ? (
          <main className="flex flex-1 items-center justify-center px-4 text-sm text-slate-300">
            Connecting to your SheRides account…
          </main>
        ) : authUser ? (
          authUser.role === 'captain' ? (
            <>
              {location.pathname === '/captain/money' ? <CaptainMoney /> :
                location.pathname === '/wallet' ? <WalletPage /> :
                  <CaptainDashboard />}
              <CreatorCredit />
            </>
          ) : (
          <>
            {apiError && !authUser?.isDemo && (
              <div role="alert" className="border-b border-amber-400/20 bg-amber-400/10 px-4 py-2 text-center text-xs text-amber-200">
                {apiError}
              </div>
            )}
            <Navbar />
            <main className="flex-1 pb-24 md:pb-0">
              <AnimatedRoutes />
            </main>
            <DesktopFooter />
            <CreatorCredit />
          </>
          )
        ) : (
          selectedRole ? (
            <Auth role={selectedRole} onBack={() => setSelectedRole(null)} />
          ) : (
            <Landing onChooseRole={setSelectedRole} />
          )
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
