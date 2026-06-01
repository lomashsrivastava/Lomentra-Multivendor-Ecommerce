import mongoose, { Schema, Document, Model } from 'mongoose'

export type NotificationType =
  | 'order_placed'
  | 'order_shipped'
  | 'review_received'
  | 'store_approved'
  | 'payout_sent'
  | 'coupon_used'
  | 'system'

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  link?: string
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_shipped',
        'review_received',
        'store_approved',
        'payout_sent',
        'coupon_used',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
)

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema)

export default Notification
