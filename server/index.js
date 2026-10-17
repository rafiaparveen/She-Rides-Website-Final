import 'dotenv/config'
import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { rateLimit } from 'express-rate-limit'
import User from './models/User.js'
import CaptainDocument from './models/CaptainDocument.js'
import RideRequest from './models/RideRequest.js'

const app = express()
const port = Number(process.env.PORT || 3000)
const jwtSecret = process.env.JWT_SECRET
const documentEncryptionKey = Buffer.from(process.env.DOCUMENT_ENCRYPTION_KEY || '', 'base64')
const allowedOrigins = (process.env.APP_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured in the server environment.')
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters.')
}
if (documentEncryptionKey.length !== 32) {
  throw new Error('DOCUMENT_ENCRYPTION_KEY must be a base64-encoded 32-byte secret.')
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('This website origin is not allowed by the API.'))
  },
}))
app.use(express.json({ limit: '32mb' }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please try again in 15 minutes.' },
})

class CaptainDocumentError extends Error {}

function issueToken(userId) {
  return jwt.sign({}, jwtSecret, { subject: userId.toString(), expiresIn: '1h', jwtid: crypto.randomUUID() })
}

function userPayload(user) {
  return {
    id: user.id,
    name: user.profile.name,
    email: user.email,
    role: user.role,
    isDemo: user.isDemo,
    captainApplication: user.captainApplication || null,
  }
}

function accountState(user) {
  return {
    profile: user.profile,
    contacts: user.contacts,
    cnic: user.cnic,
    rideHistory: user.rideHistory,
    sosLog: user.sosLog,
    safetySettings: user.safetySettings,
    notifications: user.notifications,
    captainOnline: user.captainOnline,
    captainTrips: user.captainTrips,
    wallet: walletPayload(user),
    captainDeposits: user.captainDepositLedger || [],
  }
}

function walletPayload(user) {
  return {
    balance: user.walletBalance || 0,
    ledger: (user.walletLedger || []).slice(-30).reverse(),
  }
}

function validEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validCnicSide(side) {
  if (side === null) return true
  if (!side || typeof side !== 'object' || Array.isArray(side)) return false
  if (Object.keys(side).some((key) => !['name', 'status', 'uploadedAt'].includes(key))) return false
  return typeof side.name === 'string'
    && side.name.length <= 255
    && ['uploading', 'pending', 'verified'].includes(side.status)
    && typeof side.uploadedAt === 'string'
    && side.uploadedAt.length <= 50
}

function validAvatar(value) {
  if (value === '') return true
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > 720_000) return false
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match) return false
  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length > 512 * 1024) return false
  if (match[1] === 'png') {
    return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  if (match[1] === 'jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP'
}

const captainDocumentKinds = [
  'cnicFront',
  'cnicBack',
  'licenseFront',
  'registrationFront',
  'registrationBack',
  'ownerAuthorization',
]
const requiredCaptainDocumentKinds = captainDocumentKinds.slice(0, 5)
const allowedDocumentMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']
const maxCaptainDocumentBytes = 3 * 1024 * 1024

function encryptDocument(document) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new CaptainDocumentError('A required captain document is missing.')
  }
  if (!allowedDocumentMimeTypes.includes(document.type)) {
    throw new CaptainDocumentError('Captain documents must be JPG, PNG, or PDF files.')
  }
  if (typeof document.name !== 'string' || !document.name.trim() || document.name.length > 255) {
    throw new CaptainDocumentError('A captain document has an invalid filename.')
  }
  if (typeof document.data !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(document.data)) {
    throw new CaptainDocumentError('A captain document could not be read.')
  }
  const content = Buffer.from(document.data, 'base64')
  if (!content.length || content.length > maxCaptainDocumentBytes) {
    throw new CaptainDocumentError('Each captain document must be smaller than 3 MB.')
  }
  const validSignature = document.type === 'image/jpeg'
    ? content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff
    : document.type === 'image/png'
      ? content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : content.subarray(0, 5).toString('ascii') === '%PDF-'
  if (!validSignature) {
    throw new CaptainDocumentError(`${document.name} does not match its file type.`)
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', documentEncryptionKey, iv)
  const encryptedData = Buffer.concat([cipher.update(content), cipher.final()])
  return {
    originalName: document.name.trim(),
    mimeType: document.type,
    iv,
    authTag: cipher.getAuthTag(),
    encryptedData,
  }
}

