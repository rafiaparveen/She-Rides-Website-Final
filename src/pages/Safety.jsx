import { useState } from 'react'
import { motion } from 'framer-motion'
import { Fingerprint, PhoneOff, Route, Siren, ShieldCheck, Share2, Clock3 } from 'lucide-react'
import SOSModal from '../components/SOSModal.jsx'
import { useApp } from '../context/AppContext.jsx'

const features = [
  {
    key: 'biometricAudit',
    icon: Fingerprint,
    title: 'Biometric & CNIC Audit',
    desc: 'Every driver completes a facial biometric scan and CNIC verification before going live, re-checked periodically to prevent account sharing.',
  },
  {
    key: 'phoneMasking',
    icon: PhoneOff,
    title: 'Encrypted Phone Masking',
    desc: 'Riders and drivers connect through a masked, encrypted number. Your real phone number is never revealed to the other party.',
  },
  {
    key: 'routeMonitoring',
    icon: Route,
    title: 'Live Route Deviation Monitoring',
    desc: 'Our system tracks your trip across Karachi in real time and flags unexpected stops or route changes, alerting our safety team automatically.',
  },
  {
    key: 'shareTripWithContacts',
    icon: Share2,
    title: 'Auto-Share Trip with Contacts',
    desc: 'Automatically send your live trip link to your saved emergency contacts the moment a ride starts.',
  },
]

export default function Safety() {
  const [sosOpen, setSosOpen] = useState(false)
  const { safetySettings, toggleSafetySetting, sosLog } = useApp()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-pink to-neon-violet flex items-center justify-center shadow-glow mb-4">
            <ShieldCheck className="text-white" size={30} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Safety Center
          </h1>
          <p className="text-slate-400 max-w-xl text-sm sm:text-base">
            SheRides is built on a security-first protocol designed exclusively to keep women
            safe across Karachi — before, during, and after every ride.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {features.map((f, i) => {
            const Icon = f.icon
            const enabled = safetySettings[f.key]
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6 hover:border-neon-pink/40 transition-colors hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-violet/20 border border-neon-pink/30 flex items-center justify-center">
                    <Icon className="text-neon-pink" size={22} />
                  </div>
                  <ToggleSwitch checked={enabled} onChange={() => toggleSafetySetting(f.key)} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-1.5">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                <p className={`text-xs font-semibold mt-3 ${enabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {enabled ? 'Active' : 'Disabled'}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Emergency CTA */}
        <div className="glass-card rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-red-500/30 mb-8">
          <div>
            <h2 className="text-white font-display font-bold text-xl mb-1.5">
              In case of emergency
            </h2>
            <p className="text-slate-400 text-sm max-w-md">
              Tap the button to instantly alert your emergency contacts, our safety team, and
              the nearby police helpline.
            </p>
          </div>
          <button
            onClick={() => setSosOpen(true)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 transition-colors text-white font-semibold px-6 py-3.5 rounded-xl shadow-glow-red animate-pulse-glow shrink-0"
          >
            <Siren size={18} /> Trigger SOS
          </button>
        </div>

        {/* Alert history */}
        {sosLog.length > 0 && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="text-white font-display font-bold text-lg mb-4">Alert History</h3>
            <div className="space-y-3">
              {sosLog.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-slate-800/40 border border-white/5 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <Clock3 size={15} className="text-slate-500" />
                    <span className="text-sm text-slate-300">
                      {new Date(alert.triggeredAt).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      alert.status === 'active'
                        ? 'text-red-400 bg-red-400/10 animate-pulse'
                        : 'text-emerald-400 bg-emerald-400/10'
                    }`}
                  >
                    {alert.status === 'active' ? 'Active' : 'Resolved'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
        checked ? 'bg-gradient-to-r from-neon-pink to-neon-violet' : 'bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
