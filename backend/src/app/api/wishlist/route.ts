import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Wishlist from '@/database/models/Wishlist'
import { verifyAuth } from '@/middleware/auth'

/**
 * GET: Retrieve the current user's wishlist with populated product data
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

    const wishlist = await Wishlist.findOne({ userId: user.userId }).populate({
      path: 'products',
      populate: { path: 'storeId', select: 'name slug logoUrl' },
    })

    return NextResponse.json(
      { products: wishlist?.products || [] },
      { status: 200 }
    )
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

/**
 * POST: Add a product to the wishlist
 * Body: { productId: string }
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

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: user.userId },
      { $addToSet: { products: productId } },
      { upsert: true, new: true }
    )

    return NextResponse.json(
      { message: 'Added to wishlist', count: wishlist.products.length },
      { status: 200 }
    )
  } catch (error) {
    console.error('Wishlist add error:', error)
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 })
  }
}

/**
 * DELETE: Remove a product from the wishlist
 * Body: { productId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect()

    let user
    try {
      user = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: user.userId },
      { $pull: { products: productId } },
      { new: true }
    )

    return NextResponse.json(
      { message: 'Removed from wishlist', count: wishlist?.products.length || 0 },
      { status: 200 }
    )
  } catch (error) {
    console.error('Wishlist remove error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
