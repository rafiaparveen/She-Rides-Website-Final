import { useState } from 'react'
import { Bike, Car, FileCheck2, LockKeyhole, Mail, UploadCloud, UserRound } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const demoCredentials = {
  rider: { email: 'rider.demo@sherides.local', password: 'SheRidesDemo2026!' },
  captain: { email: 'captain.demo@sherides.local', password: 'CaptainDemo2026!' },
}

const requiredDocuments = [
  { key: 'cnicFront', label: 'CNIC front side' },
  { key: 'cnicBack', label: 'CNIC back side' },
  { key: 'licenseFront', label: 'Driving license' },
  { key: 'registrationFront', label: 'Vehicle registration (front)' },
  { key: 'registrationBack', label: 'Vehicle registration (back)' },
]

function encodeDocument(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const data = result.split(',')[1]
      if (!data) {
        reject(new Error(`Could not read ${file.name}.`))
        return
      }
      resolve({ name: file.name, type: file.type, data })
    }
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

export default function Auth({ role = 'rider', onBack }) {
  const { login, signUp, apiError } = useApp()
  const displayRole = role === 'captain' ? 'captain' : 'passenger'
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captainApplication, setCaptainApplication] = useState({
    phone: '',
    vehicleType: 'motorbike',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: String(new Date().getFullYear()),
    registrationNumber: '',
    registeredOwnerName: '',
    ownerIsCaptain: true,
  })
  const [documents, setDocuments] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signup' && role === 'captain') {
        const documentPayload = {}
        for (const document of requiredDocuments) {
          documentPayload[document.key] = await encodeDocument(documents[document.key])
        }
        if (!captainApplication.ownerIsCaptain) {
          documentPayload.ownerAuthorization = await encodeDocument(documents.ownerAuthorization)
        }
        await signUp({
          name,
          email,
          password,
          role,
          captainApplication: {
            ...captainApplication,
            registeredOwnerName: captainApplication.ownerIsCaptain ? name : captainApplication.registeredOwnerName,
            vehicleYear: Number(captainApplication.vehicleYear),
          },
          documents: documentPayload,
        })
      } else if (mode === 'signup') {
        await signUp({ name, email, password, role })
      } else {
        await login({ email, password, role })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setError('')
  }

  function setCaptainField(field, value) {
    setCaptainApplication((current) => ({ ...current, [field]: value }))
  }

  function setDocument(key, file) {
    setDocuments((current) => ({ ...current, [key]: file }))
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-neon-pink/50 bg-[#0b1020] shadow-glow">
            <img src="/reference-visuals/brand-badge.png" alt="" className="h-full w-full object-cover" />
          </div>
          <p className="font-display text-2xl font-bold text-white">
            She<span className="text-gradient">Rides</span>
          </p>
          <h1 className="mt-3 font-display text-xl font-bold text-white">
            {mode === 'signup'
              ? `Create your ${role === 'captain' ? 'captain' : 'passenger'} account`
              : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'signup'
              ? `Sign up to continue ${role === 'captain' ? 'as a captain' : 'as a passenger'}.`
              : `Log in to continue ${role === 'captain' ? 'as a captain' : 'to your dashboard'}.`}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-slate-950/50 p-1">
          <button
            type="button"
            onClick={() => changeMode('signup')}
            aria-pressed={mode === 'signup'}
            className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'signup' ? 'btn-gradient text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => changeMode('login')}
            aria-pressed={mode === 'login'}
            className={`rounded-lg py-2.5 text-sm font-semibold ${mode === 'login' ? 'btn-gradient text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Log in
          </button>
        </div>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-xs font-medium text-slate-400 hover:text-white"
          >
            ← Back to passenger or captain
          </button>
        )}

        {submitting && (
          <div
            className="mb-4 h-1 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label={mode === 'signup' ? 'Creating account' : 'Logging in'}
          >
            <div className="h-full w-1/3 rounded-full bg-neon-pink auth-loading-bar" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-400">Full name</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 focus-within:border-neon-pink/60">
                <UserRound size={16} className="text-slate-500" />
                <input
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Email address</span>
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 focus-within:border-neon-pink/60">
              <Mail size={16} className="text-slate-500" />
              <input
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-400">Password</span>
            <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 focus-within:border-neon-pink/60">
              <LockKeyhole size={16} className="text-slate-500" />
              <input
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                type="password"
                required
                minLength={mode === 'signup' ? 10 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? 'At least 10 characters' : 'Your password'}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </span>
          </label>

          {mode === 'signup' && role === 'captain' && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              <div>
                <h2 className="font-display text-base font-bold text-white">Captain & vehicle details</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Upload clear photos or PDFs. Each file must be JPG, PNG, or PDF and no larger than 3 MB.
                </p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-400">Phone number</span>
                <input required type="tel" autoComplete="tel" value={captainApplication.phone}
                  onChange={(event) => setCaptainField('phone', event.target.value)} placeholder="03XX XXXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'motorbike', label: 'Motorbike / scooty', Icon: Bike },
                  { value: 'car', label: 'Car', Icon: Car },
                ].map(({ value, label, Icon }) => (
                  <button key={value} type="button" aria-pressed={captainApplication.vehicleType === value}
                    onClick={() => setCaptainField('vehicleType', value)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold ${
                      captainApplication.vehicleType === value
                        ? 'border-neon-pink/60 bg-neon-pink/10 text-white'
                        : 'border-white/10 bg-slate-800/40 text-slate-400'
                    }`}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Make</span>
                  <input required maxLength={80} value={captainApplication.vehicleMake}
                    onChange={(event) => setCaptainField('vehicleMake', event.target.value)} placeholder="e.g. Honda"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Model</span>
                  <input required maxLength={80} value={captainApplication.vehicleModel}
                    onChange={(event) => setCaptainField('vehicleModel', event.target.value)} placeholder="Model"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Year</span>
                  <input required type="number" min="1980" max={new Date().getFullYear() + 1}
                    value={captainApplication.vehicleYear}
                    onChange={(event) => setCaptainField('vehicleYear', event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-400">Registration number</span>
                  <input required maxLength={30} value={captainApplication.registrationNumber}
                    onChange={(event) => setCaptainField('registrationNumber', event.target.value)} placeholder="ABC-123"
                    className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3">
                <input type="checkbox" checked={captainApplication.ownerIsCaptain}
                  onChange={(event) => setCaptainField('ownerIsCaptain', event.target.checked)}
                  className="mt-0.5 accent-pink-500" />
                <span className="text-xs leading-5 text-slate-300">
                  The vehicle registration is in my name ({name.trim() || 'captain name'}).
                </span>
              </label>
              {!captainApplication.ownerIsCaptain && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-400">Registered owner&apos;s full name</span>
                    <input required maxLength={100} value={captainApplication.registeredOwnerName}
                      onChange={(event) => setCaptainField('registeredOwnerName', event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-pink/60" />
                  </label>
                  <DocumentField label="Owner authorization letter" file={documents.ownerAuthorization}
                    onChange={(file) => setDocument('ownerAuthorization', file)} />
                </>
              )}
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <FileCheck2 size={15} className="text-neon-pink" /> Required verification documents
                </p>
                {requiredDocuments.map(({ key, label }) => (
                  <DocumentField key={key} label={label} file={documents[key]}
                    onChange={(file) => setDocument(key, file)} />
                ))}
              </div>
              <p className="text-[11px] leading-5 text-slate-500">
                Documents are encrypted before being stored in MongoDB and are only used for captain application review.
                Vehicle ownership is self-reported and must be checked against the uploaded registration papers.
              </p>
            </div>
          )}

          {(error || apiError) && (
            <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-300">
              {error || apiError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white shadow-glow disabled:cursor-wait disabled:opacity-60"
          >
            <Car size={16} /> {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        {mode === 'login' && (
          <section aria-label="Demo login accounts" className="mt-5 rounded-xl border border-neon-pink/20 bg-slate-950/50 p-3">
            <h2 className="mb-2 text-xs font-semibold capitalize text-white">{displayRole} demo login</h2>
            <div className="rounded-lg border border-white/5 bg-slate-900/50 p-2.5">
              <p className="break-all text-[11px] text-slate-400">Email: {demoCredentials[role].email}</p>
              <p className="break-all text-[11px] text-slate-400">Password: {demoCredentials[role].password}</p>
              <button type="button" onClick={() => {
                setEmail(demoCredentials[role].email)
                setPassword(demoCredentials[role].password)
              }} className="mt-2 text-xs font-semibold capitalize text-neon-pink hover:text-white">
                Fill {displayRole} demo login
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">Demo account for testing. Login requires the SheRides API.</p>
          </section>
        )}

        <p className="mt-5 text-center text-[11px] leading-5 text-slate-500">
          {role === 'captain' && mode === 'signup'
            ? 'Captain access stays under review until submitted vehicle and identity documents are checked.'
            : 'Your account is stored on the SheRides server. Use a unique password and only use the site over HTTPS.'}
        </p>
      </section>
    </main>
  )
}

function DocumentField({ label, file, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-slate-900/40 p-3 hover:border-neon-pink/50">
      <UploadCloud size={18} className="shrink-0 text-neon-pink" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-white">{label}</span>
        <span className="mt-1 block truncate text-[11px] text-slate-500">
          {file ? file.name : 'Choose JPG, PNG, or PDF (max 3 MB)'}
        </span>
      </span>
      <input required type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
        onChange={(event) => onChange(event.target.files?.[0] || null)} className="sr-only" />
    </label>
  )
}
