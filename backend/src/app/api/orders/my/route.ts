import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import { verifyAuth } from '@/middleware/auth'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify Authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Fetch Customer Orders
    const orders = await Order.find({ customerId: decodedUser.userId })
      .populate('storeId', 'name slug logoUrl')
      .sort({ createdAt: -1 })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('Fetch customer orders error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching your order history' },
      { status: 500 }
    )
  }
}
