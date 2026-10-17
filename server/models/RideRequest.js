import mongoose from 'mongoose'

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 200 },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
}, { _id: false, strict: 'throw' })

const rideRequestSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  pickup: { type: placeSchema, required: true },
  dropoff: { type: placeSchema, required: true },
  fare: { type: Number, required: true, min: 1, max: 100000 },
  tier: { type: String, required: true, maxlength: 40 },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending', index: true },
}, { timestamps: true, strict: 'throw' })

rideRequestSchema.index({ status: 1, createdAt: 1 })

const RideRequest = mongoose.models.RideRequest || mongoose.model('RideRequest', rideRequestSchema)

export default RideRequest
