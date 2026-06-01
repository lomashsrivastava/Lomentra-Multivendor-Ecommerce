import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Store from '@/database/models/Store'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

// GET: Fetch merchant orders
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify Authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Find merchant's store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({ error: 'Merchant store not found' }, { status: 404 })
    }

    // 3. Fetch Orders belonging to this store
    const orders = await Order.find({ storeId: store._id })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Fetch merchant orders error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching merchant orders' },
      { status: 500 }
    )
  }
}

// PUT: Update merchant order fulfillment status
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify Authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Find merchant's store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({ error: 'Merchant store not found' }, { status: 404 })
    }

    // 3. Parse and sanitize input
    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const { orderId, status } = sanitized

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status type' }, { status: 400 })
    }

    // 4. Find and verify order ownership
    const order = await Order.findOne({ _id: orderId, storeId: store._id })
    if (!order) {
      return NextResponse.json({ error: 'Order not found for this store' }, { status: 404 })
    }

    // 5. Update Status
    order.fulfillmentStatus = status as any
    await order.save()

    // Notify customer
    try {
      const statusMessages: Record<string, string> = {
        processing: 'Your order is being prepared by the vendor.',
        shipped: 'Your order has been shipped! It\'s on its way.',
        delivered: 'Your order has been delivered. Enjoy!',
        cancelled: 'Your order has been cancelled.',
      }
      if (statusMessages[status]) {
        await (await import('@/database/models/Notification')).default.create({
          userId: order.customerId,
          type: status === 'shipped' ? 'order_shipped' : 'system',
          title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: statusMessages[status],
        })
      }
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr)
    }

    return NextResponse.json(
      { message: 'Order status updated successfully', order },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update merchant order error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred updating order status' },
      { status: 500 }
    )
  }
}
