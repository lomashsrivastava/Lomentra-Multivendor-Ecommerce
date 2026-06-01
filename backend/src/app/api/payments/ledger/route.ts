import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Store from '@/database/models/Store'
import Ledger from '@/database/models/Ledger'
import { verifyAuth, requireRole } from '@/middleware/auth'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // Verify Auth & role
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // Find store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({
        metrics: { totalEarnings: 0, pendingPayouts: 0, paidPayouts: 0 },
        ledger: [],
      })
    }

    // Get ledger entries
    const ledgerEntries = await Ledger.find({ storeId: store._id })
      .populate('orderId')
      .sort({ createdAt: -1 })

    // Compute metrics
    let totalEarnings = 0
    let pendingPayouts = 0
    let paidPayouts = 0

    for (const entry of ledgerEntries) {
      totalEarnings += entry.merchantShare
      if (entry.payoutStatus === 'pending') {
        pendingPayouts += entry.merchantShare
      } else if (entry.payoutStatus === 'paid') {
        paidPayouts += entry.merchantShare
      }
    }

    return NextResponse.json({
      metrics: {
        totalEarnings: Number(totalEarnings.toFixed(2)),
        pendingPayouts: Number(pendingPayouts.toFixed(2)),
        paidPayouts: Number(paidPayouts.toFixed(2)),
      },
      ledger: ledgerEntries,
    }, { status: 200 })
  } catch (error) {
    console.error('Merchant ledger fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
