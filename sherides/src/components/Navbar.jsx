import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  ShieldCheck,
  Bell,
  ChevronDown,
  Siren,
  LayoutDashboard,
  Car,
  User,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Sparkles,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import SOSModal from './SOSModal.jsx'

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/my-rides', label: 'My Rides' },
  { to: '/safety', label: 'Safety' },
  { to: '/profile', label: 'Profile' },
  { to: '/support', label: 'Support' },
  { to: '/about', label: 'Why SheRides' },
]

const mobileLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-rides', label: 'My Rides', icon: Car },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/support', label: 'Support', icon: LifeBuoy },
  { to: '/about', label: 'Why SheRides', icon: Sparkles },
]

export default function Navbar() {
  const [sosOpen, setSosOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { notifications, markNotificationsRead } = useApp()

  const unreadCount = notifications.filter((n) => !n.read).length

  function handleBellClick() {
    setNotificationOpen((prev) => !prev)
    if (!notificationOpen) markNotificationsRead()
  }

  function closeProfileMenu() {
    setProfileMenuOpen(false)
  }

  return (
    <>
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-midnight-950/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-neon-pink/60 bg-[#0b1020] shadow-glow">
              <img src="/reference-visuals/brand-badge.png" alt="SheRides brand mark" className="h-full w-full object-cover" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">
              She<span className="text-gradient">Rides</span>
            </span>
          </div>

          {/* Center nav links - desktop only */}
          <nav className="hidden md:flex w-full max-w-[860px] items-center justify-center gap-1.5 rounded-full border border-white/5 bg-slate-900/40 px-1.5 py-1.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex-1 min-w-[110px] px-2 py-2 text-center text-sm font-medium rounded-full transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-neon-pink to-neon-violet text-white shadow-glow'
                      : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setSosOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-colors animate-pulse-glow"
              aria-label="Emergency SOS"
            >
              <Siren size={16} />
              <span className="hidden sm:inline text-xs font-bold tracking-wide">SOS</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={handleBellClick}
                  className="relative w-9 h-9 rounded-full bg-slate-900/60 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-neon-pink text-[10px] flex items-center justify-center text-white font-bold px-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <img
                          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80"
                          alt="Sarah J. avatar"
                          className="w-7 h-7 rounded-full border border-neon-pink/60 object-cover"
                        />
                        <p className="text-sm font-semibold text-white">Notifications</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{notifications.length}</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 px-1 py-4 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-2.5 ${item.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-neon-pink/20 bg-slate-900/60'}`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">
                                {item.type === 'warning' ? (
                                  <AlertTriangle size={14} className="text-amber-400" />
                                ) : (
                                  <CheckCircle2 size={14} className="text-emerald-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-white">{item.title}</p>
                                <p className="text-[11px] text-slate-300 mt-0.5">{item.message}</p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1.5">
                                  <Clock3 size={10} />
                                  {new Date(item.createdAt).toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-900/60 border border-white/10 hover:border-neon-pink/40 transition-colors"
                  aria-label="Profile menu"
                >
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80"
                    alt="Sarah J. avatar"
                    className="w-7 h-7 rounded-full border-2 border-neon-pink/60 object-cover"
                  />
                  <span className="hidden sm:inline text-sm font-medium text-white">Sarah J.</span>
                  <ChevronDown size={14} className="hidden sm:inline text-slate-400" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl p-2 z-50">
                    <div className="flex items-center gap-3 px-2 py-2 border-b border-white/5 mb-1">
                      <img
                        src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80"
                        alt="Sarah J. avatar"
                        className="w-9 h-9 rounded-full object-cover border border-neon-pink/60"
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">Sarah J.</p>
                        <p className="text-[10px] text-slate-400">Verified rider</p>
                      </div>
                    </div>

                    <NavLink
                      to="/profile"
                      onClick={closeProfileMenu}
                      className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70 rounded-xl transition-colors"
                    >
                      View profile
                    </NavLink>
                    <NavLink
                      to="/my-rides"
                      onClick={closeProfileMenu}
                      className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70 rounded-xl transition-colors"
                    >
                      My rides
                    </NavLink>
                    <NavLink
                      to="/support"
                      onClick={closeProfileMenu}
                      className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/70 rounded-xl transition-colors"
                    >
                      Support
                    </NavLink>
                    <button
                      onClick={closeProfileMenu}
                      className="w-full text-left px-3 py-2 mt-1 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      Close menu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/5 bg-midnight-950/95 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 items-center gap-1 py-2">
          {mobileLinks.map((link) => {
            const Icon = link.icon
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center transition-colors ${
                    isActive ? 'text-neon-pink' : 'text-slate-500'
                  }`
                }
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium leading-tight">{link.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </>
  )
}
