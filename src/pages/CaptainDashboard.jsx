import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Banknote,
  Bike,
  Camera,
  Car,
  Check,
  Clock3,
  ChevronDown,
  LogOut,
  LocateFixed,
  MapPin,
  Navigation,
  Power,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { resizeProfileImage } from '../lib/profileImage.js'
import { KARACHI_CENTER } from '../lib/geo.js'
import { publishCaptainPresence } from '../lib/captainPresence.js'
import { apiRequest, getAccessToken } from '../lib/api.js'
import { isDemoSessionToken } from '../lib/demoAuth.js'

const LiveMap = lazy(() => import('../components/LiveMap.jsx'))

const demoRequests = [
  { id: 'ride-1', rider: 'Demo Passenger A', pickup: 'Clifton Block 5', dropoff: 'Dolmen Mall Clifton', fare: 850, distance: '4.2 km' },
  { id: 'ride-2', rider: 'Demo Passenger B', pickup: 'Bahadurabad', dropoff: 'Tariq Road', fare: 620, distance: '3.1 km' },
  { id: 'ride-3', rider: 'Demo Passenger C', pickup: 'Gulshan-e-Iqbal', dropoff: 'University Road', fare: 540, distance: '2.8 km' },
]

export default function CaptainDashboard() {
  const {
    authUser,
    profile,
    updateProfile,
    logout,
    captainOnline,
    captainTrips,
    setCaptainOnline,
    addCaptainTrip,
    updateCaptainTrip,
  } = useApp()
  const [requestQueue, setRequestQueue] = useState(() => authUser?.isDemo ? demoRequests : [])
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [profileDraft, setProfileDraft] = useState({ name: profile.name, phone: profile.phone })
  const [captainLocation, setCaptainLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [offerDraft, setOfferDraft] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const application = authUser?.captainApplication
  const approved = application?.status === 'approved' || authUser?.isDemo === true
  const activeTrip = captainTrips.find((trip) => ['accepted', 'in_progress'].includes(trip.status))
  const visibleRequest = requestQueue[0] || null
  const completedTrips = captainTrips.filter((trip) => trip.status === 'completed')
  const earnings = completedTrips.reduce((total, trip) => total + Number(trip.fare || 0) * 0.8, 0)
  const VehicleIcon = application?.vehicleType === 'car' ? Car : Bike
  const onTrip = Boolean(activeTrip)

  useEffect(() => {
    const token = getAccessToken()
    if (!approved || !token || isDemoSessionToken(token)) return undefined

    let active = true
    const refreshRequests = async () => {
      try {
        const response = await apiRequest('/captains/ride-requests', { token })
        if (!active) return
        const serverRequests = (response.rides || [])
          .filter((ride) => ride.status === 'pending')
          .map((ride) => ({
            id: ride.id,
            apiId: ride.id,
            rider: 'New passenger request',
            pickup: ride.pickup.name,
            dropoff: ride.dropoff.name,
            fare: ride.fare,
            distance: 'Route set by passenger',
          }))
        setRequestQueue((current) => [
          ...serverRequests,
          ...current.filter((request) => !request.apiId),
        ])
      } catch {
        // Retain the last known requests while the API reconnects.
      }
    }

    void refreshRequests()
    const intervalId = window.setInterval(refreshRequests, 4000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [approved])

  useEffect(() => {
    const publishPresence = (location) => publishCaptainPresence({
      available: captainOnline && approved,
      onTrip,
      location: captainOnline || onTrip ? location : null,
      name: profile.name || authUser?.name || 'SheRides Captain',
      image: profile.avatar || '/reference-visuals/driver-1.png',
      updatedAt: new Date().toISOString(),
    })

    if (!approved || (!captainOnline && !onTrip)) {
      setCaptainLocation(null)
      setLocationError('')
      publishPresence(null)
      return undefined
    }
    if (!navigator.geolocation) {
      setLocationError('Live GPS is not supported by this browser.')
      publishPresence(null)
      return undefined
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setCaptainLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          updatedAt: new Date().toISOString(),
        })
        publishPresence({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          updatedAt: new Date().toISOString(),
        })
        setLocationError('')
      },
      (error) => {
        setLocationError(error.code === error.PERMISSION_DENIED
          ? 'Allow location access in your browser to show your live GPS position.'
          : 'Could not get your GPS position. Check location services and try again.')
        publishPresence(null)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [captainOnline, approved, onTrip, profile.name, profile.avatar, authUser?.name])

  async function handleProfilePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPhotoError('')
    try {
      updateProfile({ avatar: await resizeProfileImage(file) })
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Could not update your photo.')
    }
  }

  function saveProfile(event) {
    event.preventDefault()
    if (profileDraft.name.trim().length < 2) return
    updateProfile({ name: profileDraft.name.trim(), phone: profileDraft.phone.trim() })
    setProfileEditOpen(false)
  }

  async function acceptRequest(request) {
    let riderName = request.rider
    if (request.apiId) {
      try {
        const token = getAccessToken()
        const response = await apiRequest(`/captains/ride-requests/${encodeURIComponent(request.apiId)}/accept`, {
          method: 'POST',
          token,
        })
        riderName = response.rider || riderName
      } catch (error) {
        setOfferMessage(error instanceof Error ? error.message : 'Could not accept this ride request.')
        return
      }
    }
    const acceptedFare = Number(request.offer || request.fare || 0)
    addCaptainTrip({
      id: request.apiId || `CAP-${Date.now().toString().slice(-7)}`,
      ...(request.apiId ? { rideRequestId: request.apiId } : {}),
      rider: riderName,
      pickup: request.pickup,
      dropoff: request.dropoff,
      fare: acceptedFare,
      status: 'accepted',
      date: new Date().toISOString(),
    })
    setRequestQueue((current) => current.filter((item) => item.id !== request.id))
    setOfferMessage('')
    setOfferDraft('')
  }

  async function updateActiveTrip(status) {
    if (activeTrip.rideRequestId) {
      try {
        await apiRequest(`/captains/ride-requests/${encodeURIComponent(activeTrip.rideRequestId)}/status`, {
          method: 'POST',
          body: { status },
        })
      } catch (error) {
        setOfferMessage(error instanceof Error ? error.message : 'Could not update this ride.')
        return
      }
    }
    updateCaptainTrip(activeTrip.id, status)
    setOfferMessage('')
    if (status === 'completed') setCaptainOnline(true)
  }

  function sendOffer(request) {
    const offerAmount = Number(offerDraft) || Number(request.fare || 0)
    const nextQueue = requestQueue.map((item) => item.id === request.id ? { ...item, offer: offerAmount } : item)
    setRequestQueue(nextQueue)
    setOfferMessage(`Offer sent to ${request.rider}: Rs ${offerAmount.toLocaleString('en-PK')}`)
    setOfferDraft('')
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-12 sm:px-6">
      <header className="mb-6">
        <nav aria-label="Captain navigation" className="mb-6 flex items-center justify-between gap-3">
          <Link to="/" aria-label="SheRides captain dashboard" className="flex min-w-0 items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neon-pink/50 bg-slate-950 shadow-glow">
              <img src="/reference-visuals/brand-badge.png" alt="" className="h-full w-full object-cover" />
            </span>
            <span className="font-display text-base font-bold text-white sm:text-lg">
              She<span className="text-gradient">Rides</span>
            </span>
          </Link>
          <div className="relative flex shrink-0 items-center gap-2">
            <Link to="/wallet" aria-label="Wallet" title="Wallet" className="flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-2.5 text-sm font-semibold text-slate-200 hover:border-neon-pink/50 sm:px-3">
              <Wallet size={16} className="text-neon-pink" /> <span className="hidden sm:inline">Wallet</span>
            </Link>
            <Link to="/captain/money" aria-label="Money" title="Money" className="flex items-center gap-2 rounded-xl border border-white/10 px-2.5 py-2.5 text-sm font-semibold text-slate-200 hover:border-neon-pink/50 sm:px-3">
              <Banknote size={16} className="text-neon-pink" /> <span className="hidden sm:inline">Money</span>
            </Link>
            <button type="button" onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Captain profile menu" aria-expanded={profileMenuOpen}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 p-1.5 text-white hover:border-neon-pink/50">
              <img src={profile.avatar || '/reference-visuals/driver-1.png'} alt={`${profile.name || 'Captain'} profile`}
                className="h-10 w-10 rounded-full border border-neon-pink/50 object-cover" />
              <ChevronDown size={15} className="mr-1 text-slate-400" />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-14 z-20 w-52 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-800">
                  <Camera size={15} className="text-neon-pink" /> Change photo
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePhoto} className="sr-only" />
                </label>
                <button type="button" onClick={() => {
                  setProfileDraft({ name: profile.name, phone: profile.phone })
                  setProfileMenuOpen(false)
                  setProfileEditOpen(true)
                }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800">
                  <BadgeCheck size={15} className="text-neon-pink" /> Edit profile
                </button>
                <button type="button" onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-500/10">
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </nav>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">Captain portal</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
            Hi, {authUser?.name || 'Captain'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">Your trips, requests, and earnings at a glance.</p>
        </div>
      </header>

      {photoError && <p role="alert" className="mb-4 text-right text-xs text-red-300">{photoError}</p>}
      {application && (
        <section className="glass-card mb-5 rounded-2xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            {approved
              ? <BadgeCheck size={20} className="mt-0.5 shrink-0 text-emerald-400" />
              : <Clock3 size={20} className="mt-0.5 shrink-0 text-amber-300" />}
            <div>
              <h2 className="font-semibold text-white">{approved ? 'Captain account approved' : 'Application under review'}</h2>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                {approved
                  ? 'You can go online and manage incoming ride requests.'
                  : 'CNIC, driving license, and vehicle papers need an authorized review before accepting rides.'}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Today&apos;s demo earnings</p>
              <p className="mt-2 font-display text-2xl font-bold text-white">
                Rs {Math.round(earnings).toLocaleString('en-PK')}
              </p>
            </div>
            <Wallet size={21} className="text-neon-pink" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Illustrative estimate after a demo 20% service fee.</p>
        </div>
        <div className="glass-card flex items-center justify-between rounded-2xl p-5">
          <div>
            <p className="text-xs text-slate-400">Captain availability</p>
            <p className={`mt-2 font-semibold ${captainOnline ? 'text-emerald-400' : 'text-slate-300'}`}>
              {captainOnline ? 'Online and ready' : 'Currently offline'}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={captainOnline}
            aria-label="Go online to receive demo requests" disabled={!approved}
            onClick={() => setCaptainOnline(!captainOnline)}
            className={`relative h-8 w-14 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              captainOnline ? 'bg-emerald-500' : 'bg-slate-700'
            }`}>
            <Power size={14} className="absolute left-2 top-2 text-white/80" />
            <span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              captainOnline ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </section>

      <section className="glass-card mb-5 overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <LocateFixed size={18} className="text-neon-pink" /> Live captain map
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {captainLocation
                ? `GPS updated ${new Date(captainLocation.updatedAt).toLocaleTimeString('en-PK')}${captainLocation.accuracy ? ` · ±${Math.round(captainLocation.accuracy)} m` : ''}`
                : captainOnline || onTrip ? 'Waiting for your device GPS…' : 'Go online to show your current GPS position.'}
            </p>
          </div>
          {captainLocation && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> GPS live
            </span>
          )}
        </div>
        {locationError && <p role="alert" className="px-5 pb-3 text-xs text-amber-200">{locationError}</p>}
        <div className="relative h-[300px] border-t border-white/5 sm:h-[380px]">
          <Suspense fallback={<div className="flex h-full items-center justify-center bg-slate-900 text-sm text-slate-400">Loading map…</div>}>
            <LiveMap
              pickup={null}
              dropoff={null}
              driverPos={null}
              assignedDriver={null}
              phase="idle"
              focusPoint={captainLocation || KARACHI_CENTER}
              liveLocation={captainLocation}
            />
          </Suspense>
          <span className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-full border border-white/10 bg-slate-950/90 px-3 py-1.5 text-[10px] text-slate-300">
            Live location is shared with passengers while online or on an active trip.
          </span>
        </div>
      </section>

      {activeTrip && (
        <section className="glass-card mb-5 rounded-2xl border border-neon-pink/30 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-neon-pink">Active request</p>
          <h2 className="mt-2 font-display text-lg font-bold text-white">{activeTrip.rider}</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex gap-2 text-slate-300"><MapPin size={16} className="shrink-0 text-emerald-400" /> Pickup: {activeTrip.pickup}</p>
            <p className="flex gap-2 text-slate-300"><Navigation size={16} className="shrink-0 text-neon-pink" /> Drop-off: {activeTrip.dropoff}</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-white">Fare estimate: Rs {activeTrip.fare}</p>
          {activeTrip.status === 'accepted' ? (
            <button type="button" onClick={() => void updateActiveTrip('in_progress')}
              className="btn-gradient mt-4 rounded-xl px-4 py-3 text-sm font-semibold text-white">
              Start trip
            </button>
          ) : (
            <button type="button" onClick={() => {
              void updateActiveTrip('completed')
            }} className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
              <Check size={16} /> Complete trip
            </button>
          )}
        </section>
      )}

      {!activeTrip && approved && visibleRequest && (
        <section className="glass-card mb-5 rounded-2xl p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neon-pink">
                {captainOnline ? 'Incoming request · Demo' : 'Queued customer request · Offline'}
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-white">{visibleRequest.rider}</h2>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              {visibleRequest.distance}
            </span>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex gap-2 text-slate-300"><MapPin size={16} className="shrink-0 text-emerald-400" /> {visibleRequest.pickup}</p>
            <p className="flex gap-2 text-slate-300"><Navigation size={16} className="shrink-0 text-neon-pink" /> {visibleRequest.dropoff}</p>
          </div>
          <p className="mt-4 font-display text-xl font-bold text-white">
            {visibleRequest.offer ? `Offer: Rs ${Number(visibleRequest.offer).toLocaleString('en-PK')}` : `Rs ${Number(visibleRequest.fare).toLocaleString('en-PK')}`}
          </p>
          {visibleRequest.offer && (
            <p className="mt-2 text-xs text-emerald-300">Current passenger offer: Rs {Number(visibleRequest.offer).toLocaleString('en-PK')}</p>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="number"
              min="300"
              step="50"
              value={offerDraft}
              onChange={(event) => setOfferDraft(event.target.value)}
              placeholder="Offer amount"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60 sm:max-w-[180px]"
            />
            <button type="button" onClick={() => sendOffer(visibleRequest)}
              className="flex items-center gap-2 rounded-xl border border-neon-pink/50 bg-neon-pink/10 px-4 py-3 text-sm font-semibold text-neon-pink">
              <Check size={16} /> Send offer
            </button>
          </div>

          {offerMessage && <p className="mt-3 text-xs text-emerald-300">{offerMessage}</p>}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" disabled={!captainOnline} onClick={() => void acceptRequest(visibleRequest)}
              className="btn-gradient flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Check size={16} /> {captainOnline ? 'Accept request' : 'Go online to accept'}
            </button>
            <button type="button" onClick={() => {
              setRequestQueue((current) => current.slice(1))
              setOfferDraft('')
              setOfferMessage('')
            }} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300">
              <X size={16} /> Skip
            </button>
          </div>
        </section>
      )}

      <section className="glass-card mb-5 rounded-2xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-pink/10 text-neon-pink">
            <VehicleIcon size={20} />
          </span>
          <div>
            <h2 className="font-semibold text-white">Your vehicle</h2>
            <p className="text-xs text-slate-500">{application?.registrationNumber || 'Application vehicle details'}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          {application ? `${application.vehicleMake} ${application.vehicleModel} · ${application.vehicleYear}` : 'Captain demo account'}
        </p>
        <p className="mt-2 break-all text-xs text-slate-500">{authUser?.email} · {application?.phone}</p>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-white">Recent trips</h2>
        {captainTrips.length === 0 ? (
          <p className="text-sm text-slate-400">Accepted and completed trips will appear here.</p>
        ) : (
          <div className="space-y-3">
            {captainTrips.slice(0, 6).map((trip) => (
              <article key={trip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{trip.pickup} → {trip.dropoff}</p>
                  <p className="mt-1 text-xs text-slate-500">{trip.rider} · {new Date(trip.date).toLocaleDateString('en-PK')}</p>
                </div>
                <span className="text-right text-sm font-semibold text-white">
                  Rs {trip.fare}
                  <span className="mt-1 block text-[10px] font-medium capitalize text-slate-400">{trip.status.replace('_', ' ')}</span>
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-slate-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400" />
        {authUser?.isDemo
          ? 'Demo mode: ride requests and earnings are sample data. No passenger is dispatched and no payment is processed.'
          : 'Ride offers and earnings require a live dispatch and payment service; demo controls do not contact real passengers.'}
      </p>

      {profileEditOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfileEditOpen(false)
          }}>
          <form onSubmit={saveProfile} role="dialog" aria-modal="true" aria-labelledby="captain-profile-title"
            className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h2 id="captain-profile-title" className="font-display text-xl font-bold text-white">Edit captain profile</h2>
            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Full name</span>
              <input required minLength={2} maxLength={80} value={profileDraft.name}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Phone number</span>
              <input type="tel" maxLength={40} value={profileDraft.phone || application?.phone || ''}
                onChange={(event) => setProfileDraft((draft) => ({ ...draft, phone: event.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setProfileEditOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300">Cancel</button>
              <button type="submit" className="btn-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white">Save profile</button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
