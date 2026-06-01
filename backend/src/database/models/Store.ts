import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStore extends Document {
  vendorId: mongoose.Types.ObjectId
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  status: 'active' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

const StoreSchema: Schema<IStore> = new Schema(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    description: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    bannerUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Store: Model<IStore> = mongoose.models.Store || mongoose.model<IStore>('Store', StoreSchema)

export default Store
