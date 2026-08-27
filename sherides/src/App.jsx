import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import BackgroundSparkles from './components/BackgroundSparkles.jsx'
import { AppProvider } from './context/AppContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MyRides from './pages/MyRides.jsx'
import Safety from './pages/Safety.jsx'
import Profile from './pages/Profile.jsx'
import Support from './pages/Support.jsx'
import WhySheRides from './pages/WhySheRides.jsx'

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
          <Route path="/safety" element={<Safety />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<WhySheRides />} />
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

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen relative text-slate-200 overflow-x-hidden">
        <BackgroundSparkles />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 pb-24 md:pb-0">
            <AnimatedRoutes />
          </main>
          <DesktopFooter />
        </div>
      </div>
    </AppProvider>
  )
}
