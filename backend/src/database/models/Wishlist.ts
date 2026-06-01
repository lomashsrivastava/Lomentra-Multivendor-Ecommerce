import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId
  products: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const WishlistSchema: Schema<IWishlist> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  { timestamps: true }
)

const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema)

export default Wishlist
