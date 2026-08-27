import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, CheckCircle2, XCircle, Clock3, Car } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { formatPKR } from '../lib/geo.js'

const tabs = ['All', 'Completed', 'Cancelled']

export default function MyRides() {
  const { rideHistory } = useApp()
  const [tab, setTab] = useState('All')

  const filtered = rideHistory.filter((r) => tab === 'All' || r.status === tab)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-bold text-white mb-1">My Rides</h1>
        <p className="text-slate-400 text-sm mb-6">Your trip history across Karachi.</p>

        <div className="flex items-center gap-2 mb-6 bg-slate-900/40 border border-white/5 rounded-full p-1.5 w-fit">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                tab === t
                  ? 'bg-gradient-to-r from-neon-pink to-neon-violet text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((ride, i) => {
            const date = new Date(ride.date)
            return (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="glass-card rounded-2xl p-5 hover-lift"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-white font-semibold text-sm">{ride.id}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5">
                      <Clock3 size={12} />
                      {date.toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
                      {date.toLocaleTimeString('en-PK', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <StatusBadge status={ride.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-neon-pink mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-500">Pickup</p>
                      <p className="text-sm text-slate-200">{ride.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={15} className="text-neon-violet mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] text-slate-500">Drop-off</p>
                      <p className="text-sm text-slate-200">{ride.dropoff}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Car size={15} className="text-slate-500" />
                    {ride.driver} • {ride.car}
                  </div>
                  <p className="text-white font-bold text-lg">{formatPKR(ride.fare)}</p>
                </div>
              </motion.div>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-sm">
              No {tab.toLowerCase()} rides yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'Completed') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
        <CheckCircle2 size={13} /> Completed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
      <XCircle size={13} /> Cancelled
    </span>
  )
}
