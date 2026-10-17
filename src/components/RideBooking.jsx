import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Car,
  CheckCircle2,
  Crown,
  Gauge,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Minus,
  Navigation,
  Plus,
  Route,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { useCaptainPresence } from '../lib/captainPresence.js'
import { apiRequest, getAccessToken } from '../lib/api.js'
import { isDemoSessionToken } from '../lib/demoAuth.js'
import {
  KARACHI_LOCATIONS,
  RIDE_TIERS,
  calcFare,
  distanceKm,
  etaMinutes,
  formatPKR,
  lerpLatLng,
} from '../lib/geo.js'

const LiveMap = lazy(() => import('./LiveMap.jsx'))
const DEMO_CAPTAIN = {
  name: 'Demo SheRides Captain',
  rating: 5,
  car: 'Demo vehicle',
  plate: 'DEMO-000',
  eta: 3,
  image: '/reference-visuals/driver-1.png',
}

const TIER_ICONS = { economy: Car, comfort: Gauge, premier: Crown }

export default function RideBooking() {
  const {
    addRideToHistory,
    addNotification,
    wallet,
    debitWalletForRide,
    refundWalletForRide,
  } = useApp()
  const captainPresence = useCaptainPresence()
  const mapRef = useRef(null)
  const searchTimer = useRef(null)
  const recordedRideId = useRef(null)
  const locationWatchId = useRef(null)
  const ridePollTimer = useRef(null)

  const [pickup, setPickup] = useState(KARACHI_LOCATIONS[0])
  const [dropoff, setDropoff] = useState(KARACHI_LOCATIONS[1])
  const [selectingFor, setSelectingFor] = useState(null)
  const [tierId, setTierId] = useState('economy')
  const [phase, setPhase] = useState('idle')
  const [activeTrip, setActiveTrip] = useState(null)
  const [driver, setDriver] = useState(null)
  const [driverPos, setDriverPos] = useState(null)
  const [bookingError, setBookingError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [locatingPickup, setLocatingPickup] = useState(false)
  const [liveLocation, setLiveLocation] = useState(null)

  const km = useMemo(() => distanceKm(pickup, dropoff), [pickup, dropoff])
  const eta = etaMinutes(km)
  const selectedTier = RIDE_TIERS.find((tier) => tier.id === tierId) || RIDE_TIERS[0]
  const fare = calcFare(selectedTier, km)
  const mapPickup = activeTrip?.pickup || pickup
  const mapDropoff = activeTrip?.dropoff || dropoff
  const sharedCaptainLocation = captainPresence?.location
    && (captainPresence.available || captainPresence.onTrip)
    ? captainPresence.location
    : null
  const showCaptainLocation = ['matched', 'arrived', 'ongoing'].includes(phase)
  const trackedCaptainLocation = activeTrip?.rideRequestId ? driverPos : sharedCaptainLocation || driverPos
  const mapDriver = showCaptainLocation && !activeTrip?.rideRequestId && sharedCaptainLocation
    ? {
        ...DEMO_CAPTAIN,
        name: captainPresence.name || DEMO_CAPTAIN.name,
        image: captainPresence.image || DEMO_CAPTAIN.image,
        available: true,
      }
    : driver
  const mapDriverPos = showCaptainLocation ? trackedCaptainLocation : driverPos

  useEffect(() => {
    if (phase !== 'matched' || !driverPos || !activeTrip || activeTrip.rideRequestId) return undefined
    const start = driverPos
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(progress + 0.05, 1)
      setDriverPos(lerpLatLng(start, activeTrip.pickup, progress))
      if (progress === 1) {
        clearInterval(timer)
        setPhase('arrived')
      }
    }, 220)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'ongoing' || !activeTrip || activeTrip.rideRequestId) return undefined
    let progress = 0
    const timer = setInterval(() => {
      progress = Math.min(progress + 0.05, 1)
      setDriverPos(lerpLatLng(activeTrip.pickup, activeTrip.dropoff, progress))
      if (progress === 1) {
        clearInterval(timer)
        setPhase('completed')
      }
    }, 220)
    return () => clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'completed' || !activeTrip || recordedRideId.current === activeTrip.id) return
    recordedRideId.current = activeTrip.id
    addRideToHistory({
      id: activeTrip.id,
      date: new Date().toISOString(),
      pickup: activeTrip.pickup.name,
      dropoff: activeTrip.dropoff.name,
      driver: driver?.name || 'SheRides captain',
      car: `${activeTrip.tier.car} · ${driver?.plate || 'Verified captain'}`,
      fare: activeTrip.fare,
      status: 'Completed',
    })
    addNotification({
      type: 'info',
      title: 'Ride completed',
      message: `Your trip with ${driver?.name || 'your SheRides captain'} has been added to your ride history.`,
    })
  }, [phase])

  useEffect(() => {
    const requestId = activeTrip?.rideRequestId
    if (!requestId || ['completed', 'cancelled'].includes(phase)) return undefined

    let active = true
    const refreshRide = async () => {
      try {
        const response = await apiRequest(`/rides/${encodeURIComponent(requestId)}`)
        if (!active) return
        const ride = response.ride
        if (ride.captain) {
          setDriver({ ...DEMO_CAPTAIN, ...ride.captain, plate: 'Verified captain' })
          if (ride.captain.location) setDriverPos(ride.captain.location)
        }
        if (ride.status === 'accepted') setPhase((current) => current === 'searching' ? 'matched' : current)
        if (ride.status === 'in_progress') setPhase('ongoing')
        if (ride.status === 'completed') setPhase('completed')
        if (ride.status === 'cancelled') setPhase('cancelled')
      } catch {
        // Keep showing the last known trip state while the API reconnects.
      }
    }

    void refreshRide()
    ridePollTimer.current = window.setInterval(refreshRide, 3000)
    return () => {
      active = false
      window.clearInterval(ridePollTimer.current)
      ridePollTimer.current = null
    }
  }, [activeTrip?.rideRequestId, phase])

  useEffect(() => () => {
    clearTimeout(searchTimer.current)
    window.clearInterval(ridePollTimer.current)
    if (locationWatchId.current !== null) navigator.geolocation?.clearWatch(locationWatchId.current)
  }, [])

  function stopLiveLocation() {
    if (locationWatchId.current !== null) {
      navigator.geolocation?.clearWatch(locationWatchId.current)
      locationWatchId.current = null
    }
    setLocatingPickup(false)
  }

  async function requestRide() {
    if (phase !== 'idle' || pickup.name === dropoff.name) return
    stopLiveLocation()
    setBookingError('')
    const trip = {
      id: `SR-${Date.now().toString().slice(-5)}`,
      pickup,
      dropoff,
      tier: selectedTier,
      fare: Math.round(fare),
    }
    setPhase('authorizing')
    try {
      await debitWalletForRide(trip.id, trip.fare)
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Could not check your payment balance.')
      setPhase('idle')
      return
    }
    let rideRequestId = null
    const token = getAccessToken()
    if (token && !isDemoSessionToken(token)) {
      try {
        const response = await apiRequest('/rides', {
          method: 'POST',
          body: {
            pickup,
            dropoff,
            fare: trip.fare,
            tier: selectedTier.name,
          },
          token,
        })
        rideRequestId = response.ride.id
      } catch (error) {
        try {
          await refundWalletForRide(trip.id)
        } catch {
          setBookingError('Your ride request failed and the wallet refund could not be confirmed. Please contact support.')
          setPhase('idle')
          return
        }
        setBookingError(error instanceof Error ? error.message : 'Could not send the ride request.')
        setPhase('idle')
        return
      }
    }
    recordedRideId.current = null
    setActiveTrip({ ...trip, ...(rideRequestId ? { rideRequestId } : {}) })
    setDriver(null)
    setDriverPos(null)
    setPhase('searching')

    if (rideRequestId) return
    searchTimer.current = setTimeout(() => {
      const matchedDriver = DEMO_CAPTAIN
      const nearbyLocation = sharedCaptainLocation
        || KARACHI_LOCATIONS[Math.floor(Math.random() * KARACHI_LOCATIONS.length)]
      setDriver(matchedDriver)
      setDriverPos(nearbyLocation)
      setPhase('matched')
      addNotification({
        type: 'info',
        title: 'Demo captain matched',
        message: 'This is a sample ride, not a live captain dispatch.',
      })
    }, 1400)
  }

  async function cancelRide() {
    if (!activeTrip || ['idle', 'completed', 'cancelled'].includes(phase)) return
    const previousPhase = phase
    setBookingError('')
    setPhase('refunding')
    clearTimeout(searchTimer.current)
    try {
      if (activeTrip.rideRequestId) {
        await apiRequest(`/rides/${encodeURIComponent(activeTrip.rideRequestId)}/cancel`, { method: 'POST' })
      }
      await refundWalletForRide(activeTrip.id)
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Could not refund the cancelled ride.')
      setPhase(previousPhase)
      return
    }
    addRideToHistory({
      id: activeTrip.id,
      date: new Date().toISOString(),
      pickup: activeTrip.pickup.name,
      dropoff: activeTrip.dropoff.name,
      driver: driver?.name || 'No captain assigned',
      car: driver ? `${activeTrip.tier.car} · ${driver.plate}` : activeTrip.tier.car,
      fare: activeTrip.fare,
      status: 'Cancelled',
    })
    addNotification({
      type: 'warning',
      title: 'Ride cancelled',
      message: 'Your ride request has been cancelled.',
    })
    setDriverPos(null)
    setPhase('cancelled')
  }

  async function startRide() {
    if (activeTrip?.rideRequestId) {
      try {
        await apiRequest(`/captains/ride-requests/${encodeURIComponent(activeTrip.rideRequestId)}/status`, {
          method: 'POST',
          body: { status: 'in_progress' },
        })
      } catch (error) {
        setBookingError(error instanceof Error ? error.message : 'Could not start this ride.')
        return
      }
    }
    setPhase('ongoing')
  }

  function startNewBooking() {
    clearTimeout(searchTimer.current)
    setPhase('idle')
    setActiveTrip(null)
    setDriver(null)
    setDriverPos(null)
    setSelectingFor(null)
  }

  function handleMapClick(point) {
    if (phase !== 'idle' || !selectingFor) return
    const nearest = KARACHI_LOCATIONS.reduce((closest, location) => (
      distanceKm(point, location) < distanceKm(point, closest) ? location : closest
    ), KARACHI_LOCATIONS[0])
    if (selectingFor === 'pickup') {
      stopLiveLocation()
      setLiveLocation(null)
      setPickup(nearest)
    }
    else setDropoff(nearest)
    setSelectingFor(null)
  }

  function focusPickup() {
    mapRef.current?.flyTo([mapPickup.lat, mapPickup.lng], 14, { duration: 0.8 })
  }

  function useCurrentLocation() {
    if (locationWatchId.current !== null) {
      stopLiveLocation()
      setLocationError('')
      return
    }
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support GPS location.')
      return
    }
    setLocatingPickup(true)
    setLocationError('')
    locationWatchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const currentLocation = {
          name: 'My live location',
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          updatedAt: new Date().toISOString(),
        }
        setPickup(currentLocation)
        setLiveLocation(currentLocation)
        setSelectingFor(null)
        setLocationError('')
        mapRef.current?.setView([currentLocation.lat, currentLocation.lng], 15, { animate: true })
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Allow location access in your browser to set and follow your live pickup point.'
          : 'Could not get your GPS location. Check location services and try again.')
        stopLiveLocation()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
  }

  const busy = phase !== 'idle'

  return (
    <section aria-labelledby="book-ride-heading" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">Ride booking</p>
          <h2 id="book-ride-heading" className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
            Where are you going?
          </h2>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Live Karachi map
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.2fr)] xl:grid-cols-[340px_minmax(380px,1fr)]">
        <div className="glass-card order-1 rounded-3xl p-5 sm:p-6">
          <h3 className="font-display text-xl font-bold text-white">Book a ride</h3>
          <p className="mt-1 text-xs text-slate-400">
            {km.toFixed(1)} km · around {eta} min in Karachi traffic
          </p>
          <p className="mt-2 text-xs font-medium text-slate-300">
            Wallet: {formatPKR(Number(wallet.balance || 0))} · Rs 500 minimum
          </p>

          <div className="mt-5 space-y-3">
            <LocationPicker
              label="Pickup"
              color="text-neon-pink"
              value={pickup}
              disabled={busy}
              selecting={selectingFor === 'pickup'}
              onPickOnMap={() => setSelectingFor('pickup')}
              onChange={(location) => {
                if (location.name !== 'My live location') {
                  stopLiveLocation()
                  setLiveLocation(null)
                }
                setPickup(location)
              }}
            />
            <LocationPicker
              label="Drop-off"
              color="text-neon-violet"
              value={dropoff}
              onChange={setDropoff}
              disabled={busy}
              selecting={selectingFor === 'dropoff'}
              onPickOnMap={() => setSelectingFor('dropoff')}
            />
          </div>

          {selectingFor && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-neon-pink" role="status">
              <MapPin size={13} /> Tap the map to choose your {selectingFor}.
              <button type="button" onClick={() => setSelectingFor(null)} className="ml-auto text-slate-400 hover:text-white">
                Cancel
              </button>
            </p>
          )}

          {!busy && (
            <>
              {bookingError && (
                <p role="alert" className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
                  {bookingError}{' '}
                  <Link to="/wallet" className="font-bold text-neon-pink underline">Add wallet funds</Link>
                </p>
              )}
              <div className="mt-5 space-y-2.5">
                {RIDE_TIERS.map((tier) => {
                  const Icon = TIER_ICONS[tier.id]
                  const selected = tier.id === tierId
                  return (
                    <button
                      type="button"
                      key={tier.id}
                      onClick={() => setTierId(tier.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors ${
                        selected ? 'border-neon-pink/70 bg-neon-pink/10' : 'border-white/10 bg-slate-800/30 hover:border-white/20'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-neon-pink text-white' : 'bg-slate-700 text-slate-300'}`}>
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-white">{tier.name}</span>
                          <span className="block truncate text-xs text-slate-400">{tier.car}</span>
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold text-white">{formatPKR(calcFare(tier, km))}</span>
                        <span className="block text-[10px] text-slate-500">{eta} min</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={requestRide}
                disabled={pickup.name === dropoff.name}
                className="btn-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Navigation size={16} />
                {pickup.name === dropoff.name ? 'Choose a different drop-off' : `Request ride · ${formatPKR(fare)}`}
              </button>
            </>
          )}

          {phase === 'authorizing' && (
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-300" role="status">
              <LoaderCircle size={16} className="animate-spin text-neon-pink" /> Checking wallet balance…
            </p>
          )}

          {busy && activeTrip && (
            <BookingStatus
              phase={phase}
              driver={driver}
              trip={activeTrip}
              error={bookingError}
              onCancel={cancelRide}
              onStart={startRide}
              onNewBooking={startNewBooking}
            />
          )}
        </div>

        <div className="relative order-2 min-h-[390px] overflow-hidden rounded-3xl border border-white/10 shadow-xl sm:min-h-[480px] xl:min-h-[620px]">
          <Suspense fallback={<div className="flex h-full min-h-[390px] items-center justify-center bg-slate-900 text-sm text-slate-400">Loading live map…</div>}>
            <LiveMap
              pickup={mapPickup}
              dropoff={mapDropoff}
              driverPos={mapDriverPos}
              assignedDriver={mapDriver}
              phase={phase}
              onMapClick={handleMapClick}
              mapRef={mapRef}
              focusPoint={showCaptainLocation ? trackedCaptainLocation || liveLocation : liveLocation}
              liveLocation={liveLocation}
            />
          </Suspense>
          <div className="pointer-events-none absolute left-1/2 top-4 z-[400] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full glass-card px-4 py-2 text-sm text-white">
            <MapPin size={14} className="text-neon-pink" /> Karachi, Pakistan
          </div>
          <div className="absolute bottom-4 left-4 z-[400]">
            <div className="flex flex-col gap-2">
              <button type="button" onClick={useCurrentLocation} disabled={busy}
                className="flex items-center gap-2 rounded-full glass-card px-4 py-2.5 text-xs font-semibold text-white shadow-lg disabled:opacity-60">
                <LocateFixed size={15} className="text-neon-pink" />
                {locatingPickup ? 'Stop live location' : 'Use my live location'}
              </button>
              <button type="button" onClick={focusPickup} className="flex items-center gap-2 rounded-full glass-card px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
                <MapPin size={15} className="text-neon-pink" /> Center pickup
              </button>
            </div>
          </div>
          {locationError && (
            <p role="alert" className="absolute bottom-28 left-3 right-3 z-[400] rounded-xl border border-amber-300/20 bg-slate-950/90 p-2.5 text-[11px] leading-4 text-amber-200 sm:left-4 sm:right-auto sm:max-w-sm">
              {locationError}
            </p>
          )}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
            <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="flex h-9 w-9 items-center justify-center rounded-xl glass-card text-white hover:text-neon-pink">
              <Plus size={16} />
            </button>
            <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="flex h-9 w-9 items-center justify-center rounded-xl glass-card text-white hover:text-neon-pink">
              <Minus size={16} />
            </button>
          </div>
          {selectingFor && (
            <div className="absolute inset-x-3 bottom-20 z-[400] rounded-xl bg-midnight-950/90 px-3 py-2 text-center text-xs text-white sm:hidden">
              Tap near your {selectingFor} on the map
            </div>
          )}
        </div>

        <aside className="order-3 space-y-4 lg:col-span-2 xl:col-span-2">
          <div className="glass-card rounded-3xl p-5">
            <div className="flex items-center gap-2">
              <Route size={17} className="text-neon-pink" />
              <h3 className="font-display text-lg font-bold text-white">Your ride</h3>
            </div>
            {phase === 'idle' || !activeTrip ? (
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Select your pickup and destination to see your fare and route. Driver tools are in the captain experience.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-xs">
                <RouteLine label="Pickup" location={activeTrip?.pickup.name} color="text-neon-pink" />
                <RouteLine label="Drop-off" location={activeTrip?.dropoff.name} color="text-neon-violet" />
                <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3 text-slate-400">
                  <span>{activeTrip?.tier.name} · {etaMinutes(distanceKm(activeTrip.pickup, activeTrip.dropoff))} min</span>
                  <span className="font-bold text-white">{formatPKR(activeTrip?.fare || 0)}</span>
                </div>
              </div>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-4 text-slate-500">
              <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
              Map tiles and your GPS location are live when location access is allowed. Driver matching is demo data.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function LocationPicker({ label, color, value, onChange, disabled, selecting, onPickOnMap }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <div className={`flex items-center gap-2 rounded-xl border bg-slate-800/60 px-3 py-2.5 ${selecting ? 'border-neon-pink shadow-glow' : 'border-white/10'} ${disabled ? 'opacity-60' : ''}`}>
        <MapPin size={15} className={`${color} shrink-0`} />
        <select
          aria-label={label}
          value={value.name}
          disabled={disabled}
          onChange={(event) => {
            if (event.target.value === value.name) return
            const location = KARACHI_LOCATIONS.find((item) => item.name === event.target.value)
            if (location) onChange(location)
          }}
          className="w-full appearance-none bg-transparent text-sm text-white outline-none disabled:cursor-not-allowed"
        >
          {!KARACHI_LOCATIONS.some((location) => location.name === value.name) && (
            <option value={value.name} className="bg-slate-900">{value.name}</option>
          )}
          {KARACHI_LOCATIONS.map((location) => (
            <option key={location.name} value={location.name} className="bg-slate-900">{location.name}</option>
          ))}
        </select>
        {!disabled && (
          <button type="button" onClick={onPickOnMap} className="shrink-0 whitespace-nowrap text-[10px] text-slate-400 hover:text-neon-pink">
            Pick on map
          </button>
        )}
      </div>
    </div>
  )
}

function BookingStatus({ phase, driver, trip, error, onCancel, onStart, onNewBooking }) {
  const statusText = {
    authorizing: 'Checking wallet balance…',
    refunding: 'Returning ride fare to your wallet…',
    searching: 'Finding your captain…',
    matched: 'Demo captain is shown on the map',
    arrived: 'Demo captain has arrived',
    ongoing: 'Your trip is in progress',
    completed: 'Ride completed',
    cancelled: 'Ride cancelled',
  }[phase]

  return (
    <div className="mt-5 rounded-2xl border border-neon-pink/30 bg-gradient-to-br from-neon-pink/10 to-neon-violet/10 p-4" aria-live="polite">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        {phase === 'searching' ? <LoaderCircle size={16} className="animate-spin text-neon-pink" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
        {statusText}
      </div>
      {driver && (
        <div className="mt-3 flex items-center gap-3">
          <img src={driver.image} alt={driver.name} className="h-12 w-12 rounded-full border border-neon-pink/50 object-cover" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{driver.name} <span className="text-amber-400">★ {driver.rating}</span></p>
            <p className="text-xs text-slate-400">{driver.car}</p>
            <p className="text-[11px] text-slate-500">Car plate: {driver.plate} · {driver.eta} min away</p>
          </div>
        </div>
      )}
      {driver && <p className="mt-2 text-[10px] leading-4 text-amber-200/80">Demo ride only. No real driver is assigned or tracked.</p>}
      {error && <p role="alert" className="mt-3 text-xs leading-5 text-red-300">{error}</p>}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
        <span className="text-slate-400">{trip.id}</span>
        <span className="font-bold text-white">{formatPKR(trip.fare)}</span>
      </div>
      {phase === 'arrived' && (
        <button type="button" onClick={onStart} className="btn-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white">
          Start ride
        </button>
      )}
      {['searching', 'matched', 'arrived', 'ongoing', 'refunding'].includes(phase) && (
        <button type="button" onClick={onCancel} disabled={phase === 'refunding'} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-400/30 py-2 text-xs font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-60">
          <X size={14} /> {phase === 'refunding' ? 'Processing refund…' : 'Cancel ride'}
        </button>
      )}
      {['completed', 'cancelled'].includes(phase) && (
        <button type="button" onClick={onNewBooking} className="btn-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white">
          Book another ride
        </button>
      )}
    </div>
  )
}

function RouteLine({ label, location, color }) {
  return (
    <p className="flex items-start gap-2 text-slate-300">
      <MapPin size={13} className={`${color} mt-0.5 shrink-0`} />
      <span><span className="text-slate-500">{label}: </span>{location}</span>
    </p>
  )
}
