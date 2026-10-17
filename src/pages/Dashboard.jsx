import { motion } from 'framer-motion'
import { useEffect } from 'react'
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { formatPKR } from '../lib/geo.js'
import WhySheRides from './WhySheRides.jsx'
import RideBooking from '../components/RideBooking.jsx'

export default function Dashboard() {
  const location = useLocation()
  const { profile, rideHistory } = useApp()
  const rides = [...rideHistory].sort((a, b) => new Date(b.date) - new Date(a.date))
  const completedRides = rides.filter((ride) => ride.status === 'Completed')
  const cancelledRides = rides.filter((ride) => ride.status === 'Cancelled')
  const totalSpent = completedRides.reduce((total, ride) => total + Number(ride.fare || 0), 0)

  useEffect(() => {
    if (location.hash !== '#about') return
    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const stats = [
    { label: 'Total rides', value: rides.length, icon: Car, color: 'text-neon-pink' },
    { label: 'Completed', value: completedRides.length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Cancelled', value: cancelledRides.length, icon: XCircle, color: 'text-amber-400' },
    { label: 'Total spent', value: formatPKR(totalSpent), icon: MapPin, color: 'text-neon-violet' },
  ]

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="glass-card mx-auto mb-6 max-w-6xl rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neon-pink">Your SheRides dashboard</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Welcome back, {profile.name?.trim() || 'Passenger'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your ride activity and trip details, all in one place.
            </p>
          </div>
          <Link
            to="/my-rides"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:border-neon-pink/50"
          >
            View history <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <RideBooking />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <section aria-label="Ride summary" className="mx-auto mb-6 grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card rounded-2xl p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-slate-400">{stat.label}</p>
                  <Icon size={17} className={stat.color} />
                </div>
                <p className="mt-3 text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            )
          })}
        </section>

        <div className="mx-auto grid max-w-6xl items-start gap-6 lg:grid-cols-[1fr_300px]">
          <section className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Recent rides</h2>
                <p className="text-xs text-slate-500 mt-1">Your latest trips around Karachi</p>
              </div>
              <Link
                to="/my-rides"
                className="text-xs font-semibold text-neon-pink hover:text-white whitespace-nowrap"
              >
                All history <ArrowRight size={13} className="inline ml-1" />
              </Link>
            </div>

            {rides.length > 0 ? (
              <div className="space-y-3">
                {rides.slice(0, 3).map((ride) => (
                  <article
                    key={ride.id}
                    className="rounded-2xl border border-white/5 bg-slate-800/30 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{ride.id}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock3 size={12} />
                          {new Date(ride.date).toLocaleDateString('en-PK', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <RideStatus status={ride.status} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <RideLocation label="Pickup" location={ride.pickup} color="text-neon-pink" />
                      <RideLocation label="Drop-off" location={ride.dropoff} color="text-neon-violet" />
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-400">
                        <Car size={13} className="inline mr-1.5 text-slate-500" />
                        {ride.driver} · {ride.car}
                      </span>
                      <span className="font-bold text-white">{formatPKR(ride.fare)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <Car size={24} className="mx-auto text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-300">No rides in your history yet</p>
                <p className="mt-1 text-xs text-slate-500">Your trip details will appear here.</p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <Link
              to="/profile"
              className="glass-card rounded-3xl p-5 flex items-center gap-4 hover:border-neon-pink/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-pink/10 text-neon-pink">
                <UserRound size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Your profile</span>
                <span className="block mt-1 text-xs text-slate-500">Update your personal details</span>
              </span>
              <ArrowRight size={16} className="text-slate-500" />
            </Link>
            <Link
              to="/safety"
              className="glass-card rounded-3xl p-5 flex items-center gap-4 hover:border-emerald-400/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                <ShieldCheck size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">Ride safety</span>
                <span className="block mt-1 text-xs text-slate-500">Your safety tools and settings</span>
              </span>
              <ArrowRight size={16} className="text-slate-500" />
            </Link>
          </aside>
        </div>
      </motion.div>
      <WhySheRides />
    </div>
  )
}

function RideLocation({ label, location, color }) {
  return (
    <div className="flex items-start gap-2">
      <MapPin size={14} className={`${color} mt-0.5 shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500">{label}</p>
        <p className="text-xs text-slate-200 truncate">{location}</p>
      </div>
    </div>
  )
}

function RideStatus({ status }) {
  const completed = status === 'Completed'
  const Icon = completed ? CheckCircle2 : XCircle

  return (
    <span
      className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
        completed ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
      }`}
    >
      <Icon size={12} /> {status}
    </span>
  )
}
