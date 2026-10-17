import { useEffect, useState } from 'react'
import { apiRequest, getAccessToken } from './api.js'
import { isDemoSessionToken } from './demoAuth.js'

const STORAGE_KEY = 'sherides_captain_presence_v1'
const PRESENCE_EVENT = 'sherides-captain-presence'
let lastServerPublish = 0

export function readCaptainPresence() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (!value) return null
    const presence = JSON.parse(value)
    if (!presence || typeof presence !== 'object') return null
    return presence
  } catch {
    return null
  }
}

export function publishCaptainPresence(presence) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presence))
  window.dispatchEvent(new Event(PRESENCE_EVENT))

  const token = getAccessToken()
  if (!token || isDemoSessionToken(token)) return
  if (presence.location && Date.now() - lastServerPublish < 5000) return
  lastServerPublish = Date.now()
  apiRequest('/captains/presence', {
    method: 'PUT',
    body: {
      online: presence.available,
      onTrip: presence.onTrip,
      location: presence.location,
    },
    token,
  }).catch(() => {})
}

export function useCaptainPresence() {
  const [presence, setPresence] = useState(readCaptainPresence)

  useEffect(() => {
    const updatePresence = () => setPresence(readCaptainPresence())
    const refreshServerPresence = async () => {
      const token = getAccessToken()
      if (!token || isDemoSessionToken(token)) {
        updatePresence()
        return
      }
      try {
        const response = await apiRequest('/captains/presence', { token })
        const captains = Array.isArray(response.captains) ? response.captains : []
        const currentCaptain = captains.find((captain) => captain.location && (captain.available || captain.onTrip))
          || captains.find((captain) => captain.available)
          || captains[0]
          || null
        setPresence(currentCaptain)
      } catch {
        updatePresence()
      }
    }

    window.addEventListener('storage', updatePresence)
    window.addEventListener(PRESENCE_EVENT, updatePresence)
    void refreshServerPresence()
    const intervalId = window.setInterval(refreshServerPresence, 5000)
    return () => {
      window.removeEventListener('storage', updatePresence)
      window.removeEventListener(PRESENCE_EVENT, updatePresence)
      window.clearInterval(intervalId)
    }
  }, [])

  return presence
}
