import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BadgeCheck,
  UploadCloud,
  Phone,
  Mail,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import ProfilePhoto from '../components/ProfilePhoto.jsx'

export default function Profile() {
  const { profile, updateProfile, contacts, addContact, updateContact, removeContact } = useApp()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(profile)
  const [saved, setSaved] = useState(false)

  useEffect(() => setForm(profile), [profile])

  function handleSave() {
    updateProfile(form)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold text-white">Profile</h1>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full"
              >
                <CheckCircle2 size={13} /> Profile updated
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Profile card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col items-center text-center h-fit">
            <div className="mb-4">
              <ProfilePhoto profile={profile} updateProfile={updateProfile} verified={profile.verified} />
            </div>

            {editing ? (
              <div className="w-full space-y-2.5 text-left">
                <Field label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
                <Field label="Email" value={form.email} disabled onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                <Field label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
              </div>
            ) : (
              <>
                <h2 className="text-white font-display font-bold text-xl">{profile.name}</h2>
                <p className="text-slate-500 text-sm mb-4">Passenger in Karachi since Jan 2025</p>
                {profile.verified && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1.5 rounded-full mb-5">
                    <ShieldCheck size={14} /> 100% Verified Female
                  </span>
                )}
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Mail size={15} className="text-slate-500 shrink-0" /> {profile.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Phone size={15} className="text-slate-500 shrink-0" /> {profile.phone}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <MapPin size={15} className="text-slate-500 shrink-0" /> {profile.address}
                  </div>
                </div>
              </>
            )}

            {editing ? (
              <div className="w-full flex gap-2 mt-6">
                <button
                  onClick={() => {
                    setForm(profile)
                    setEditing(false)
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-slate-300 hover:border-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl btn-gradient text-white text-sm font-semibold shadow-glow flex items-center justify-center gap-1.5"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full mt-6 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white hover:border-neon-pink/40 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <CnicSection />

            {/* Emergency contacts */}
            <div className="glass-card rounded-3xl p-6">
              <ContactsSection
                contacts={contacts}
                addContact={addContact}
                updateContact={updateContact}
                removeContact={removeContact}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function Field({ label, value, onChange, disabled = false }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-slate-500 mb-1 block">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-pink/60 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  )
}

function CnicSection() {
  const { cnic, setCnicSide } = useApp()

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-bold text-lg">CNIC Verification</h3>
        <span
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            cnic.front?.status === 'verified' && cnic.back?.status === 'verified'
              ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-amber-400 bg-amber-400/10'
          }`}
        >
          <BadgeCheck size={12} />
          {cnic.front?.status === 'verified' && cnic.back?.status === 'verified'
            ? 'Verified'
            : 'Pending'}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CnicUploadBox side="front" label="CNIC — Front" file={cnic.front} onUpload={setCnicSide} />
        <CnicUploadBox side="back" label="CNIC — Back" file={cnic.back} onUpload={setCnicSide} />
      </div>
    </div>
  )
}

function CnicUploadBox({ side, label, file, onUpload }) {
  const inputRef = useRef(null)
  const timeoutRefs = useRef([])
  const previewUrlRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState(file?.status || null) // null | 'uploading' | 'pending' | 'verified'

  useEffect(() => () => {
    timeoutRefs.current.forEach(clearTimeout)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    timeoutRefs.current.forEach(clearTimeout)
    timeoutRefs.current = []
    const url = URL.createObjectURL(f)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setStatus('uploading')
    onUpload(side, { name: f.name, status: 'uploading', uploadedAt: new Date().toISOString() })

    const pendingTimeout = setTimeout(() => {
      setStatus('pending')
      onUpload(side, { name: f.name, status: 'pending', uploadedAt: new Date().toISOString() })
      const verifiedTimeout = setTimeout(() => {
        setStatus('verified')
        onUpload(side, { name: f.name, status: 'verified', uploadedAt: new Date().toISOString() })
      }, 1800)
      timeoutRefs.current.push(verifiedTimeout)
    }, 900)
    timeoutRefs.current.push(pendingTimeout)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="border border-dashed border-white/15 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-2 hover:border-neon-pink/40 transition-colors cursor-pointer bg-slate-800/30 relative overflow-hidden min-h-[140px] hover-lift"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />

      {previewUrl ? (
        <img src={previewUrl} alt={`${label} preview`} className="absolute inset-0 w-full h-full object-cover opacity-40" />
      ) : null}

      <div className="relative z-10 flex flex-col items-center gap-2">
        {status === 'uploading' ? (
          <Loader2 size={22} className="text-neon-pink animate-spin" />
        ) : (
          <UploadCloud size={22} className={status === 'verified' ? 'text-emerald-400' : 'text-slate-400'} />
        )}
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-[11px] text-slate-400">
          {status === 'uploading' && 'Uploading…'}
          {status === 'pending' && 'Under review…'}
          {status === 'verified' && `Verified — ${file?.name || 'document'}`}
          {!status && 'Click to upload (JPG, PNG)'}
        </p>
      </div>
    </div>
  )
}

function ContactsSection({ contacts, addContact, updateContact, removeContact }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ name: '', relation: '', phone: '' })

  function startAdd() {
    setDraft({ name: '', relation: '', phone: '' })
    setAdding(true)
    setEditingId(null)
  }

  function startEdit(c) {
    setDraft({ name: c.name, relation: c.relation, phone: c.phone })
    setEditingId(c.id)
    setAdding(false)
  }

  function submitDraft() {
    if (!draft.name || !draft.phone) return
    if (editingId) {
      updateContact(editingId, draft)
      setEditingId(null)
    } else {
      addContact(draft)
      setAdding(false)
    }
    setDraft({ name: '', relation: '', phone: '' })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-display font-bold text-lg">Emergency SOS Contacts</h3>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 text-xs font-semibold text-neon-pink border border-neon-pink/40 rounded-full px-3 py-1.5 hover:bg-neon-pink/10 transition-colors"
        >
          <Plus size={13} /> Add Contact
        </button>
      </div>

      {(adding || editingId) && (
        <div className="mb-4 bg-slate-800/50 border border-white/10 rounded-2xl p-4 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-pink/60"
            />
            <input
              placeholder="Relation"
              value={draft.relation}
              onChange={(e) => setDraft((d) => ({ ...d, relation: e.target.value }))}
              className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-pink/60"
            />
            <input
              placeholder="+92 3xx xxxxxxx"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-neon-pink/60"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setAdding(false)
                setEditingId(null)
              }}
              className="text-xs font-semibold text-slate-400 px-3 py-1.5 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitDraft}
              className="text-xs font-semibold text-white btn-gradient rounded-full px-4 py-1.5 shadow-glow"
            >
              {editingId ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="flex items-center justify-between bg-slate-800/40 border border-white/5 rounded-2xl p-4 hover-lift"
          >
            <div>
              <p className="text-white text-sm font-semibold">{c.name}</p>
              <p className="text-slate-500 text-xs">
                {c.relation} • {c.phone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => startEdit(c)}
                className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => removeContact(c.id)}
                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </motion.div>
        ))}
        {contacts.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-6">
            No emergency contacts added yet.
          </p>
        )}
      </div>
    </>
  )
}
