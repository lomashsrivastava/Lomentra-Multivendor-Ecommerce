import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: 'admin' | 'vendor' | 'customer'
  status: 'active' | 'suspended' | 'pending'
  avatarUrl?: string
  address?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    contactNumber: string
    alternateNumber: string
    city: string
    district: string
    state: string
    country: string
    pincode: string
  }
  savedPaymentDetails?: {
    upiId: string
    cardNumber: string
    cardHolderName: string
    cardExpiry: string
  }
  currency?: 'INR' | 'USD'
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'vendor', 'customer'],
      default: 'customer',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'pending',
      required: true,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    avatarUrl: { type: String, trim: true },
    address: {
      fullName: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      contactNumber: { type: String, default: '' },
      alternateNumber: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    savedPaymentDetails: {
      upiId: { type: String, default: '' },
      cardNumber: { type: String, default: '' },
      cardHolderName: { type: String, default: '' },
      cardExpiry: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
)

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
