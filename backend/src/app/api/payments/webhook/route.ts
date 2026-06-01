import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Ledger from '@/database/models/Ledger'
import { verifyAuth } from '@/middleware/auth'

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

    const ledgerEntries = []

    for (const order of orders) {
      // Update order payment status
      if (order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid'
        await order.save()
      }

      // Check if ledger entry already exists
      let ledger = await Ledger.findOne({ orderId: order._id })
      if (!ledger) {
        const platformFee = Number((order.subtotal * 0.10).toFixed(2))
        const merchantShare = Number((order.subtotal * 0.90).toFixed(2))
        ledger = await Ledger.create({
          orderId: order._id,
          storeId: order.storeId,
          totalAmount: order.subtotal,
          platformFee,
          merchantShare,
          payoutStatus: 'pending',
        })
      }
      ledgerEntries.push(ledger)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment simulated successfully. Ledger entries created.',
      ledgerEntries,
    }, { status: 200 })
  } catch (error) {
    console.error('Webhook simulation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
