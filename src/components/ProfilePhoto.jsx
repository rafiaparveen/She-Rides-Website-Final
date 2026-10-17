import { useState } from 'react'
import { BadgeCheck, Camera, LoaderCircle } from 'lucide-react'
import { resizeProfileImage } from '../lib/profileImage.js'

export default function ProfilePhoto({ profile, updateProfile, label = 'Change profile photo', size = 'h-24 w-24', verified = false }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setSaving(true)
    try {
      const avatar = await resizeProfileImage(file)
      updateProfile({ avatar })
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'Could not update your photo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <img
          src={profile.avatar || '/reference-visuals/driver-1.png'}
          alt={`${profile.name || 'User'} profile`}
          className={`${size} rounded-full border-4 border-neon-pink/50 object-cover shadow-glow`}
        />
        {verified && (
          <span className="absolute -bottom-1 -right-1 rounded-full border-4 border-midnight-950 bg-emerald-500 p-1.5">
            <BadgeCheck size={14} className="text-white" />
          </span>
        )}
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-neon-pink hover:text-white">
        {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Camera size={14} />}
        {saving ? 'Saving photo…' : label}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="sr-only" />
      </label>
      {error && <p role="alert" className="mt-2 max-w-52 text-center text-[10px] text-red-300">{error}</p>}
    </div>
  )
}
