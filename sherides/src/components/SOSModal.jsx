import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldAlert, PhoneCall, MapPin, X, Siren, CheckCircle2 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const DISPATCH_STEPS = [
  { key: 'sent', label: 'Alert sent', delay: 0 },
  { key: 'location', label: 'Live location shared with contacts', delay: 900 },
  { key: 'safety', label: 'SheRides safety team notified', delay: 2200 },
  { key: 'police', label: 'Connected to police helpline (15)', delay: 3600 },
]

export default function SOSModal({ open, onClose }) {
  const { triggerSOS, resolveSOS } = useApp()
  const [alertId, setAlertId] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])

  // Reset the dispatch timeline whenever the modal is freshly opened.
  useEffect(() => {
    if (!open) {
      setAlertId(null)
      setCompletedSteps([])
    }
  }, [open])

  function handleTrigger() {
    const id = triggerSOS()
    setAlertId(id)
    setCompletedSteps([])
    DISPATCH_STEPS.forEach((step) => {
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.key])
      }, step.delay)
    })
  }

  function handleImSafe() {
    if (alertId) resolveSOS(alertId)
    onClose()
  }

  const isActive = Boolean(alertId)
  const allDone = completedSteps.length === DISPATCH_STEPS.length

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isActive && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl glass-card border-red-500/40 shadow-glow-red p-6 sm:p-8 relative"
          >
            {!isActive && (
              <button
                onClick={onClose}
                aria-label="Close emergency panel"
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            )}

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-red-500/15 flex items-center justify-center animate-pulse-glow">
                <Siren className="text-red-500" size={38} />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">
                {isActive ? 'Emergency Alert Active' : 'Emergency SOS'}
              </h2>

              {!isActive && (
                <p className="text-slate-400 text-sm">
                  Your live location and trip details will be shared instantly with your
                  emergency contacts and the SheRides safety team in Karachi.
                </p>
              )}

              {isActive ? (
                <div className="w-full space-y-3 mt-1">
                  {DISPATCH_STEPS.map((step) => {
                    const done = completedSteps.includes(step.key)
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                          done ? 'bg-emerald-400/10' : 'bg-slate-800/50'
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-[18px] h-[18px] rounded-full border-2 border-slate-600 border-t-red-500 animate-spin shrink-0" />
                        )}
                        <span className={`text-sm ${done ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="w-full grid grid-cols-1 gap-3 mt-2">
                  <button
                    onClick={handleTrigger}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-white font-semibold shadow-glow-red animate-pulse-glow"
                  >
                    <Siren size={18} /> Trigger Emergency Alert
                  </button>
                  <div className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 text-xs">
                    <PhoneCall size={13} /> Police Helpline
                    <MapPin size={13} className="ml-2" /> Safety Team
                  </div>
                </div>
              )}

              {isActive && (
                <button
                  onClick={handleImSafe}
                  className={`w-full mt-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                    allDone
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                  disabled={!allDone}
                >
                  {allDone ? "I'm safe now — resolve alert" : 'Dispatching…'}
                </button>
              )}

              {!isActive && (
                <button
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-300 text-sm mt-1 underline underline-offset-4"
                >
                  Cancel, I'm safe
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
