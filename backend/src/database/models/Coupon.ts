import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICoupon extends Document {
  code: string
  storeId: mongoose.Types.ObjectId
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue: number
  maxUses: number
  usedCount: number
  expiresAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CouponSchema: Schema<ICoupon> = new Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxUses: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Unique code per store
CouponSchema.index({ code: 1, storeId: 1 }, { unique: true })

const Coupon: Model<ICoupon> =
  mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema)

export default Coupon
