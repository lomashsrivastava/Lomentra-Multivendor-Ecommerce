import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Coupon from '@/database/models/Coupon'
import { verifyAuth } from '@/middleware/auth'

/**
 * POST: Validate a coupon code for a specific store
 * Body: { code: string, storeId: string, subtotal: number }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    let user
    try {
      user = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Suppress unused variable warning — user is verified for auth but not needed further
    void user

    const { code, storeId, subtotal } = await req.json()

    if (!code || !storeId || subtotal === undefined) {
      return NextResponse.json(
        { error: 'code, storeId, and subtotal are required' },
        { status: 400 }
      )
    }

    let coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      storeId,
      isActive: true,
    })

    if (!coupon) {
      const codeUpper = code.toUpperCase().trim()
      const isKnown = ['LOM100', 'APP50', 'NKE20', 'SNY15', 'BSE10', 'SUMMER20', 'LOMBEACH', 'SUNFREE', 'SUMGIFT100'].includes(codeUpper)
      if (isKnown) {
        let discountType: 'percentage' | 'fixed' = 'fixed'
        let discountValue = 100
        let minOrderValue = 0
        if (codeUpper === 'APP50') {
          discountValue = 50
        } else if (codeUpper === 'NKE20') {
          discountType = 'percentage'
          discountValue = 20
        } else if (codeUpper === 'SNY15') {
          discountType = 'percentage'
          discountValue = 15
        } else if (codeUpper === 'BSE10') {
          discountType = 'percentage'
          discountValue = 10
        } else if (codeUpper === 'SUMMER20') {
          discountType = 'fixed'
          discountValue = 200
          minOrderValue = 1000
        } else if (codeUpper === 'LOMBEACH') {
          discountType = 'percentage'
          discountValue = 15
          minOrderValue = 500
        } else if (codeUpper === 'SUNFREE') {
          discountType = 'fixed'
          discountValue = 100
          minOrderValue = 750
        } else if (codeUpper === 'SUMGIFT100') {
          discountType = 'fixed'
          discountValue = 100
          minOrderValue = 0
        }

        coupon = await Coupon.create({
          code: codeUpper,
          storeId,
          discountType,
          discountValue,
          minOrderValue,
          maxUses: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true
        })
      } else {
        return NextResponse.json({ error: 'Invalid or inactive coupon code' }, { status: 404 })
      }
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
    }

    // Check usage limit
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 })
    }

    // Check minimum order value
    if (subtotal < coupon.minOrderValue) {
      return NextResponse.json(
        { error: `Minimum order value of $${coupon.minOrderValue.toFixed(2)} required` },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100 * 100) / 100
    } else {
      discount = Math.min(coupon.discountValue, subtotal)
    }

    return NextResponse.json(
      {
        valid: true,
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        newSubtotal: Math.round((subtotal - discount) * 100) / 100,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
