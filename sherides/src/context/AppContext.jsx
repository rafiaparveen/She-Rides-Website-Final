import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AppContext = createContext(null)

const STORAGE_KEY = 'sherides_state_v1'

const DEFAULT_STATE = {
  profile: {
    name: 'Sarah Jamil',
    email: 'sarah.jamil@email.com',
    phone: '+92 300 9988776',
    address: 'Clifton, Karachi',
    verified: true,
  },
  contacts: [
    { id: 'c1', name: 'Ayesha Malik', relation: 'Sister', phone: '+92 300 1234567' },
    { id: 'c2', name: 'Bilal Ahmed', relation: 'Spouse', phone: '+92 321 7654321' },
  ],
  cnic: {
    front: null, // { name, uploadedAt, status }
    back: null,
  },
  rideHistory: [
    {
      id: 'SR-48291',
      date: '2026-08-21T17:12:00',
      pickup: 'Clifton Beach',
      dropoff: 'Saddar Town',
      driver: 'Hira Malik',
      car: 'Toyota Yaris — White',
      fare: 390,
      status: 'Completed',
    },
    {
      id: 'SR-48213',
      date: '2026-08-18T09:40:00',
      pickup: 'Bahadurabad',
      dropoff: 'Jinnah International Airport',
      driver: 'Ayesha Khan',
      car: 'Honda Civic — Black',
      fare: 1120,
      status: 'Completed',
    },
    {
      id: 'SR-48109',
      date: '2026-08-14T19:55:00',
      pickup: 'Gulshan-e-Iqbal',
      dropoff: 'DHA Phase 5',
      driver: 'Sana Tariq',
      car: 'Suzuki Alto — Silver',
      fare: 410,
      status: 'Cancelled',
    },
  ],
  sosLog: [],
  safetySettings: {
    routeMonitoring: true,
    biometricAudit: true,
    phoneMasking: true,
    shareTripWithContacts: true,
  },
  notifications: [
    {
      id: 'n1',
      type: 'info',
      title: 'Ride confirmed',
      message: 'Hira Malik is on the way to your pickup point.',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n2',
      type: 'warning',
      title: 'Safety check',
      message: 'Your trip details are being shared with your emergency contacts.',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
  ],
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const updateProfile = useCallback((updates) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...updates } }))
  }, [])

  const addContact = useCallback((contact) => {
    setState((s) => ({
      ...s,
      contacts: [...s.contacts, { ...contact, id: `c${Date.now()}` }],
    }))
  }, [])

  const updateContact = useCallback((id, updates) => {
    setState((s) => ({
      ...s,
      contacts: s.contacts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }, [])

  const removeContact = useCallback((id) => {
    setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) }))
  }, [])

  const setCnicSide = useCallback((side, fileMeta) => {
    setState((s) => ({ ...s, cnic: { ...s.cnic, [side]: fileMeta } }))
  }, [])

  const addRideToHistory = useCallback((ride) => {
    setState((s) => ({ ...s, rideHistory: [ride, ...s.rideHistory] }))
  }, [])

  const triggerSOS = useCallback(() => {
    const alert = {
      id: `sos-${Date.now()}`,
      triggeredAt: new Date().toISOString(),
      status: 'active',
    }
    setState((s) => ({ ...s, sosLog: [alert, ...s.sosLog] }))
    return alert.id
  }, [])

  const resolveSOS = useCallback((id) => {
    setState((s) => ({
      ...s,
      sosLog: s.sosLog.map((a) => (a.id === id ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a)),
    }))
  }, [])

  const toggleSafetySetting = useCallback((key) => {
    setState((s) => ({
      ...s,
      safetySettings: { ...s.safetySettings, [key]: !s.safetySettings[key] },
    }))
  }, [])

  const addNotification = useCallback((notification) => {
    setState((s) => ({
      ...s,
      notifications: [
        { id: `n${Date.now()}`, read: false, createdAt: new Date().toISOString(), ...notification },
        ...s.notifications,
      ].slice(0, 8),
    }))
  }, [])

  const markNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const value = {
    ...state,
    updateProfile,
    addContact,
    updateContact,
    removeContact,
    setCnicSide,
    addRideToHistory,
    triggerSOS,
    resolveSOS,
    toggleSafetySetting,
    addNotification,
    markNotificationsRead,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
