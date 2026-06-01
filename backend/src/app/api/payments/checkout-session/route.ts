import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Store from '@/database/models/Store'
import { verifyAuth } from '@/middleware/auth'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // Verify Auth
    try {
      verifyAuth(req)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const { parentOrderId } = await req.json()
    if (!parentOrderId) {
      return NextResponse.json({ error: 'parentOrderId is required' }, { status: 400 })
    }

    const orders = await Order.find({ parentOrderId })
    if (orders.length === 0) {
      return NextResponse.json({ error: 'No orders found for this parentOrderId' }, { status: 404 })
    }

    const totalAmount = orders.reduce((sum, order) => sum + order.subtotal, 0)
    const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`

    const splitDetails = []
    for (const order of orders) {
      const store = await Store.findById(order.storeId)
      const commission = Number((order.subtotal * 0.10).toFixed(2))
      const payout = Number((order.subtotal * 0.90).toFixed(2))
      splitDetails.push({
        storeId: order.storeId,
        storeName: store ? store.name : 'Unknown Store',
        amount: order.subtotal,
        commission,
        payout,
      })
    }

    return NextResponse.json({
      sessionId,
      parentOrderId,
      totalAmount,
      splitDetails,
    }, { status: 200 })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
