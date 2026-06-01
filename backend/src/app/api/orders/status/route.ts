import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Notification from '@/database/models/Notification'
import { verifyAuth, requireRole } from '@/middleware/auth'

/**
 * PUT: Vendor updates order fulfillment status
 * Body: { orderId, fulfillmentStatus }
 */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()
    let user
    try {
      user = verifyAuth(req)
      requireRole(user, ['vendor', 'admin'])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized'
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    void user

    const { orderId, fulfillmentStatus } = await req.json()
    if (!orderId || !fulfillmentStatus) {
      return NextResponse.json({ error: 'orderId and fulfillmentStatus required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(fulfillmentStatus)) {
      return NextResponse.json({ error: 'Invalid fulfillment status' }, { status: 400 })
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { $set: { fulfillmentStatus } },
      { new: true }
    )

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Notify customer
    const statusMessages: Record<string, string> = {
      processing: 'Your order is being prepared by the vendor.',
      shipped: 'Your order has been shipped! It\'s on its way.',
      delivered: 'Your order has been delivered. Enjoy!',
      cancelled: 'Your order has been cancelled.',
    }

    if (statusMessages[fulfillmentStatus]) {
      await Notification.create({
        userId: order.customerId,
        type: fulfillmentStatus === 'shipped' ? 'order_shipped' : 'system',
        title: `Order ${fulfillmentStatus.charAt(0).toUpperCase() + fulfillmentStatus.slice(1)}`,
        message: statusMessages[fulfillmentStatus],
      })
    }

    return NextResponse.json({ message: 'Order status updated', order }, { status: 200 })
  } catch (error) {
    console.error('Order status update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
