import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import { verifyAuth, requireRole } from '@/middleware/auth'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // Verify Auth & Admin role
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const orders = await Order.find({})
      .populate('customerId', 'name email')
      .populate('storeId', 'name slug')
      .sort({ createdAt: -1 })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Admin fetch orders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
