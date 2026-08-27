import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Clock,
  Star,
  Navigation,
  Plus,
  Minus,
  LocateFixed,
  Car,
  Gauge,
  Crown,
  Send,
  Loader2,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  X,
} from 'lucide-react'
import LiveMap from '../components/LiveMap.jsx'
import { useApp } from '../context/AppContext.jsx'
import {
  KARACHI_LOCATIONS,
  RIDE_TIERS,
  distanceKm,
  etaMinutes,
  calcFare,
  formatPKR,
  lerpLatLng,
} from '../lib/geo.js'

const DRIVER_POOL = [
  {
    name: 'Hira Malik',
    rating: 4.9,
    image: '/reference-visuals/driver-1.png',
  },
  {
    name: 'Ayesha Khan',
    rating: 4.8,
    image: '/reference-visuals/driver-2.png',
  },
  {
    name: 'Sana Tariq',
    rating: 4.9,
    image: '/reference-visuals/driver-3.png',
  },
  {
    name: 'Mahnoor Raza',
    rating: 4.7,
    image: '/reference-visuals/driver-4.png',
  },
]

const icons = { economy: Car, comfort: Gauge, premier: Crown }

const CAPTAIN_STORIES = [
  {
    name: 'Hira Malik',
    role: 'Karachi captain',
    portrait: '/reference-visuals/Pasted-Image.jpe',
    vehicle: '/reference-visuals/Pasted-Image.jpe',
    label: 'SheRides • City captain',
    vehicleName: 'Verified rider • Smart booking',
  },
  {
    name: 'Ayesha Khan',
    role: 'Verified captain',
    portrait: '/reference-visuals/Pasted-Image-2.jpe',
    vehicle: '/reference-visuals/Pasted-Image-2.jpe',
    label: 'SheRides • Trust first',
    vehicleName: 'Daily commuters • Safer trips',
  },
  {
    name: 'Sana Tariq',
    role: 'Safety-first captain',
    portrait: '/reference-visuals/Pasted-Image-3.jpe',
    vehicle: '/reference-visuals/Pasted-Image-3.jpe',
    label: 'SheRides • Women led',
    vehicleName: 'City rides • Fully verified',
  },
  {
    name: 'Mahnoor Raza',
    role: 'Comfort captain',
    portrait: '/reference-visuals/Pasted-Image-4.jpe',
    vehicle: '/reference-visuals/Pasted-Image-4.jpe',
    label: 'SheRides • Everyday trips',
    vehicleName: 'Comfort route • On time',
  },
]

