import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId
  storeId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  rating: number
  comment: string
  userName: string
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)

export default Review
