import { useState } from 'react'
import { ArrowDownToLine, Banknote, Building2, CheckCircle2, Clock3, Smartphone, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const providers = [
  { id: 'bank', label: 'Bank transfer', icon: Banknote },
  { id: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
  { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
]

function formatRupees(amount) {
  return `Rs ${Math.round(amount).toLocaleString('en-PK')}`
}

export default function CaptainMoney() {
  const { captainTrips, captainDeposits: accountDeposits, recordCaptainDeposit } = useApp()
  const captainDeposits = Array.isArray(accountDeposits) ? accountDeposits : []
  const [provider, setProvider] = useState('easypaisa')
  const [amount, setAmount] = useState('300')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const completedTrips = captainTrips
    .filter((trip) => trip.status === 'completed')
    .sort((left, right) => new Date(right.date) - new Date(left.date))
  const grossEarnings = completedTrips.reduce((total, trip) => total + Number(trip.fare || 0), 0)
  const netEarnings = grossEarnings * 0.8
  const totalDeposits = captainDeposits.reduce((total, deposit) => total + Number(deposit.amount || 0), 0)

  async function submitDeposit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await recordCaptainDeposit(provider, Number(amount))
      setMessage(`${formatRupees(Number(amount))} demo deposit recorded separately for SheRides.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not record the demo deposit.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-12 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">Captain finances</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Money</h1>
          <p className="mt-2 text-sm text-slate-400">Ride earnings and deposits to SheRides are tracked separately.</p>
        </div>
        <Link to="/" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-neon-pink/50">
          Back to dashboard
        </Link>
      </header>

      <section className="mb-5 grid gap-4 sm:grid-cols-3" aria-label="Captain money summary">
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Your demo ride earnings</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatRupees(netEarnings)}</p>
          <p className="mt-1 text-[11px] text-slate-500">After the illustrative 20% service fee</p>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Completed demo rides</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{completedTrips.length}</p>
          <p className="mt-1 text-[11px] text-slate-500">Gross fare: {formatRupees(grossEarnings)}</p>
        </article>
        <article className="glass-card rounded-2xl p-5">
          <p className="text-xs text-slate-400">Demo deposits recorded for SheRides</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatRupees(totalDeposits)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Not added to your ride earnings</p>
        </article>
      </section>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-pink/15 text-neon-pink">
              <Building2 size={22} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-white">Deposit to SheRides</h2>
              <p className="text-xs text-slate-400">Keep this separate from ride earnings.</p>
            </div>
          </div>

          <form onSubmit={submitDeposit} className="mt-6 space-y-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-300">Demo payment method</legend>
              <div className="grid gap-2">
                {providers.map(({ id, label, icon: Icon }) => (
                  <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                    provider === id ? 'border-neon-pink/60 bg-neon-pink/10' : 'border-white/10 bg-slate-900/40'
                  }`}>
                    <input type="radio" name="captain-deposit-provider" value={id} checked={provider === id}
                      onChange={() => setProvider(id)} className="accent-pink-500" />
                    <Icon size={17} className="text-slate-300" />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">Deposit amount (minimum Rs 300)</span>
              <input type="number" min="300" max="100000" step="100" required value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none focus:border-neon-pink/60" />
            </label>
            {(error || message) && (
              <p role={error ? 'alert' : 'status'} className={`rounded-xl p-3 text-xs ${
                error ? 'border border-red-400/20 bg-red-400/10 text-red-300' : 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
              }`}>
                {error || message}
              </p>
            )}
            <button disabled={busy || Number(amount) < 300 || Number(amount) > 100000}
              className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <ArrowDownToLine size={17} /> {busy ? 'Recording demo deposit…' : `Record Rs ${Number(amount || 0).toLocaleString('en-PK')} deposit`}
            </button>
          </form>
          <p className="mt-4 text-[11px] leading-5 text-amber-200/80">
            Demo only: this records a sample deposit for SheRides. Bank, Easypaisa, and JazzCash are not charged; no real money is transferred.
          </p>
        </section>

        <div className="space-y-5">
          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-neon-pink" />
              <h2 className="font-display text-xl font-bold text-white">Deposits to SheRides</h2>
            </div>
            {captainDeposits.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <Clock3 size={22} className="mx-auto text-slate-500" />
                <p className="mt-3 text-sm text-slate-400">Your demo deposits will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[...captainDeposits].reverse().map((deposit) => (
                  <article key={deposit.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          SheRides deposit · {providers.find((item) => item.id === deposit.provider)?.label || 'Payment method'}
                        </p>
                        <p className="text-[10px] text-slate-500">{new Date(deposit.createdAt).toLocaleString('en-PK')} · Demo record</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-slate-200">{formatRupees(deposit.amount)}</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <div className="mb-4 flex items-center gap-2">
              <WalletCards size={18} className="text-neon-pink" />
              <h2 className="font-display text-xl font-bold text-white">Ride earnings</h2>
            </div>
            {completedTrips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <Clock3 size={22} className="mx-auto text-slate-500" />
                <p className="mt-3 text-sm text-slate-400">Completed demo rides will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedTrips.slice(0, 20).map((trip) => (
                  <article key={trip.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{trip.pickup} → {trip.dropoff}</p>
                      <p className="text-[10px] text-slate-500">{new Date(trip.date).toLocaleString('en-PK')} · Demo ride</p>
                    </div>
                    <span className="shrink-0 text-right text-sm font-bold text-emerald-300">
                      {formatRupees(Number(trip.fare || 0) * 0.8)}
                      <span className="block text-[10px] font-medium text-slate-500">net demo earning</span>
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