export default function Dashboard() {
  const { addRideToHistory, addNotification } = useApp()
  const mapRef = useRef(null)

  const [pickup, setPickup] = useState(KARACHI_LOCATIONS[0])
  const [dropoff, setDropoff] = useState(KARACHI_LOCATIONS[1])
  const [selectingFor, setSelectingFor] = useState(null) // 'pickup' | 'dropoff' | null
  const [tier, setTier] = useState('economy')

  const [bidOpen, setBidOpen] = useState(false)
  const [bidAmount, setBidAmount] = useState('')
  const [bidResult, setBidResult] = useState(null) // { status: 'accepted'|'countered', amount }

  // phase: idle -> searching -> matched -> arrived -> ongoing -> completed
  const [phase, setPhase] = useState('idle')
  const [assignedDriver, setAssignedDriver] = useState(null)
  const [driverPos, setDriverPos] = useState(null)
  const [finalFare, setFinalFare] = useState(null)

  const km = useMemo(() => distanceKm(pickup, dropoff), [pickup, dropoff])
  const eta = useMemo(() => etaMinutes(km), [km])

  const options = useMemo(() => RIDE_TIERS.map((t) => ({ ...t, fare: calcFare(t, km) })), [km])
  const activeOption = options.find((o) => o.id === tier)
  const fareToCharge = bidResult?.status === 'accepted' ? bidResult.amount : activeOption.fare

  useEffect(() => {
    setBidResult(null)
  }, [tier, pickup, dropoff])

  function submitBid() {
    const amount = Number(bidAmount)
    if (!amount || amount <= 0) return
    const base = activeOption.fare
    if (amount >= base * 0.8) {
      setBidResult({ status: 'accepted', amount })
    } else {
      const counter = Math.round((amount + base) / 2 / 5) * 5
      setBidResult({ status: 'countered', amount: counter, original: amount })
    }
  }

  function acceptCounter() {
    setBidResult({ status: 'accepted', amount: bidResult.amount })
  }

  function requestRide() {
    setPhase('searching')
    setFinalFare(fareToCharge)

    setTimeout(() => {
      const driver = DRIVER_POOL[Math.floor(Math.random() * DRIVER_POOL.length)]
      setAssignedDriver(driver)
      const startPos = KARACHI_LOCATIONS[Math.floor(Math.random() * KARACHI_LOCATIONS.length)]
      setDriverPos(startPos)
      setPhase('matched')
      addNotification({
        type: 'info',
        title: 'Ride confirmed',
        message: `${driver.name} is on the way to your pickup point.`,
      })
    }, 2200)
  }

  useEffect(() => {
    if (phase !== 'matched') return
    let t = 0
    const start = driverPos
    const id = setInterval(() => {
      t += 0.08
      if (t >= 1) {
        setDriverPos(pickup)
        setPhase('arrived')
        clearInterval(id)
        return
      }
      setDriverPos(lerpLatLng(start, pickup, t))
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'ongoing') return
    let t = 0
    const id = setInterval(() => {
      t += 0.06
      if (t >= 1) {
        setDriverPos(dropoff)
        setPhase('completed')
        clearInterval(id)
        return
      }
      setDriverPos(lerpLatLng(pickup, dropoff, t))
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  useEffect(() => {
    if (phase !== 'completed') return
    addRideToHistory({
      id: `SR-${Math.floor(Math.random() * 90000 + 10000)}`,
      date: new Date().toISOString(),
      pickup: pickup.name,
      dropoff: dropoff.name,
      driver: assignedDriver?.name || 'Driver',
      car: options.find((o) => o.id === tier)?.car + ' — Pink/Violet',
      fare: finalFare,
      status: 'Completed',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function resetBooking() {
    if (phase !== 'idle') {
      addNotification({
        type: 'warning',
        title: 'Ride cancelled',
        message: 'Your current trip request has been cancelled successfully.',
      })
    }

    setPhase('idle')
    setAssignedDriver(null)
    setDriverPos(null)
    setBidResult(null)
    setBidAmount('')
    setBidOpen(false)
  }

  function handleMapClick(point) {
    if (phase !== 'idle') return
    let nearest = KARACHI_LOCATIONS[0]
    let best = Infinity
    for (const loc of KARACHI_LOCATIONS) {
      const d = distanceKm(point, loc)
      if (d < best) {
        best = d
        nearest = loc
      }
    }
    if (selectingFor === 'dropoff') {
      setDropoff(nearest)
      setSelectingFor(null)
    } else {
      setPickup(nearest)
      setSelectingFor('dropoff')
    }
  }

  function locateMe() {
    if (mapRef.current) {
      mapRef.current.flyTo([pickup.lat, pickup.lng], 14, { duration: 0.8 })
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch"
      >
        {/* LEFT PANEL — Fare Estimator & Booking */}
        <section className="glass-card rounded-3xl p-5 sm:p-6 order-1 h-full">
          <p className="text-slate-400 text-sm">Welcome back!</p>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Book a ride in Karachi
          </h1>
          <p className="text-xs text-slate-500 mb-5">
            {km.toFixed(1)} km • ~{eta} min in city traffic
          </p>

          <div className="space-y-4">
            <LocationField
              label="Pickup"
              color="text-neon-pink"
              value={pickup}
              onChange={setPickup}
              disabled={phase !== 'idle'}
              picking={selectingFor === 'pickup'}
              onStartPick={() => phase === 'idle' && setSelectingFor('pickup')}
            />
            <LocationField
              label="Drop-off"
              color="text-neon-violet"
              value={dropoff}
              onChange={setDropoff}
              disabled={phase !== 'idle'}
              picking={selectingFor === 'dropoff'}
              onStartPick={() => phase === 'idle' && setSelectingFor('dropoff')}
            />
            {selectingFor && (
              <p className="text-[11px] text-neon-pink -mt-2 flex items-center gap-1">
                <MapPin size={11} /> Tap the map to set your {selectingFor} point
              </p>
            )}

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Pickup time</label>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-3">
                <Clock size={16} className="text-slate-400 shrink-0" />
                <select className="bg-transparent outline-none text-sm text-white w-full appearance-none cursor-pointer">
                  <option className="bg-slate-900">Now</option>
                  <option className="bg-slate-900">In 15 minutes</option>
                  <option className="bg-slate-900">In 30 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {phase === 'idle' ? (
            <>
              <div className="mt-5 space-y-3">
                {options.map((opt, i) => {
                  const Icon = icons[opt.id]
                  const isActive = tier === opt.id
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTier(opt.id)}
                      className={`w-full text-left rounded-2xl p-4 border transition-all hover-lift ${
                        isActive
                          ? 'border-neon-pink bg-gradient-to-br from-neon-pink/10 to-neon-violet/10 shadow-glow'
                          : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isActive ? 'bg-gradient-to-br from-neon-pink to-neon-violet' : 'bg-slate-700/60'
                            }`}
                          >
                            <Icon size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{opt.name}</p>
                            <p className="text-slate-400 text-xs">{opt.car}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{formatPKR(opt.fare)}</p>
                          <p className="text-slate-500 text-[11px]">{eta} min ETA</p>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {/* Custom fare bidding */}
              <div className="mt-5 rounded-2xl border border-dashed border-neon-violet/40 bg-neon-violet/5 p-4">
                <button
                  onClick={() => setBidOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-white"
                >
                  <span>Offer your own fare</span>
                  <span className="text-neon-violet text-xs">{bidOpen ? 'Hide' : 'Bid now'}</span>
                </button>
                {bidOpen && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 flex-1">
                        <span className="text-slate-400 text-sm">Rs</span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={String(activeOption.fare)}
                          className="bg-transparent outline-none text-sm text-white w-full"
                        />
                      </div>
                      <button
                        onClick={submitBid}
                        className="btn-gradient text-white rounded-xl p-2.5 shadow-glow shrink-0"
                        aria-label="Submit bid"
                      >
                        <Send size={16} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {bidResult && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          {bidResult.status === 'accepted' ? (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 rounded-xl p-3">
                              <CheckCircle2 size={16} /> Bid accepted at {formatPKR(bidResult.amount)}!
                            </div>
                          ) : (
                            <div className="bg-slate-800/60 rounded-xl p-3">
                              <p className="text-sm text-slate-300 mb-2">
                                Your {formatPKR(bidResult.original)} offer was a bit low.
                                Drivers countered at:
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-white">
                                  {formatPKR(bidResult.amount)}
                                </span>
                                <button
                                  onClick={acceptCounter}
                                  className="text-xs font-semibold text-neon-pink border border-neon-pink/40 rounded-full px-3 py-1.5 hover:bg-neon-pink/10 transition-colors"
                                >
                                  Accept Counter
                                </button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.97 }}
                onClick={requestRide}
                className="w-full mt-5 btn-gradient text-white font-semibold rounded-xl py-3.5 shadow-glow flex items-center justify-center gap-2"
              >
                <Navigation size={16} /> Request Ride — {formatPKR(fareToCharge)}
              </motion.button>
            </>
          ) : (
            <BookingStatusPanel
              phase={phase}
              driver={assignedDriver}
              fare={finalFare}
              eta={eta}
              onReset={resetBooking}
              onStart={() => setPhase('ongoing')}
            />
          )}
        </section>

        {/* CENTER PANEL — Live Map */}
        <section className="relative order-2 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-pink-950/20 min-h-[360px] sm:min-h-[420px] lg:order-2 lg:min-h-[640px] lg:h-full">
          <LiveMap
            pickup={pickup}
            dropoff={dropoff}
            driverPos={driverPos}
            phase={phase}
            onMapClick={handleMapClick}
            mapRef={mapRef}
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white z-[400] pointer-events-none">
            <MapPin size={14} className="text-neon-pink" />
            Karachi, Pakistan
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[400]">
            <button
              onClick={locateMe}
              className="glass-card rounded-full px-5 py-2.5 flex items-center gap-2 text-sm font-medium text-white shadow-glow"
            >
              <LocateFixed size={16} className="text-neon-pink" /> Locate Me
            </button>
          </div>

          <div className="absolute right-4 bottom-5 flex flex-col gap-2 z-[400]">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-white hover:text-neon-pink transition-colors"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-white hover:text-neon-pink transition-colors"
            >
              <Minus size={16} />
            </button>
          </div>
        </section>

        {/* RIGHT PANEL — Nearby drivers & request status */}
        <section className="order-3 flex h-full flex-col gap-5 lg:order-3">
          <div className="glass-card rounded-3xl p-5">
            <h2 className="font-display font-bold text-white text-lg mb-4">
              Nearby Female Drivers
            </h2>
            <div className="space-y-3">
              {DRIVER_POOL.map((d, i) => (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-800/40 p-3 transition-colors hover:bg-slate-800/70 hover-lift"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={d.image}
                        alt={d.name}
                        className="h-12 w-12 rounded-full border-2 border-neon-pink/70 object-cover shadow-glow"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-midnight-900 bg-emerald-400 shadow-sm" />
                      <span className="absolute -left-1.5 top-0 inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-[#0b1020] shadow-sm">
                        <img src="/reference-visuals/brand-badge.png" alt="SheRides badge" className="h-full w-full object-cover" />
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{d.name}</p>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                        {d.rating} <Star size={10} fill="currentColor" />
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full border border-neon-pink/50 bg-neon-pink/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-neon-pink">
                    Online
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5">
            <h2 className="font-display font-bold text-white text-lg mb-3">Your Next Ride</h2>
            {phase === 'idle' ? (
              <p className="text-slate-500 text-sm">
                No active request. Choose a ride tier and tap Request Ride to get matched with
                a verified captain nearby.
              </p>
            ) : (
              <div className="rounded-2xl border border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-neon-violet/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">
                    {phase === 'searching' && 'Finding a captain…'}
                    {phase === 'matched' && 'Captain en route'}
                    {phase === 'arrived' && 'Captain has arrived'}
                    {phase === 'ongoing' && 'Trip in progress'}
                    {phase === 'completed' && 'Trip completed'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                {assignedDriver && (
                  <>
                    <p className="text-slate-400 text-xs">Driver: {assignedDriver.name}</p>
                    <p className="text-slate-400 text-xs mb-2">Fare: {formatPKR(finalFare)}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </motion.div>

      <section className="mt-6" aria-label="SheRides captains">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-pink sm:text-xs">Karachi captain crew</p>
            <h2 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">Women who know Karachi. Rides you can trust.</h2>
          </div>
          <span className="hidden text-xs text-slate-500 sm:block">Verified women captains making every trip feel safer</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CAPTAIN_STORIES.map((captain, index) => (
            <motion.article
              key={captain.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="group relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl"
            >
              <img
                src={captain.vehicle}
                alt={`${captain.name}'s SheRides photo`}
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/35 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-midnight-950/70 px-3 py-1.5 backdrop-blur-md">
                <span className="text-[11px] font-bold text-white">{captain.vehicleName}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 bg-gradient-to-t from-midnight-950 via-midnight-950/80 to-transparent px-4 pb-4 pt-12">
                <div>
                  <h3 className="font-display text-base font-bold text-white sm:text-lg">{captain.name}</h3>
                  <p className="text-xs text-slate-300">{captain.role}</p>
                </div>
                <span className="rounded-full border border-neon-pink/50 bg-neon-pink/15 px-2 py-1 text-[9px] font-semibold text-pink-100 whitespace-nowrap sm:text-[10px]">
                  {captain.label}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}

function LocationField({ label, color, value, onChange, disabled, picking, onStartPick }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 mb-1.5 block">{label}</label>
      <div
        className={`flex items-center gap-2 bg-slate-800/60 border rounded-xl px-3.5 py-3 transition-colors ${
          picking ? 'border-neon-pink shadow-glow' : 'border-white/10'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <MapPin size={16} className={`${color} shrink-0`} />
        <select
          value={value.name}
          disabled={disabled}
          onChange={(e) => onChange(KARACHI_LOCATIONS.find((l) => l.name === e.target.value))}
          className="bg-transparent outline-none text-sm text-white w-full appearance-none cursor-pointer disabled:cursor-not-allowed"
        >
          {KARACHI_LOCATIONS.map((loc) => (
            <option key={loc.name} value={loc.name} className="bg-slate-900">
              {loc.name}
            </option>
          ))}
        </select>
        {!disabled && (
          <button
            onClick={onStartPick}
            className="text-[10px] text-slate-400 hover:text-neon-pink shrink-0 whitespace-nowrap"
          >
            Pick on map
          </button>
        )}
      </div>
    </div>
  )
}

function BookingStatusPanel({ phase, driver, fare, eta, onReset, onStart }) {
  const steps = ['searching', 'matched', 'arrived', 'ongoing', 'completed']
  const currentIdx = steps.indexOf(phase)

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                i <= currentIdx ? 'bg-neon-pink shadow-glow' : 'bg-slate-700'
              }`}
            />
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-neon-pink' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 text-center">
        {phase === 'searching' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="animate-spin text-neon-pink" size={28} />
            <p className="text-white font-semibold text-sm">Finding your captain…</p>
            <p className="text-slate-500 text-xs">Matching you with a verified driver nearby</p>
          </div>
        )}

        {(phase === 'matched' || phase === 'arrived') && driver && (
          <div className="flex flex-col items-center gap-2 py-2">
            <img
              src={driver.image}
              alt={driver.name}
              className="w-16 h-16 rounded-full border-2 border-neon-pink shadow-glow object-cover"
            />
            <p className="text-white font-semibold">{driver.name}</p>
            <span className="flex items-center gap-1 text-amber-400 text-xs">
              {driver.rating} <Star size={11} fill="currentColor" />
            </span>
            <p className="text-slate-400 text-xs">
              {phase === 'matched' ? `Arriving in ~${Math.max(2, eta - 4)} min` : 'Arrived at pickup'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button className="w-9 h-9 rounded-full bg-slate-700/60 flex items-center justify-center text-white hover:bg-slate-600 transition-colors">
                <PhoneCall size={14} />
              </button>
              <button className="w-9 h-9 rounded-full bg-slate-700/60 flex items-center justify-center text-white hover:bg-slate-600 transition-colors">
                <MessageSquare size={14} />
              </button>
            </div>
            {phase === 'arrived' && (
              <button
                onClick={onStart}
                className="w-full mt-3 btn-gradient text-white font-semibold rounded-xl py-2.5 shadow-glow text-sm"
              >
                Start Trip
              </button>
            )}
          </div>
        )}

        {phase === 'ongoing' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Navigation className="text-neon-violet animate-pulse" size={26} />
            <p className="text-white font-semibold text-sm">On the way to your drop-off</p>
            <p className="text-slate-500 text-xs">Live tracking active on the map</p>
          </div>
        )}

        {phase === 'completed' && (
          <div className="flex flex-col items-center gap-2 py-2">
            <CheckCircle2 className="text-emerald-400" size={30} />
            <p className="text-white font-semibold">Trip completed</p>
            <p className="text-slate-400 text-sm">Fare charged: {formatPKR(fare)}</p>
            <button
              onClick={onReset}
              className="w-full mt-3 border border-white/10 text-white font-semibold rounded-xl py-2.5 text-sm hover:border-neon-pink/40 transition-colors"
            >
              Book Another Ride
            </button>
          </div>
        )}
      </div>

      {phase !== 'completed' && (
        <button
          onClick={onReset}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors"
        >
          <X size={12} /> Cancel request
        </button>
      )}
    </div>
  )
}
