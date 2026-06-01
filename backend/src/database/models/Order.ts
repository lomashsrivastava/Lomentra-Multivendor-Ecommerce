import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  name: string
  price: number
  quantity: number
}

export interface IShippingAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface IOrder extends Document {
  parentOrderId: string
  customerId: mongoose.Types.ObjectId
  storeId: mongoose.Types.ObjectId
  items: IOrderItem[]
  subtotal: number
  couponCode?: string
  discount?: number
  shippingAddress: IShippingAddress
  paymentStatus: 'pending' | 'paid' | 'failed'
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
})

const ShippingAddressSchema = new Schema<IShippingAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
})

const OrderSchema = new Schema<IOrder>(
  {
    parentOrderId: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    discount: { type: Number, default: 0 },
    shippingAddress: ShippingAddressSchema,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
export default Order
