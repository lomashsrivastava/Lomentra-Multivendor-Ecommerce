import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ICategory extends Document {
  name: string
  slug: string
  parentId: mongoose.Types.ObjectId | null
  level: number
  image?: string
  icon?: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  sortOrder?: number
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    level: { type: Number, required: true, min: 1 },
    image: { type: String },
    icon: { type: String },
    description: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

CategorySchema.index({ parentId: 1 })
CategorySchema.index({ slug: 1 })
CategorySchema.index({ name: 1 })

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)

export default Category