function validateCaptainApplication(application, documents, captainName) {
  if (!application || typeof application !== 'object' || Array.isArray(application)) {
    return 'Complete the captain and vehicle details.'
  }
  const {
    phone,
    vehicleType,
    vehicleMake,
    vehicleModel,
    vehicleYear,
    registrationNumber,
    registeredOwnerName,
    ownerIsCaptain,
  } = application
  if (
    typeof phone !== 'string' || phone.trim().length < 7 || phone.trim().length > 40
    || !['motorbike', 'car'].includes(vehicleType)
    || typeof vehicleMake !== 'string' || !vehicleMake.trim() || vehicleMake.trim().length > 80
    || typeof vehicleModel !== 'string' || !vehicleModel.trim() || vehicleModel.trim().length > 80
    || !Number.isInteger(Number(vehicleYear)) || Number(vehicleYear) < 1980 || Number(vehicleYear) > new Date().getFullYear() + 1
    || typeof registrationNumber !== 'string' || !registrationNumber.trim() || registrationNumber.trim().length > 30
    || typeof registeredOwnerName !== 'string' || !registeredOwnerName.trim() || registeredOwnerName.trim().length > 100
    || typeof ownerIsCaptain !== 'boolean'
  ) {
    return 'Enter valid phone, vehicle, year, and registered-owner details.'
  }
  if (ownerIsCaptain && registeredOwnerName.trim().toLowerCase() !== captainName.trim().toLowerCase()) {
    return 'The registered owner name must match the captain name.'
  }
  if (!ownerIsCaptain && !documents?.ownerAuthorization) {
    return 'Upload written owner authorization when the vehicle is not in your name.'
  }
  if (!documents || typeof documents !== 'object' || Array.isArray(documents)) {
    return 'Upload all required captain documents.'
  }
  if (Object.keys(documents).some((kind) => !captainDocumentKinds.includes(kind))) {
    return 'An unsupported document type was included.'
  }
  if (requiredCaptainDocumentKinds.some((kind) => !documents[kind])) {
    return 'Upload CNIC front and back, driving license, and both vehicle registration pages.'
  }
  return null
}

app.post('/api/auth/signup', authLimiter, async (req, res, next) => {
  try {
    const { name, email, password, role = 'rider', captainApplication, documents } = req.body || {}
    const cleanName = typeof name === 'string' ? name.trim() : ''
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: 'Name must be between 2 and 80 characters.' })
    }
    if (!validEmail(normalizedEmail)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ error: 'Password must be at least 10 characters and no more than 72 bytes.' })
    }
    if (!['rider', 'captain'].includes(role)) {
      return res.status(400).json({ error: 'Choose a rider or captain account.' })
    }
    if (role === 'captain') {
      const validationError = validateCaptainApplication(captainApplication, documents, cleanName)
      if (validationError) return res.status(400).json({ error: validationError })
    }
    const encryptedDocuments = role === 'captain'
      ? Object.entries(documents).map(([kind, document]) => ({
        kind,
        ...encryptDocument(document),
      }))
      : []

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      role,
      profile: { name: cleanName, email: normalizedEmail },
      ...(role === 'captain' ? {
        captainApplication: {
          status: 'pending_review',
          ...captainApplication,
          phone: captainApplication.phone.trim(),
          vehicleMake: captainApplication.vehicleMake.trim(),
          vehicleModel: captainApplication.vehicleModel.trim(),
          vehicleYear: Number(captainApplication.vehicleYear),
          registrationNumber: captainApplication.registrationNumber.trim(),
          registeredOwnerName: captainApplication.registeredOwnerName.trim(),
          submittedAt: new Date(),
        },
      } : {}),
    })
    if (role === 'captain') {
      try {
        await CaptainDocument.insertMany(encryptedDocuments.map((document) => ({
          userId: user._id,
          ...document,
        })))
      } catch (error) {
        await CaptainDocument.deleteMany({ userId: user._id })
        await User.deleteOne({ _id: user._id })
        throw error
      }
    }
    return res.status(201).json({ token: issueToken(user.id), user: userPayload(user) })
  } catch (error) {
    if (error instanceof CaptainDocumentError) {
      return res.status(400).json({ error: error.message })
    }
    if (error?.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' })
    return next(error)
  }
})

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password, role } = req.body || {}
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!validEmail(normalizedEmail) || typeof password !== 'string' || (role && !['rider', 'captain'].includes(role))) {
      return res.status(400).json({ error: 'Enter a valid email and password.' })
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' })
    }
    if (role && user.role !== role) {
      return res.status(403).json({ error: `This account is registered as a ${user.role}. Choose the matching account type.` })
    }
    return res.json({ token: issueToken(user.id), user: userPayload(user) })
  } catch (error) {
    return next(error)
  }
})

