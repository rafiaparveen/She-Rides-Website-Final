import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { apiRequest, clearSession, getAccessToken, storeSession } from '../lib/api.js'
import { getDemoStateForRole, getDemoUserFromSession, isDemoSessionToken, resolveDemoAuth } from '../lib/demoAuth.js'

const AppContext = createContext(null)

function emptyAccountState() {
  return {
    profile: { name: '', email: '', phone: '', address: '', verified: false },
    contacts: [],
    cnic: { front: null, back: null },
    rideHistory: [],
    sosLog: [],
    safetySettings: {
      routeMonitoring: true,
      biometricAudit: true,
      phoneMasking: true,
      shareTripWithContacts: true,
    },
    notifications: [],
    captainOnline: false,
    captainTrips: [],
    wallet: { balance: 0, ledger: [] },
    captainDeposits: [],
  }
}

function normalizeAccountState(accountState) {
  if (!accountState || typeof accountState !== 'object' || Array.isArray(accountState)) {
    throw new Error('The server returned invalid account data. Please try logging in again.')
  }
  const defaults = emptyAccountState()
  return {
    ...defaults,
    ...accountState,
    profile: { ...defaults.profile, ...(accountState.profile || {}) },
    safetySettings: { ...defaults.safetySettings, ...(accountState.safetySettings || {}) },
    contacts: Array.isArray(accountState.contacts) ? accountState.contacts : [],
    rideHistory: Array.isArray(accountState.rideHistory) ? accountState.rideHistory : [],
    sosLog: Array.isArray(accountState.sosLog) ? accountState.sosLog : [],
    notifications: Array.isArray(accountState.notifications) ? accountState.notifications : [],
    captainTrips: Array.isArray(accountState.captainTrips) ? accountState.captainTrips : [],
    captainDeposits: Array.isArray(accountState.captainDeposits) ? accountState.captainDeposits : [],
    wallet: {
      balance: Number.isFinite(Number(accountState.wallet?.balance)) ? Number(accountState.wallet.balance) : 0,
      ledger: Array.isArray(accountState.wallet?.ledger) ? accountState.wallet.ledger : [],
    },
  }
}

function clearLegacySharedData() {
  localStorage.removeItem('sherides_state_v1')
  localStorage.removeItem('sherides_demo_account_v1')
  localStorage.removeItem('sherides_demo_session_v1')
}

