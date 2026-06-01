import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IPayout extends Document {
  storeId: mongoose.Types.ObjectId
  vendorId: mongoose.Types.ObjectId
  amount: number
  status: 'requested' | 'approved' | 'paid' | 'rejected'
  note?: string
  createdAt: Date
  updatedAt: Date
}

const PayoutSchema: Schema<IPayout> = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['requested', 'approved', 'paid', 'rejected'],
      default: 'requested',
    },
    note: { type: String },
  },
  { timestamps: true }
)

const Payout: Model<IPayout> =
  mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema)

export default Payout
