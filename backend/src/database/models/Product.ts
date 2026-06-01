import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProduct extends Document {
  storeId: mongoose.Types.ObjectId
  name: string
  description: string
  price: number
  categoryId: mongoose.Types.ObjectId
  category?: string
  stock: number
  images: string[]
  status: 'active' | 'draft' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
