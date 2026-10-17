import mongoose from 'mongoose'

const captainDocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  kind: {
    type: String,
    enum: ['cnicFront', 'cnicBack', 'licenseFront', 'registrationFront', 'registrationBack', 'ownerAuthorization'],
    required: true,
  },
  originalName: { type: String, required: true, maxlength: 255 },
  mimeType: { type: String, enum: ['image/jpeg', 'image/png', 'application/pdf'], required: true },
  iv: { type: Buffer, required: true },
  authTag: { type: Buffer, required: true },
  encryptedData: { type: Buffer, required: true },
}, { timestamps: true, strict: 'throw' })

captainDocumentSchema.index({ userId: 1, kind: 1 }, { unique: true })

const CaptainDocument = mongoose.models.CaptainDocument
  || mongoose.model('CaptainDocument', captainDocumentSchema)

export default CaptainDocument