export function AppProvider({ children }) {
  const [state, setState] = useState(emptyAccountState)
  const [authUser, setAuthUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isAccountReady, setIsAccountReady] = useState(false)
  const [apiError, setApiError] = useState('')
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    clearLegacySharedData()
    clearSession()
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setIsInitializing(false)
      return undefined
    }

    if (isDemoSessionToken(token)) {
      const demoUser = getDemoUserFromSession()
      if (demoUser) {
        const demoState = getDemoStateForRole(demoUser.role)
        setAuthUser(demoUser)
        setState(normalizeAccountState(demoState || {}))
        setIsAccountReady(true)
        setApiError('')
        setIsInitializing(false)
        return undefined
      }
    }

    let active = true
    Promise.all([
      apiRequest('/auth/me', { token }),
      apiRequest('/account/state', { token }),
    ])
      .then(([session, accountState]) => {
        if (!active) return
        storeSession(token, session.user)
        setAuthUser(session.user)
        setState(normalizeAccountState(accountState))
        setIsAccountReady(true)
        setApiError('')
      })
      .catch((error) => {
        if (!active) return
        if (error.status === 401) clearSession()
        setAuthUser(null)
        setState(emptyAccountState())
        setIsAccountReady(false)
        setApiError(error.message)
      })
      .finally(() => {
        if (active) setIsInitializing(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!authUser || !isAccountReady) return undefined
    const token = getAccessToken()
    if (!token || isDemoSessionToken(token)) {
      setApiError('')
      return undefined
    }

    const timer = setTimeout(() => {
      const snapshot = state
      const saveState = () => apiRequest('/account/state', { method: 'PUT', body: snapshot, token })
      saveQueue.current = saveQueue.current
        .then(saveState, saveState)
        .then(() => {
          setApiError('')
        })
        .catch((error) => {
          setApiError(error.message)
          if (error.status === 401 && getAccessToken() === token) {
            clearSession()
            setAuthUser(null)
            setIsAccountReady(false)
          }
        })
    }, 350)
    return () => clearTimeout(timer)
  }, [authUser, isAccountReady, state])

  const authenticate = useCallback(async (path, credentials) => {
    setApiError('')

    const { token, user } = await apiRequest(path, {
      method: 'POST',
      body: credentials,
      token: null,
    })
    if (typeof token !== 'string' || !user?.id || !user?.name || !user?.email) {
      throw new Error('The server returned an invalid sign-in response.')
    }

    storeSession(token, user)
    setIsInitializing(true)
    try {
      const accountState = await apiRequest('/account/state', { token })
      setState(normalizeAccountState(accountState))
      setAuthUser(user)
      setIsAccountReady(true)
      setApiError('')
    } catch (error) {
      clearSession()
      setAuthUser(null)
      setIsAccountReady(false)
      throw error
    } finally {
      setIsInitializing(false)
    }
  }, [])

  const signUp = useCallback((credentials) => authenticate('/auth/signup', credentials), [authenticate])
  const login = useCallback(({ email, password, role }) => authenticate('/auth/login', { email, password, role }), [authenticate])

  const logout = useCallback(() => {
    clearSession()
    setAuthUser(null)
    setState(emptyAccountState())
    setIsAccountReady(false)
    setApiError('')
  }, [])

  const updateProfile = useCallback((updates) => {
    setState((current) => ({
      ...current,
      profile: { ...current.profile, ...updates, email: current.profile.email },
    }))
    setAuthUser((user) => user ? { ...user, name: updates.name?.trim() || user.name } : user)
  }, [])

  const addContact = useCallback((contact) => {
    setState((current) => ({
      ...current,
      contacts: [...current.contacts, { ...contact, id: crypto.randomUUID() }],
    }))
  }, [])

  const updateContact = useCallback((id, updates) => {
    setState((current) => ({
      ...current,
      contacts: current.contacts.map((contact) => (contact.id === id ? { ...contact, ...updates } : contact)),
    }))
  }, [])

  const removeContact = useCallback((id) => {
    setState((current) => ({ ...current, contacts: current.contacts.filter((contact) => contact.id !== id) }))
  }, [])

  const setCnicSide = useCallback((side, fileMeta) => {
    setState((current) => ({ ...current, cnic: { ...current.cnic, [side]: fileMeta } }))
  }, [])

  const addRideToHistory = useCallback((ride) => {
    setState((current) => ({ ...current, rideHistory: [ride, ...current.rideHistory] }))
  }, [])

  const triggerSOS = useCallback(() => {
    const alert = {
      id: `sos-${crypto.randomUUID()}`,
      triggeredAt: new Date().toISOString(),
      status: 'active',
    }
    setState((current) => ({ ...current, sosLog: [alert, ...current.sosLog] }))
    return alert.id
  }, [])

  const resolveSOS = useCallback((id) => {
    setState((current) => ({
      ...current,
      sosLog: current.sosLog.map((alert) => (
        alert.id === id ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() } : alert
      )),
    }))
  }, [])

  const toggleSafetySetting = useCallback((key) => {
    setState((current) => ({
      ...current,
      safetySettings: { ...current.safetySettings, [key]: !current.safetySettings[key] },
    }))
  }, [])

  const addNotification = useCallback((notification) => {
    setState((current) => ({
      ...current,
      notifications: [
        { id: `n${crypto.randomUUID()}`, read: false, createdAt: new Date().toISOString(), ...notification },
        ...current.notifications,
      ].slice(0, 8),
    }))
  }, [])

  const markNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
    }))
  }, [])

  const setCaptainOnline = useCallback((online) => {
    setState((current) => ({ ...current, captainOnline: Boolean(online) }))
  }, [])

  const addCaptainTrip = useCallback((trip) => {
    setState((current) => ({ ...current, captainTrips: [trip, ...current.captainTrips] }))
  }, [])

  const updateCaptainTrip = useCallback((id, status) => {
    setState((current) => ({
      ...current,
      captainTrips: current.captainTrips.map((trip) => (
        trip.id === id ? { ...trip, status } : trip
      )),
    }))
  }, [])

  const topUpWallet = useCallback(async (provider, amount) => {
    const token = getAccessToken()
    if (isDemoSessionToken(token)) {
      const normalizedAmount = Number(amount)
      const payload = {
        balance: Number(state.wallet?.balance || 0) + normalizedAmount,
        ledger: [
          {
            id: `demo-wallet-${crypto.randomUUID()}`,
            type: 'top_up',
            provider,
            amount: normalizedAmount,
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
          ...((state.wallet?.ledger || []).slice(0, 19)),
        ],
      }
      setState((current) => ({ ...current, wallet: payload }))
      return payload
    }

    const response = await apiRequest('/wallet/top-ups', {
      method: 'POST',
      body: { provider, amount },
      token,
    })
    if (getAccessToken() === token) setState((current) => ({ ...current, wallet: response.wallet }))
    return response.wallet
  }, [state.wallet])

  const debitWalletForRide = useCallback(async (rideId, amount) => {
    const token = getAccessToken()
    if (isDemoSessionToken(token)) {
      const normalizedAmount = Number(amount)
      const payload = {
        balance: Math.max(0, Number(state.wallet?.balance || 0) - normalizedAmount),
        ledger: [
          {
            id: `demo-ride-debit-${crypto.randomUUID()}`,
            type: 'ride_debit',
            provider: null,
            amount: normalizedAmount,
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
          ...((state.wallet?.ledger || []).slice(0, 19)),
        ],
      }
      setState((current) => ({ ...current, wallet: payload }))
      return payload
    }

    const response = await apiRequest(`/wallet/rides/${encodeURIComponent(rideId)}/debit`, {
      method: 'POST',
      body: { amount },
      token,
    })
    if (getAccessToken() === token) setState((current) => ({ ...current, wallet: response.wallet }))
    return response.wallet
  }, [state.wallet])

  const refundWalletForRide = useCallback(async (rideId) => {
    const token = getAccessToken()
    if (isDemoSessionToken(token)) {
      const normalizedAmount = Number(state.wallet?.balance || 0) * 0.5
      const payload = {
        balance: Number(state.wallet?.balance || 0) + normalizedAmount,
        ledger: [
          {
            id: `demo-ride-refund-${crypto.randomUUID()}`,
            type: 'ride_refund',
            provider: null,
            amount: normalizedAmount,
            status: 'refunded',
            createdAt: new Date().toISOString(),
          },
          ...((state.wallet?.ledger || []).slice(0, 19)),
        ],
      }
      setState((current) => ({ ...current, wallet: payload }))
      return payload
    }

    const response = await apiRequest(`/wallet/rides/${encodeURIComponent(rideId)}/refund`, {
      method: 'POST',
      token,
    })
    if (getAccessToken() === token) setState((current) => ({ ...current, wallet: response.wallet }))
    return response.wallet
  }, [state.wallet])

  const recordCaptainDeposit = useCallback(async (provider, amount) => {
    const token = getAccessToken()
    if (isDemoSessionToken(token)) {
      const deposit = {
        id: `demo-deposit-${crypto.randomUUID()}`,
        type: 'platform_deposit',
        provider,
        amount,
        status: 'demo_recorded',
        createdAt: new Date().toISOString(),
      }
      setState((current) => ({ ...current, captainDeposits: [deposit, ...(current.captainDeposits || [])] }))
      return [deposit, ...(state.captainDeposits || [])]
    }

    const response = await apiRequest('/captain/deposits', {
      method: 'POST',
      body: { provider, amount },
      token,
    })
    if (getAccessToken() === token) setState((current) => ({ ...current, captainDeposits: response.deposits }))
    return response.deposits
  }, [state.captainDeposits])

  const value = {
    ...state,
    authUser,
    isInitializing,
    apiError,
    signUp,
    login,
    logout,
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
    setCaptainOnline,
    addCaptainTrip,
    updateCaptainTrip,
    topUpWallet,
    debitWalletForRide,
    refundWalletForRide,
    recordCaptainDeposit,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
