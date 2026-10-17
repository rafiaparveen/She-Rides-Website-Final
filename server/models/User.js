import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  name: { type: String, required: true, maxlength: 80 },
  relation: { type: String, required: true, maxlength: 80 },
  phone: { type: String, required: true, maxlength: 40 },
}, { _id: false, strict: 'throw' })

const rideSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  date: { type: String, required: true, maxlength: 50 },
  pickup: { type: String, required: true, maxlength: 200 },
  dropoff: { type: String, required: true, maxlength: 200 },
  driver: { type: String, required: true, maxlength: 100 },
  car: { type: String, required: true, maxlength: 120 },
  fare: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Completed', 'Cancelled'], required: true },
}, { _id: false, strict: 'throw' })

const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  triggeredAt: { type: String, required: true, maxlength: 50 },
  status: { type: String, enum: ['active', 'resolved'], required: true },
  resolvedAt: { type: String, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const notificationSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  type: { type: String, enum: ['info', 'warning'], required: true },
  title: { type: String, required: true, maxlength: 120 },
  message: { type: String, required: true, maxlength: 500 },
  read: { type: Boolean, default: false },
  createdAt: { type: String, required: true, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const captainApplicationSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending_review', 'approved'], default: 'pending_review' },
  phone: { type: String, required: true, maxlength: 40 },
  vehicleType: { type: String, enum: ['motorbike', 'car'], required: true },
  vehicleMake: { type: String, required: true, maxlength: 80 },
  vehicleModel: { type: String, required: true, maxlength: 80 },
  vehicleYear: { type: Number, required: true, min: 1980, max: 2100 },
  registrationNumber: { type: String, required: true, maxlength: 30 },
  registeredOwnerName: { type: String, required: true, maxlength: 100 },
  ownerIsCaptain: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false, strict: 'throw' })

const captainTripSchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  rideRequestId: { type: String, maxlength: 80 },
  rider: { type: String, required: true, maxlength: 100 },
  pickup: { type: String, required: true, maxlength: 200 },
  dropoff: { type: String, required: true, maxlength: 200 },
  fare: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['accepted', 'in_progress', 'completed', 'cancelled'], required: true },
  date: { type: String, required: true, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const captainLocationSchema = new mongoose.Schema({
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  accuracy: { type: Number, min: 0, max: 100000 },
  updatedAt: { type: String, required: true, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const walletEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  type: { type: String, enum: ['top_up', 'ride_debit', 'ride_refund'], required: true },
  provider: { type: String, enum: ['bank', 'easypaisa', 'jazzcash', null], default: null },
  amount: { type: Number, required: true, min: 1 },
  rideId: { type: String, maxlength: 80 },
  status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
  createdAt: { type: String, required: true, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const captainDepositEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, maxlength: 80 },
  type: { type: String, enum: ['platform_deposit'], required: true },
  provider: { type: String, enum: ['bank', 'easypaisa', 'jazzcash'], required: true },
  amount: { type: Number, required: true, min: 500 },
  status: { type: String, enum: ['demo_recorded'], default: 'demo_recorded' },
  createdAt: { type: String, required: true, maxlength: 50 },
}, { _id: false, strict: 'throw' })

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['rider', 'captain'], default: 'rider', required: true },
  isDemo: { type: Boolean, default: false },
  captainApplication: { type: captainApplicationSchema, default: undefined },
  captainOnline: { type: Boolean, default: false },
  captainOnTrip: { type: Boolean, default: false },
  captainLocation: { type: captainLocationSchema, default: null },
  captainTrips: { type: [captainTripSchema], default: [] },
  walletBalance: { type: Number, default: 0, min: 0 },
  walletLedger: { type: [walletEntrySchema], default: [] },
  captainDepositLedger: { type: [captainDepositEntrySchema], default: [] },
  profile: {
    name: { type: String, required: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, maxlength: 254 },
    phone: { type: String, default: '', maxlength: 40 },
    address: { type: String, default: '', maxlength: 200 },
    avatar: { type: String, default: '', maxlength: 720000 },
    verified: { type: Boolean, default: false },
  },
  contacts: { type: [contactSchema], default: [] },
  cnic: {
    front: { type: mongoose.Schema.Types.Mixed, default: null },
    back: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  rideHistory: { type: [rideSchema], default: [] },
  sosLog: { type: [alertSchema], default: [] },
  safetySettings: {
    routeMonitoring: { type: Boolean, default: true },
    biometricAudit: { type: Boolean, default: true },
    phoneMasking: { type: Boolean, default: true },
    shareTripWithContacts: { type: Boolean, default: true },
  },
  notifications: { type: [notificationSchema], default: [] },
}, {
  timestamps: true,
  strict: 'throw',
  minimize: false,
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
