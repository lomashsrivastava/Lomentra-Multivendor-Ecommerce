import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ILedger extends Document {
  orderId: mongoose.Types.ObjectId
  storeId: mongoose.Types.ObjectId
  totalAmount: number
  platformFee: number
  merchantShare: number
  payoutStatus: 'pending' | 'paid'
  createdAt: Date
  updatedAt: Date
}

const LedgerSchema: Schema<ILedger> = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    totalAmount: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    merchantShare: { type: Number, required: true },
    payoutStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Ledger: Model<ILedger> = mongoose.models.Ledger || mongoose.model<ILedger>('Ledger', LedgerSchema)
export default Ledger