function requireAuth(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ')
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Please log in to continue.' })

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Your session is invalid. Please log in again.' })
    }
    req.userId = payload.sub
    return next()
  } catch {
    return res.status(401).json({ error: 'Your session expired. Please log in again.' })
  }
}

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    return res.json({ user: userPayload(user) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/account/state', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    return res.json(accountState(user))
  } catch (error) {
    return next(error)
  }
})

function rideRequestPayload(ride, captain = null) {
  const location = captain?.captainLocation?.toObject?.() || captain?.captainLocation || null
  const locationAge = location ? Date.now() - Date.parse(location.updatedAt) : Infinity
  const locationIsFresh = location && Number.isFinite(locationAge) && locationAge >= -60000 && locationAge <= 60000
  return {
    id: ride.id,
    riderId: ride.riderId.toString(),
    captainId: ride.captainId?.toString() || null,
    pickup: ride.pickup,
    dropoff: ride.dropoff,
    fare: ride.fare,
    tier: ride.tier,
    status: ride.status,
    createdAt: ride.createdAt,
    captain: captain ? {
      name: captain.profile.name,
      image: '',
      available: captain.captainOnline,
      onTrip: captain.captainOnTrip,
      location: locationIsFresh ? location : null,
    } : null,
  }
}

function validPlace(place) {
  return place && typeof place === 'object' && !Array.isArray(place)
    && typeof place.name === 'string' && place.name.trim().length > 0 && place.name.length <= 200
    && Number.isFinite(place.lat) && place.lat >= -90 && place.lat <= 90
    && Number.isFinite(place.lng) && place.lng >= -180 && place.lng <= 180
}

