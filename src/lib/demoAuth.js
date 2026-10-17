export const DEMO_ACCOUNTS = {
  rider: {
    email: 'rider.demo@sherides.local',
    password: 'SheRidesDemo2026!',
    user: {
      id: 'demo-rider-user',
      name: 'Demo Passenger',
      email: 'rider.demo@sherides.local',
      role: 'rider',
      isDemo: true,
    },
    state: {
      profile: {
        name: 'Demo Passenger',
        email: 'rider.demo@sherides.local',
        phone: '0300-0000000',
        address: 'Clifton, Karachi',
        verified: true,
      },
      contacts: [
        { id: 'demo-contact-1', name: 'Ayesha', relation: 'Sister', phone: '0301-2345678' },
      ],
      rideHistory: [
        {
          id: 'demo-ride-1',
          date: new Date(Date.now() - 86400000).toISOString(),
          pickup: 'Clifton Block 5',
          dropoff: 'Dolmen Mall Clifton',
          driver: 'Demo Captain',
          car: 'Scooty',
          fare: 850,
          status: 'Completed',
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
          id: 'demo-notice-1',
          type: 'info',
          title: 'Demo session ready',
          message: 'You are logged in with a demo passenger account. No real trip or payment is processed.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      captainOnline: false,
      captainTrips: [],
      wallet: {
        balance: 2500,
        ledger: [
          {
            id: 'demo-wallet-topup-1',
            type: 'top_up',
            provider: 'easypaisa',
            amount: 2500,
            status: 'completed',
            createdAt: new Date().toISOString(),
          },
        ],
      },
      captainDeposits: [],
    },
  },
  captain: {
    email: 'captain.demo@sherides.local',
    password: 'CaptainDemo2026!',
    user: {
      id: 'demo-captain-user',
      name: 'Demo Captain',
      email: 'captain.demo@sherides.local',
      role: 'captain',
      isDemo: true,
      captainApplication: {
        status: 'approved',
        phone: '03000000000',
        vehicleType: 'motorbike',
        vehicleMake: 'Demo',
        vehicleModel: 'Scooty',
        vehicleYear: new Date().getFullYear(),
        registrationNumber: 'DEMO-001',
        registeredOwnerName: 'Demo Captain',
        ownerIsCaptain: true,
        submittedAt: new Date().toISOString(),
      },
    },
    state: {
      profile: {
        name: 'Demo Captain',
        email: 'captain.demo@sherides.local',
        phone: '0300-0000000',
        address: 'Gulshan, Karachi',
        verified: true,
      },
      contacts: [
        { id: 'demo-contact-2', name: 'Areeba', relation: 'Operations manager', phone: '0302-7654321' },
      ],
      rideHistory: [],
      sosLog: [],
      safetySettings: {
        routeMonitoring: true,
        biometricAudit: true,
        phoneMasking: true,
        shareTripWithContacts: true,
      },
      notifications: [
        {
          id: 'demo-notice-2',
          type: 'info',
          title: 'Demo captain account',
          message: 'This account is usable for demo passenger requests and captain earnings only.',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      captainOnline: false,
      captainTrips: [
        {
          id: 'demo-trip-1',
          rider: 'Demo Passenger A',
          pickup: 'Clifton Block 5',
          dropoff: 'Dolmen Mall Clifton',
          fare: 650,
          status: 'completed',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
      wallet: {
        balance: 0,
        ledger: [],
      },
      captainDeposits: [],
    },
  },
}

export function isDemoSessionToken(token) {
  return typeof token === 'string' && token.startsWith('demo-')
}

export function resolveDemoAuth({ email, password, role }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'rider'
  const candidate = DEMO_ACCOUNTS[normalizedRole]

  if (!candidate) return null
  if (normalizedEmail !== candidate.email) return null
  if (typeof password !== 'string' || password !== candidate.password) return null

  return {
    token: `demo-${normalizedRole}-session`,
    user: { ...candidate.user },
    state: JSON.parse(JSON.stringify(candidate.state)),
  }
}

export function getDemoUserFromSession() {
  try {
    const rawUser = sessionStorage.getItem('sherides_api_user')
    if (!rawUser) return null
    const user = JSON.parse(rawUser)
    return user && user.isDemo ? user : null
  } catch {
    return null
  }
}

export function getDemoStateForRole(role) {
  const candidate = DEMO_ACCOUNTS[role]
  if (!candidate) return null
  return JSON.parse(JSON.stringify(candidate.state))
}
