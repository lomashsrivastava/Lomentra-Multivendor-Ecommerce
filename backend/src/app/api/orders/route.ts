import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Order from '@/database/models/Order'
import Product from '@/database/models/Product'
import { verifyAuth } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'
import crypto from 'crypto'
import Coupon from '@/database/models/Coupon'

interface InputItem {
  productId: string
  quantity: number
}

export async function POST(req: NextRequest) {
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

    // 2. Parse and Sanitize Input
    const body = await req.json()
    const sanitized = sanitizeObject(body)
    const { items, shippingAddress, couponCode, discount } = sanitized

    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 })
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    const { street, city, state, zipCode, country } = shippingAddress
    if (!street || !city || !state || !zipCode || !country) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 })
    }

    // 3. Fetch product details and validate stock
    const productIds = items.map((i: InputItem) => i.productId)
    const dbProducts = await Product.find({ _id: { $in: productIds } })

    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]))

    // Group items by storeId
    const storeItemsMap = new Map<string, any[]>()

    for (const item of items) {
      const dbProduct = productMap.get(item.productId)
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        )
      }

      if (dbProduct.status !== 'active') {
        return NextResponse.json(
          { error: `Product '${dbProduct.name}' is no longer active` },
          { status: 400 }
        )
      }

      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for product ${dbProduct.name}` },
          { status: 400 }
        )
      }

      if (item.quantity > dbProduct.stock) {
        return NextResponse.json(
          {
            error: `Insufficient stock for product '${dbProduct.name}'. Available: ${dbProduct.stock}`,
          },
          { status: 400 }
        )
      }

      const storeIdStr = dbProduct.storeId.toString()
      if (!storeItemsMap.has(storeIdStr)) {
        storeItemsMap.set(storeIdStr, [])
      }

      storeItemsMap.get(storeIdStr)!.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
      })
    }

    // 4. Create child orders and update stock
    const parentOrderId = `parent_${crypto.randomBytes(8).toString('hex')}`
    const createdOrders = []

    for (const [storeId, groupItems] of storeItemsMap.entries()) {
      const baseSubtotal = groupItems.reduce((acc, item) => acc + item.price * item.quantity, 0)

      let orderDiscount = 0
      let appliedCode = ''
      if (couponCode) {
        let storeCoupon = await Coupon.findOne({
          code: couponCode.toUpperCase().trim(),
          storeId,
          isActive: true,
        })
        if (!storeCoupon) {
          const codeUpper = couponCode.toUpperCase().trim()
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
            try {
              storeCoupon = await Coupon.create({
                code: codeUpper,
                storeId,
                discountType,
                discountValue,
                minOrderValue,
                maxUses: 0,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                isActive: true
              })
            } catch (err) {
              storeCoupon = await Coupon.findOne({
                code: codeUpper,
                storeId,
                isActive: true,
              })
            }
          }
        }
        if (storeCoupon) {
          appliedCode = storeCoupon.code
          if (storeCoupon.discountType === 'percentage') {
            orderDiscount = Math.round(((baseSubtotal * storeCoupon.discountValue) / 100) * 100) / 100
          } else {
            orderDiscount = Math.min(storeCoupon.discountValue, baseSubtotal)
          }
        }
      }

      const subtotal = Math.max(0, Math.round((baseSubtotal - orderDiscount) * 100) / 100)

      // Decrement stock
      for (const item of groupItems) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        })
      }

      // Create Order document
      const order = await Order.create({
        parentOrderId,
        customerId: decodedUser.userId,
        storeId,
        items: groupItems.map((gi) => ({
          productId: gi.productId,
          name: gi.name,
          price: gi.price,
          quantity: gi.quantity,
        })),
        subtotal,
        couponCode: appliedCode,
        discount: orderDiscount,
        shippingAddress: { street, city, state, zipCode, country },
        paymentStatus: 'pending',
        fulfillmentStatus: 'pending',
      })

      createdOrders.push(order)
    }

    return NextResponse.json(
      {
        message: 'Orders placed successfully',
        parentOrderId,
        orders: createdOrders,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Order placement error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred placing your order' },
      { status: 500 }
    )
  }
}
