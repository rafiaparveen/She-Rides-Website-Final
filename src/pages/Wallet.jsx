import { useState } from 'react'
import { ArrowLeft, ArrowDownToLine, Banknote, CheckCircle2, Clock3, Smartphone, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const providers = [
  { id: 'bank', label: 'Bank transfer', icon: Banknote },
  { id: 'easypaisa', label: 'Easypaisa', icon: Smartphone },
  { id: 'jazzcash', label: 'JazzCash', icon: Smartphone },
]

export default function Wallet() {
  const { authUser, wallet, topUpWallet } = useApp()
  const isCaptain = authUser?.role === 'captain'
  const [provider, setProvider] = useState('easypaisa')
  const [amount, setAmount] = useState('300')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submitTopUp(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await topUpWallet(provider, Number(amount))
      setMessage(`Demo top-up of Rs ${Number(amount).toLocaleString('en-PK')} added through ${providers.find((item) => item.id === provider)?.label}.`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not add wallet funds.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-pink">Payments</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">{isCaptain ? 'Captain wallet' : 'Passenger wallet'}</h1>
          <p className="mt-2 text-sm text-slate-400">
            {isCaptain ? 'Manage funds for your captain account.' : 'Keep at least Rs 300 in your wallet before requesting a ride.'}
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-slate-200 hover:border-neon-pink/50">
          <ArrowLeft size={16} className="text-neon-pink" /> Back
        </Link>
      </header>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-card rounded-3xl p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neon-pink/15 text-neon-pink">
              <WalletCards size={23} />
            </span>
            <div>
              <p className="text-xs text-slate-400">Available balance</p>
              <p className="font-display text-2xl font-bold text-white">Rs {Number(wallet.balance || 0).toLocaleString('en-PK')}</p>
            </div>
          </div>

          <form onSubmit={submitTopUp} className="mt-6 space-y-4">
            <fieldset>
              <legend className="mb-2 text-xs font-semibold text-slate-300">Choose payment method</legend>
              <div className="grid gap-2">
                {providers.map(({ id, label, icon: Icon }) => (
                  <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${
                    provider === id ? 'border-neon-pink/60 bg-neon-pink/10' : 'border-white/10 bg-slate-900/40'
                  }`}>
                    <input type="radio" name="wallet-provider" value={id} checked={provider === id}
                      onChange={() => setProvider(id)} className="accent-pink-500" />
                    <Icon size={17} className="text-slate-300" />
                    <span className="text-sm font-medium text-white">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-300">Top-up amount (minimum Rs 300)</span>
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
              <ArrowDownToLine size={17} /> {busy ? 'Processing demo top-up…' : `Add Rs ${Number(amount || 0).toLocaleString('en-PK')}`}
            </button>
          </form>
          <p className="mt-4 text-[11px] leading-5 text-amber-200/80">
            Demo only: this simulates Bank/Easypaisa/JazzCash. No actual transfer or payment is made.
          </p>
        </section>

        <section className="glass-card rounded-3xl p-6 sm:p-7">
          <h2 className="mb-4 font-display text-xl font-bold text-white">Wallet activity</h2>
          {wallet.ledger.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
              <Clock3 size={22} className="mx-auto text-slate-500" />
              <p className="mt-3 text-sm text-slate-400">Your top-ups and ride charges will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {wallet.ledger.map((entry) => {
                const isCredit = entry.type === 'top_up' || entry.type === 'ride_refund'
                return (
                  <article key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-900/40 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isCredit ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-300'}`}>
                        {isCredit ? <CheckCircle2 size={17} /> : <Banknote size={17} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {entry.type === 'top_up' ? `Top-up · ${providers.find((item) => item.id === entry.provider)?.label || 'Wallet'}` :
                            entry.type === 'ride_refund' ? 'Ride refund' : entry.status === 'refunded' ? 'Ride charge · refunded' : 'Ride charge'}
                        </p>
                        <p className="text-[10px] text-slate-500">{new Date(entry.createdAt).toLocaleString('en-PK')}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${isCredit ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {isCredit ? '+' : '-'}Rs {Number(entry.amount).toLocaleString('en-PK')}
                    </span>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
