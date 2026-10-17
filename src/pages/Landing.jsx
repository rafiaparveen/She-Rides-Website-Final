import { ArrowRight, CarFront, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { motion } from 'framer-motion'

const roles = [
  {
    id: 'rider',
    title: 'Ride with SheRides',
    subtitle: 'Book safe rides with trusted women captains.',
    action: 'Continue as a passenger',
    icon: UserRound,
  },
  {
    id: 'captain',
    title: 'Drive with SheRides',
    subtitle: 'Join our community of women captains.',
    action: 'Continue as a captain',
    icon: CarFront,
  },
]

export default function Landing({ onChooseRole }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-9 text-center"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-neon-pink/50 bg-slate-950 shadow-glow">
            <img src="/reference-visuals/brand-badge.png" alt="" className="h-full w-full rounded-2xl object-cover" />
          </div>
          <p className="font-display text-3xl font-bold text-white">
            She<span className="text-gradient">Rides</span>
          </p>
          <h1 className="mt-4 font-display text-2xl font-bold text-white sm:text-3xl">
            Safe journeys start here
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
            A community built around safer rides and opportunities for women.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map(({ id, title, subtitle, action, icon: Icon }, index) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onChooseRole(id)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card group rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:border-neon-pink/60 sm:p-8"
            >
              <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-neon-pink/10 text-neon-pink">
                <Icon size={24} />
              </span>
              <h2 className="font-display text-xl font-bold text-white">{title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{subtitle}</p>
              <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-neon-pink">
                {action}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
          ))}
        </div>

        <div className="mt-7 text-center">
          <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={14} className="text-emerald-400" />
            Designed with women&apos;s safety at heart
            <Sparkles size={13} className="text-neon-pink" />
          </p>
          <p className="mt-2 text-xs text-slate-500">Created by Rafia Parveen</p>
        </div>
      </div>
    </main>
  )
}