app.post('/api/rides', requireAuth, async (req, res, next) => {
  try {
    const rider = await User.findById(req.userId).select('role')
    if (!rider) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (rider.role !== 'rider') return res.status(403).json({ error: 'Only rider accounts can request rides.' })
    const { pickup, dropoff, fare, tier } = req.body || {}
    if (!validPlace(pickup) || !validPlace(dropoff) || pickup.name === dropoff.name
      || !Number.isInteger(fare) || fare < 1 || fare > 100000
      || typeof tier !== 'string' || !tier.trim() || tier.length > 40) {
      return res.status(400).json({ error: 'Ride request details are invalid.' })
    }
    const ride = await RideRequest.create({
      riderId: req.userId,
      pickup: { ...pickup, name: pickup.name.trim() },
      dropoff: { ...dropoff, name: dropoff.name.trim() },
      fare,
      tier: tier.trim(),
    })
    return res.status(201).json({ ride: rideRequestPayload(ride) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/captains/ride-requests', requireAuth, async (req, res, next) => {
  try {
    const captain = await User.findById(req.userId).select('role captainApplication')
    if (!captain) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (captain.role !== 'captain' || captain.captainApplication?.status !== 'approved') {
      return res.status(403).json({ error: 'Only approved captains can view ride requests.' })
    }
    const rides = await RideRequest.find({
      $or: [
        { status: 'pending', captainId: null },
        { captainId: req.userId, status: { $in: ['accepted', 'in_progress'] } },
      ],
    }).sort({ createdAt: 1 }).limit(100)
    return res.json({ rides: rides.map((ride) => rideRequestPayload(ride)) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/captains/ride-requests/:id/accept', requireAuth, async (req, res, next) => {
  try {
    const captain = await User.findById(req.userId).select('role captainApplication')
    if (!captain) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (captain.role !== 'captain' || captain.captainApplication?.status !== 'approved') {
      return res.status(403).json({ error: 'Only approved captains can accept ride requests.' })
    }
    const ride = await RideRequest.findOneAndUpdate(
      { _id: req.params.id, status: 'pending', captainId: null },
      { $set: { captainId: req.userId, status: 'accepted' } },
      { new: true },
    )
    if (!ride) return res.status(409).json({ error: 'This ride was already accepted or is no longer available.' })
    const rider = await User.findById(ride.riderId).select('profile.name')
    return res.json({ ride: rideRequestPayload(ride, null), rider: rider?.profile.name || 'Rider' })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/rides/:id', requireAuth, async (req, res, next) => {
  try {
    const ride = await RideRequest.findById(req.params.id)
    if (!ride) return res.status(404).json({ error: 'Ride request not found.' })
    const isRider = ride.riderId.toString() === req.userId
    const isAssignedCaptain = ride.captainId?.toString() === req.userId
    if (!isRider && !isAssignedCaptain) return res.status(403).json({ error: 'This ride request does not belong to your account.' })
    const captain = ride.captainId ? await User.findById(ride.captainId).select('profile.name captainOnline captainOnTrip captainLocation') : null
    return res.json({ ride: rideRequestPayload(ride, captain) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/rides/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const ride = await RideRequest.findOneAndUpdate(
      { _id: req.params.id, riderId: req.userId, status: { $in: ['pending', 'accepted'] } },
      { $set: { status: 'cancelled' } },
      { new: true },
    )
    if (!ride) return res.status(409).json({ error: 'This ride can no longer be cancelled.' })
    return res.json({ ride: rideRequestPayload(ride) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/captains/ride-requests/:id/status', requireAuth, async (req, res, next) => {
  try {
    const status = req.body?.status
    if (!['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Ride status is invalid.' })
    }
    const expectedStatus = status === 'in_progress' ? 'accepted' : 'in_progress'
    const ride = await RideRequest.findOneAndUpdate(
      { _id: req.params.id, captainId: req.userId, status: expectedStatus },
      { $set: { status } },
      { new: true },
    )
    if (!ride) return res.status(409).json({ error: 'This ride status can no longer be changed.' })
    if (status === 'completed') {
      await User.updateOne({ _id: req.userId }, { $set: { captainOnline: true, captainOnTrip: false } })
    }
    return res.json({ ride: rideRequestPayload(ride) })
  } catch (error) {
    return next(error)
  }
})

app.get('/api/captains/presence', requireAuth, async (req, res, next) => {
  try {
    const viewer = await User.findById(req.userId).select('role')
    if (!viewer) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (viewer.role !== 'rider') return res.status(403).json({ error: 'Captain presence is only available to rider accounts.' })

    const captains = await User.find({ role: 'captain', 'captainApplication.status': 'approved' })
      .select('profile.name captainOnline captainOnTrip captainLocation')
      .sort({ captainOnline: -1, updatedAt: -1 })
      .limit(100)
    const now = Date.now()
    return res.json({
      captains: captains.map((captain) => {
        const location = captain.captainLocation?.toObject?.() || captain.captainLocation
        const locationAge = location ? now - Date.parse(location.updatedAt) : Infinity
        const hasFreshLocation = location && Number.isFinite(locationAge)
          && locationAge >= -60000 && locationAge <= 60000
        const onTrip = captain.captainOnTrip && Boolean(hasFreshLocation)
        const available = captain.captainOnline && (!location || Boolean(hasFreshLocation))
        return {
          id: captain.id,
          name: captain.profile.name,
          image: '',
          available,
          onTrip,
          location: hasFreshLocation && (available || onTrip) ? location : null,
          updatedAt: hasFreshLocation ? location.updatedAt : null,
        }
      }),
    })
  } catch (error) {
    return next(error)
  }
})

app.put('/api/captains/presence', requireAuth, async (req, res, next) => {
  try {
    const { online, onTrip, location } = req.body || {}
    if (typeof online !== 'boolean' || typeof onTrip !== 'boolean') {
      return res.status(400).json({ error: 'Captain availability data is invalid.' })
    }
    if (location !== null && location !== undefined && (
      !location || typeof location !== 'object' || Array.isArray(location)
      || !Number.isFinite(location.lat) || location.lat < -90 || location.lat > 90
      || !Number.isFinite(location.lng) || location.lng < -180 || location.lng > 180
      || (location.accuracy !== undefined && (!Number.isFinite(location.accuracy) || location.accuracy < 0 || location.accuracy > 100000))
      || typeof location.updatedAt !== 'string' || !Number.isFinite(Date.parse(location.updatedAt))
      || Date.parse(location.updatedAt) > Date.now() + 60000
      || location.updatedAt.length > 50
    )) {
      return res.status(400).json({ error: 'Captain location data is invalid.' })
    }

    const captain = await User.findById(req.userId)
    if (!captain) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (captain.role !== 'captain' || captain.captainApplication?.status !== 'approved') {
      return res.status(403).json({ error: 'Only approved captains can share their availability.' })
    }
    captain.captainOnline = online
    captain.captainOnTrip = onTrip
    captain.captainLocation = online || onTrip ? location || null : null
    await captain.save()
    return res.json({ status: 'updated' })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/wallet/top-ups', requireAuth, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Wallet top-ups are demo-only until a payment provider is configured.' })
    }
    const amount = Number(req.body?.amount)
    const provider = req.body?.provider
    if (!Number.isInteger(amount) || amount < 300 || amount > 100000) {
      return res.status(400).json({ error: 'Top up at least Rs 300 and no more than Rs 100,000.' })
    }
    if (!['bank', 'easypaisa', 'jazzcash'].includes(provider)) {
      return res.status(400).json({ error: 'Choose bank transfer, Easypaisa, or JazzCash.' })
    }
    const user = await User.findOneAndUpdate(
      { _id: req.userId, role: { $in: ['rider', 'captain'] } },
      {
        $inc: { walletBalance: amount },
        $push: {
          walletLedger: {
            $each: [{
              id: crypto.randomUUID(),
              type: 'top_up',
              provider,
              amount,
              status: 'completed',
              createdAt: new Date().toISOString(),
            }],
            $slice: -500,
          },
        },
      },
      { new: true, runValidators: true },
    )
    if (!user) return res.status(403).json({ error: 'Wallet top-ups are only available to rider or captain accounts.' })
    return res.json({ wallet: walletPayload(user), demo: true })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/captain/deposits', requireAuth, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Captain deposits are demo-only until a payment provider is configured.' })
    }
    const amount = Number(req.body?.amount)
    const provider = req.body?.provider
    if (!Number.isInteger(amount) || amount < 500 || amount > 100000) {
      return res.status(400).json({ error: 'Enter a demo deposit from Rs 500 to Rs 100,000.' })
    }
    if (!['bank', 'easypaisa', 'jazzcash'].includes(provider)) {
      return res.status(400).json({ error: 'Choose bank transfer, Easypaisa, or JazzCash.' })
    }
    const user = await User.findOneAndUpdate(
      { _id: req.userId, role: 'captain' },
      {
        $push: {
          captainDepositLedger: {
            $each: [{
              id: crypto.randomUUID(),
              type: 'platform_deposit',
              provider,
              amount,
              status: 'demo_recorded',
              createdAt: new Date().toISOString(),
            }],
            $slice: -500,
          },
        },
      },
      { returnDocument: 'after', runValidators: true },
    )
    if (!user) return res.status(403).json({ error: 'Platform deposits are only available to captain accounts.' })
    return res.json({ deposits: user.captainDepositLedger, demo: true })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/wallet/rides/:rideId/debit', requireAuth, async (req, res, next) => {
  try {
    const rideId = req.params.rideId
    const amount = Number(req.body?.amount)
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(rideId) || !Number.isInteger(amount) || amount < 1 || amount > 100000) {
      return res.status(400).json({ error: 'Ride or fare details are invalid.' })
    }
    const user = await User.findOneAndUpdate(
      {
        _id: req.userId,
        role: 'rider',
        walletBalance: { $gte: Math.max(500, amount) },
        walletLedger: { $not: { $elemMatch: { type: 'ride_debit', rideId } } },
      },
      {
        $inc: { walletBalance: -amount },
        $push: {
          walletLedger: {
            $each: [{
              id: crypto.randomUUID(),
              type: 'ride_debit',
              amount,
              rideId,
              status: 'completed',
              createdAt: new Date().toISOString(),
            }],
            $slice: -500,
          },
        },
      },
      { new: true, runValidators: true },
    )
    if (!user) {
      const current = await User.findById(req.userId).select('role walletBalance walletLedger')
      if (!current || current.role !== 'rider') {
        return res.status(403).json({ error: 'Wallet rides are only available to rider accounts.' })
      }
      if (current.walletLedger.some((entry) => entry.type === 'ride_debit' && entry.rideId === rideId)) {
        return res.status(409).json({ error: 'This ride was already charged to your wallet.' })
      }
      if (current.walletBalance < Math.max(500, amount)) {
        return res.status(402).json({ error: `Add funds so your wallet has at least Rs ${Math.max(500, amount)} before requesting this ride.` })
      }
      return res.status(409).json({ error: 'This ride was already charged to your wallet.' })
    }
    return res.json({ wallet: walletPayload(user) })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/wallet/rides/:rideId/refund', requireAuth, async (req, res, next) => {
  try {
    const rideId = req.params.rideId
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(rideId)) {
      return res.status(400).json({ error: 'Ride reference is invalid.' })
    }
    const user = await User.findOne({ _id: req.userId, role: 'rider' })
    if (!user) return res.status(403).json({ error: 'Ride refunds are only available to rider accounts.' })
    const debit = user.walletLedger.find((entry) => entry.type === 'ride_debit' && entry.rideId === rideId)
    if (!debit) return res.status(404).json({ error: 'No wallet charge was found for this ride.' })
    if (debit.status === 'refunded') return res.json({ wallet: walletPayload(user) })

    const updated = await User.findOneAndUpdate(
      {
        _id: req.userId,
        role: 'rider',
        walletLedger: { $elemMatch: { type: 'ride_debit', rideId, status: 'completed' } },
      },
      [{
        $set: {
          walletBalance: { $add: [{ $ifNull: ['$walletBalance', 0] }, debit.amount] },
          walletLedger: {
            $slice: [{
              $concatArrays: [
                {
                  $map: {
                    input: { $ifNull: ['$walletLedger', []] },
                    as: 'entry',
                    in: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$$entry.type', 'ride_debit'] },
                            { $eq: ['$$entry.rideId', rideId] },
                            { $eq: ['$$entry.status', 'completed'] },
                          ],
                        },
                        { $mergeObjects: ['$$entry', { status: 'refunded' }] },
                        '$$entry',
                      ],
                    },
                  },
                },
                [{
                  id: crypto.randomUUID(),
                  type: 'ride_refund',
                  amount: debit.amount,
                  rideId,
                  status: 'completed',
                  createdAt: new Date().toISOString(),
                }],
              ],
            }, -500],
          },
        },
      }],
      { returnDocument: 'after', updatePipeline: true },
    )
    if (!updated) return res.status(409).json({ error: 'This ride refund was already processed.' })
    return res.json({ wallet: walletPayload(updated) })
  } catch (error) {
    return next(error)
  }
})

app.put('/api/account/state', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {}
    if (
      !body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)
      || !Array.isArray(body.contacts)
      || !body.cnic || typeof body.cnic !== 'object' || Array.isArray(body.cnic)
      || Object.keys(body.cnic).some((side) => !['front', 'back'].includes(side))
      || !validCnicSide(body.cnic.front ?? null)
      || !validCnicSide(body.cnic.back ?? null)
      || !Array.isArray(body.rideHistory)
      || !Array.isArray(body.sosLog)
      || !body.safetySettings || typeof body.safetySettings !== 'object' || Array.isArray(body.safetySettings)
      || !Array.isArray(body.notifications)
      || typeof body.captainOnline !== 'boolean'
      || !Array.isArray(body.captainTrips)
      || (body.profile.avatar !== undefined && !validAvatar(body.profile.avatar))
    ) {
      return res.status(400).json({ error: 'Account data is incomplete or invalid.' })
    }
    if ([body.contacts, body.rideHistory, body.sosLog, body.notifications, body.captainTrips].some((items) => items.length > 500)) {
      return res.status(400).json({ error: 'Account data exceeds the supported item limit.' })
    }

    const update = {
      'profile.name': typeof body.profile.name === 'string' ? body.profile.name.trim().slice(0, 80) : '',
      'profile.phone': typeof body.profile.phone === 'string' ? body.profile.phone.slice(0, 40) : '',
      'profile.address': typeof body.profile.address === 'string' ? body.profile.address.slice(0, 200) : '',
      'profile.avatar': body.profile.avatar ?? '',
      'profile.verified': Boolean(body.profile.verified),
      'profile.email': '',
      contacts: body.contacts,
      cnic: {
        front: body.cnic.front ?? null,
        back: body.cnic.back ?? null,
      },
      rideHistory: body.rideHistory,
      sosLog: body.sosLog,
      safetySettings: {
        routeMonitoring: Boolean(body.safetySettings.routeMonitoring),
        biometricAudit: Boolean(body.safetySettings.biometricAudit),
        phoneMasking: Boolean(body.safetySettings.phoneMasking),
        shareTripWithContacts: Boolean(body.safetySettings.shareTripWithContacts),
      },
      notifications: body.notifications.slice(0, 500),
      captainOnline: false,
      captainTrips: [],
    }
    if (update['profile.name'].length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' })

    const user = await User.findById(req.userId)
    if (!user) return res.status(401).json({ error: 'Account not found. Please log in again.' })
    if (user.role !== 'captain' && (body.captainOnline || body.captainTrips.length)) {
      return res.status(403).json({ error: 'Captain activity is only available to captain accounts.' })
    }
    update.captainOnline = user.role === 'captain' && user.captainApplication?.status === 'approved'
      ? body.captainOnline
      : false
    update.captainTrips = user.role === 'captain' ? body.captainTrips : []
    update['profile.email'] = user.email
    user.set(update)
    await user.save()
    return res.json(accountState(user))
  } catch (error) {
    return next(error)
  }
})

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }))

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found.' }))

