import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  CreditCard,
  ShieldQuestion,
  Car,
  ChevronDown,
  Send,
  MessageCircle,
} from 'lucide-react'

const categories = [
  { icon: Car, title: 'Ride Issues', desc: 'Trip cancellations, driver behavior, wrong routes.' },
  { icon: CreditCard, title: 'Billing & Fares', desc: 'Fare disputes, refunds, payment methods.' },
  { icon: ShieldQuestion, title: 'Safety Concerns', desc: 'Report an incident or safety concern.' },
  { icon: HelpCircle, title: 'Account Help', desc: 'Login issues, verification, profile updates.' },
]

const faqs = [
  {
    q: 'How is my safety verified before matching with a driver?',
    a: 'Every SheRides driver completes a biometric facial scan alongside CNIC verification, and is re-verified periodically. You can view a driver’s profile, rating, and vehicle details before every trip.',
  },
  {
    q: 'What happens when I tap the SOS button?',
    a: 'Your live location, trip ID, and driver details are instantly sent to your saved emergency contacts and the SheRides safety team, with a direct line to the local police helpline.',
  },
  {
    q: 'Can I choose to only ride with female drivers?',
    a: 'Yes. SheRides matches you exclusively with verified female captains by default across all ride categories.',
  },
  {
    q: 'How do I get a refund for a cancelled ride?',
    a: 'Go to My Rides, select the trip, and tap "Request Refund". Refunds for eligible cancellations are processed within 3–5 business days.',
  },
  {
    q: 'Is my phone number visible to my driver?',
    a: 'No. All calls and messages are routed through an encrypted, masked number so your real phone number is never shared.',
  },
]

export default function Support() {
  const [openFaq, setOpenFaq] = useState(0)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => setSent(false), 3500)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-display text-3xl font-bold text-white mb-1">Support</h1>
        <p className="text-slate-400 text-sm mb-8">We're here to help, any time you need us.</p>

        {/* Category cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {categories.map((c, i) => {
            const Icon = c.icon
            return (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="glass-card rounded-2xl p-4 sm:p-5 hover:border-neon-pink/40 transition-colors cursor-pointer hover-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-pink/20 to-neon-violet/20 border border-neon-pink/30 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-neon-pink" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{c.desc}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* FAQ accordion */}
          <div className="glass-card rounded-3xl p-6">
            <h2 className="font-display font-bold text-white text-lg mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-2">
              {faqs.map((f, i) => {
                const isOpen = openFaq === i
                return (
                  <div key={f.q} className="border border-white/5 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-white">{f.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-neon-pink shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="p-4 pt-0 text-sm text-slate-400 leading-relaxed">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contact form */}
          <div className="glass-card rounded-3xl p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle size={18} className="text-neon-pink" />
              <h2 className="font-display font-bold text-white text-lg">Message Us</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                type="text"
                placeholder="Your name"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60 transition-colors placeholder:text-slate-500"
              />
              <input
                required
                type="email"
                placeholder="Email address"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60 transition-colors placeholder:text-slate-500"
              />
              <textarea
                required
                rows={4}
                placeholder="How can we help?"
                className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60 transition-colors placeholder:text-slate-500 resize-none"
              />
              <button
                type="submit"
                className="w-full btn-gradient text-white font-semibold rounded-xl py-3 shadow-glow flex items-center justify-center gap-2"
              >
                <Send size={16} /> {sent ? 'Message Sent!' : 'Send Message'}
              </button>
              {sent && (
                <p className="text-emerald-400 text-xs text-center">
                  We'll get back to you within 24 hours.
                </p>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
