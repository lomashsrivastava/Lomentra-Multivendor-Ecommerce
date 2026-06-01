import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Ledger from '@/database/models/Ledger'
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

    const ledgerEntries = await Ledger.find({})
      .populate('storeId', 'name slug')
      .populate('orderId')
      .sort({ createdAt: -1 })

    let totalGMV = 0
    let totalPlatformFees = 0
    let totalMerchantShare = 0
    let pendingPayouts = 0
    let paidPayouts = 0

    for (const entry of ledgerEntries) {
      totalGMV += entry.totalAmount
      totalPlatformFees += entry.platformFee
      totalMerchantShare += entry.merchantShare
      if (entry.payoutStatus === 'pending') {
        pendingPayouts += entry.merchantShare
      } else {
        paidPayouts += entry.merchantShare
      }
    }

    return NextResponse.json({
      metrics: {
        totalGMV: Number(totalGMV.toFixed(2)),
        totalPlatformFees: Number(totalPlatformFees.toFixed(2)),
        totalMerchantShare: Number(totalMerchantShare.toFixed(2)),
        pendingPayouts: Number(pendingPayouts.toFixed(2)),
        paidPayouts: Number(paidPayouts.toFixed(2)),
      },
      ledger: ledgerEntries,
    }, { status: 200 })
  } catch (error) {
    console.error('Admin fetch ledger error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const { ledgerId, storeId } = await req.json()

    if (ledgerId) {
      const ledger = await Ledger.findById(ledgerId)
      if (!ledger) {
        return NextResponse.json({ error: 'Ledger record not found' }, { status: 404 })
      }
      ledger.payoutStatus = 'paid'
      await ledger.save()
      return NextResponse.json({ success: true, message: 'Payout marked as paid for this record.' })
    }

    if (storeId) {
      const result = await Ledger.updateMany(
        { storeId, payoutStatus: 'pending' },
        { $set: { payoutStatus: 'paid' } }
      )
      return NextResponse.json({
        success: true,
        message: `Payouts marked as paid for store. Updated ${result.modifiedCount} records.`,
      })
    }

    // Default: Mark ALL pending ledger entries as paid
    const result = await Ledger.updateMany(
      { payoutStatus: 'pending' },
      { $set: { payoutStatus: 'paid' } }
    )
    return NextResponse.json({
      success: true,
      message: `All pending payouts marked as paid. Updated ${result.modifiedCount} records.`,
    })
  } catch (error) {
    console.error('Admin update payout status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
