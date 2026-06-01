import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Product from '@/database/models/Product'
import { verifyAuth } from '@/middleware/auth'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let decodedUser
    try {
      decodedUser = verifyAuth(req)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify ownership: customerId matches authenticated user's ID
    if (order.customerId.toString() !== decodedUser.userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this order' }, { status: 403 })
    }

    // Check status constraints
    if (order.fulfillmentStatus === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 })
    }

    if (['shipped', 'delivered'].includes(order.fulfillmentStatus)) {
      return NextResponse.json(
        { error: `Cannot cancel an order that is already ${order.fulfillmentStatus}` },
        { status: 400 }
      )
    }

    // Update status to cancelled
    order.fulfillmentStatus = 'cancelled'
    await order.save()

    // Restore product stock counts
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      })
    }

    return NextResponse.json(
      { message: 'Order successfully cancelled', order },
      { status: 200 }
    )
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
