import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Payout from '@/database/models/Payout'
import Store from '@/database/models/Store'
import Ledger from '@/database/models/Ledger'
import Notification from '@/database/models/Notification'
import { verifyAuth, requireRole } from '@/middleware/auth'

/**
 * GET: Fetch payouts — vendor sees own, admin sees all
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    let user
    try {
      user = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (user.role === 'admin') {
      const payouts = await Payout.find()
        .populate('storeId', 'name slug')
        .populate('vendorId', 'email')
        .sort({ createdAt: -1 })
      return NextResponse.json({ payouts }, { status: 200 })
    }

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) return NextResponse.json({ payouts: [] }, { status: 200 })

    const payouts = await Payout.find({ storeId: store._id }).sort({ createdAt: -1 })

    // Calculate available balance from unpaid ledger entries
    const ledgerAgg = await Ledger.aggregate([
      { $match: { storeId: store._id, payoutStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$merchantShare' } } },
    ])
    const availableBalance = ledgerAgg[0]?.total || 0

    return NextResponse.json({ payouts, availableBalance }, { status: 200 })
  } catch (error) {
    console.error('Payout fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

/**
 * POST: Vendor requests a payout
 * Body: { amount: number }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    let user
    try {
      user = verifyAuth(req)
      requireRole(user, ['vendor'])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    const { amount } = await req.json()
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Check available balance
    const ledgerAgg = await Ledger.aggregate([
      { $match: { storeId: store._id, payoutStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$merchantShare' } } },
    ])
    const available = ledgerAgg[0]?.total || 0
    if (amount > available) {
      return NextResponse.json({ error: `Insufficient balance. Available: $${available.toFixed(2)}` }, { status: 400 })
    }

    const payout = await Payout.create({
      storeId: store._id,
      vendorId: user.userId,
      amount,
    })

    return NextResponse.json({ message: 'Payout requested', payout }, { status: 201 })
  } catch (error) {
    console.error('Payout request error:', error)
    return NextResponse.json({ error: 'Failed to request payout' }, { status: 500 })
  }
}

/**
 * PUT: Admin approves/rejects/pays a payout
 * Body: { payoutId, status, note? }
 */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()
    let user
    try {
      user = verifyAuth(req)
      requireRole(user, ['admin'])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized'
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    void user

    const { payoutId, status, note } = await req.json()
    if (!payoutId || !status) {
      return NextResponse.json({ error: 'payoutId and status required' }, { status: 400 })
    }

    const payout = await Payout.findByIdAndUpdate(
      payoutId,
      { $set: { status, note: note || '' } },
      { new: true }
    )
    if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 })

    // If paid, mark ledger entries as paid
    if (status === 'paid') {
      await Ledger.updateMany(
        { storeId: payout.storeId, payoutStatus: 'pending' },
        { $set: { payoutStatus: 'paid' } }
      )
    }

    // Notify vendor
    await Notification.create({
      userId: payout.vendorId,
      type: 'payout_sent',
      title: status === 'paid' ? 'Payout Processed' : status === 'rejected' ? 'Payout Rejected' : 'Payout Updated',
      message: status === 'paid'
        ? `Your payout of $${payout.amount.toFixed(2)} has been processed successfully.`
        : status === 'rejected'
        ? `Your payout request of $${payout.amount.toFixed(2)} was rejected. ${note || ''}`
        : `Your payout status has been updated to: ${status}`,
    })

    return NextResponse.json({ message: 'Payout updated', payout }, { status: 200 })
  } catch (error) {
    console.error('Payout update error:', error)
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 })
  }
}