app.use((error, _req, res, _next) => {
  if (error?.message === 'This website origin is not allowed by the API.') {
    return res.status(403).json({ error: error.message })
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: 'Account data did not pass validation.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Uploaded files exceed the request size limit.' })
  }
  console.error('API request failed:', error)
  return res.status(500).json({ error: 'The server could not complete your request.' })
})

await mongoose.connect(process.env.MONGODB_URI)
if (process.env.NODE_ENV !== 'production') {
  const demoAccounts = [
    { email: 'rider.demo@sherides.local', name: 'Demo Passenger', password: 'SheRidesDemo2026!', role: 'rider', isDemo: true },
    {
      email: 'captain.demo@sherides.local',
      name: 'Demo Captain',
      password: 'CaptainDemo2026!',
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
        submittedAt: new Date(),
      },
    },
  ]
  for (const account of demoAccounts) {
    const { password, name, ...details } = account
    const user = await User.findOne({ email: account.email })
    if (user) {
      user.isDemo = true
      user.role = account.role
      user.profile.name = name
      if (account.captainApplication) user.captainApplication = account.captainApplication
      await user.save()
      continue
    }
    await User.create({
      ...details,
      passwordHash: await bcrypt.hash(password, 12),
      profile: { name, email: account.email },
    })
  }
}
app.listen(port, () => {
  console.log(`SheRides API listening on port ${port}`)
})
