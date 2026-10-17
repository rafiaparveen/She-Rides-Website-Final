import { motion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Car,
  MapPinned,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const services = [
  {
    title: 'Scooty rides',
    description: 'Quick, affordable trips for everyday errands and short Karachi routes.',
    image: '/reference-visuals/WhatsApp Image 2026-08-27 at 1.23.43 PM.jpeg',
    icon: Bike,
  },
  {
    title: 'Everyday cars',
    description: 'Comfortable rides in practical cars for work, campus and family plans.',
    image: '/reference-visuals/WhatsApp Image 2026-08-27 at 1.23.45 PM.jpeg',
    icon: Car,
  },
  {
    title: 'Parcel runs',
    description: 'Send essentials across the city with a verified SheRides captain.',
    image: '/reference-visuals/WhatsApp Image 2026-08-27 at 1.23.46 PM (1).jpeg',
    icon: MapPinned,
  },
]

const safetyFeatures = [
  { title: 'Verified captains', text: 'Every captain is reviewed and approved before accepting rides.', icon: BadgeCheck },
  { title: 'Live trip sharing', text: 'Share your route with trusted contacts while you are moving.', icon: Users },
  { title: 'One-tap SOS', text: 'Reach your safety contacts quickly when a situation needs attention.', icon: PhoneCall },
]

export default function WhySheRides() {
  return (
    <div id="about" className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 scroll-mt-20">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] border border-neon-pink/25 bg-slate-900/75 px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-12"
      >
        <img src="/reference-visuals/why-hero.png" alt="SheRides captain with app and riders" className="absolute inset-0 h-full w-full object-cover object-center opacity-95 brightness-105 contrast-110" />
        <div className="absolute inset-0 bg-gradient-to-r from-midnight-950/90 via-midnight-950/75 to-midnight-950/35" />
        <span className="absolute right-4 top-4 rounded-full border border-neon-pink/60 bg-neon-pink/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-glow sm:right-6 sm:top-6 sm:text-xs">SheRides Captain</span>

        <div className="relative flex min-h-[420px] items-center sm:min-h-[480px] lg:min-h-[560px]">
          <div className="max-w-xl pb-16 sm:pb-20 lg:pb-0">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-neon-pink sm:text-xs">
              <Sparkles size={14} /> Built for Karachi women
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              A ride network made around your peace of mind.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-slate-200 sm:text-base lg:text-lg">
              SheRides connects women with trained female captains for reliable rides, practical fares and safety tools that stay close throughout the journey.
            </p>
            <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-pink to-neon-violet px-5 py-3 text-sm font-bold text-white shadow-glow hover:brightness-110">
              Explore your dashboard <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </motion.section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">Move your way</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Services for real life</h2>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-slate-500 sm:block">From a quick scooty hop to a family car ride, choose what fits your day.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => {
            const Icon = service.icon
            return (
              <motion.article
                key={service.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={service.image} alt={`${service.title}, SheRides reference visual`} className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-midnight-950/90 via-transparent to-transparent" />
                  <span className="absolute right-3 top-3 rounded-full bg-neon-pink/90 px-2 py-1 text-[10px] font-bold text-white">SheRides</span>
                  <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neon-pink text-white shadow-glow"><Icon size={19} /></div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-white">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{service.description}</p>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-white/10">
          <img src="/reference-visuals/why-team.png" alt="SheRides team of women captains" className="absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/20 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="rounded-full border border-neon-pink/40 bg-neon-pink/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">SheRides Captain • Women supporting women</span>
            <p className="mt-3 max-w-sm font-display text-2xl font-bold text-white">More confidence at every pickup point.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-neon-pink/20 bg-gradient-to-br from-neon-pink/10 to-slate-900/80 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-pink/15 text-neon-pink"><ShieldCheck size={22} /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neon-pink">Safety first</p>
              <h2 className="font-display text-2xl font-bold text-white">Tools that stay with you</h2>
            </div>
          </div>
          <div className="mt-8 space-y-5">
            {safetyFeatures.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="flex gap-4">
                  <Icon size={20} className="mt-1 shrink-0 text-neon-pink" />
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{feature.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <Link to="/safety" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-neon-pink">Explore the safety centre <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="mt-12 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-center sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-violet">Join the network</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">Drive with purpose. Earn on your schedule.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">SheRides gives women captains flexible routes, a supportive community and a platform designed around dignity and independence.</p>
        <Link to="/support" className="mt-6 inline-flex items-center gap-2 rounded-full border border-neon-pink/50 px-5 py-3 text-sm font-bold text-pink-100 hover:bg-neon-pink/10">Talk to our team <ArrowRight size={16} /></Link>
      </section>
    </div>
  )
}
