import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Coupon from '@/database/models/Coupon'
import Store from '@/database/models/Store'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

/**
 * GET: Fetch coupons for the vendor's store
 */
export async function GET(req: NextRequest) {
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

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const coupons = await Coupon.find({ storeId: store._id }).sort({ createdAt: -1 })
    return NextResponse.json({ coupons }, { status: 200 })
  } catch (error) {
    console.error('Coupon fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

/**
 * POST: Create a new coupon
 * Body: { code, discountType, discountValue, minOrderValue, maxUses, expiresAt }
 */
export async function POST(req: NextRequest) {
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

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = sanitized

    if (!code || typeof code !== 'string' || code.trim().length < 3) {
      return NextResponse.json({ error: 'Coupon code must be at least 3 characters' }, { status: 400 })
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json({ error: 'discountType must be percentage or fixed' }, { status: 400 })
    }

    if (typeof discountValue !== 'number' || discountValue <= 0) {
      return NextResponse.json({ error: 'discountValue must be a positive number' }, { status: 400 })
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return NextResponse.json({ error: 'Percentage discount cannot exceed 100%' }, { status: 400 })
    }

    if (!expiresAt) {
      return NextResponse.json({ error: 'Expiry date is required' }, { status: 400 })
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      storeId: store._id,
      discountType,
      discountValue,
      minOrderValue: minOrderValue || 0,
      maxUses: maxUses || 0,
      expiresAt: new Date(expiresAt),
    })

    return NextResponse.json({ message: 'Coupon created', coupon }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json({ error: 'A coupon with this code already exists for your store' }, { status: 409 })
    }
    console.error('Coupon creation error:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}

/**
 * PUT: Update a coupon
 * Body: { couponId, ...fields }
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

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const body = await req.json()
    const { couponId, ...updates } = body

    if (!couponId) {
      return NextResponse.json({ error: 'couponId is required' }, { status: 400 })
    }

    const coupon = await Coupon.findOneAndUpdate(
      { _id: couponId, storeId: store._id },
      { $set: updates },
      { new: true }
    )

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Coupon updated', coupon }, { status: 200 })
  } catch (error) {
    console.error('Coupon update error:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

/**
 * DELETE: Deactivate a coupon
 * Body: { couponId }
 */
export async function DELETE(req: NextRequest) {
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

    const store = await Store.findOne({ vendorId: user.userId })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    const { couponId } = await req.json()
    if (!couponId) {
      return NextResponse.json({ error: 'couponId is required' }, { status: 400 })
    }

    await Coupon.findOneAndDelete({ _id: couponId, storeId: store._id })
    return NextResponse.json({ message: 'Coupon deleted' }, { status: 200 })
  } catch (error) {
    console.error('Coupon delete error:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
