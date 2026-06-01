import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Review from '@/database/models/Review'
import Product from '@/database/models/Product'
import Order from '@/database/models/Order'
import { verifyAuth } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

/**
 * GET: Retrieve reviews for a product
 * Query Params:
 *   - productId: Required, filter reviews by product
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID query parameter is required' }, { status: 400 })
    }

    const reviews = await Review.find({ productId }).sort({ createdAt: -1 })

    // Calculate rating stats
    const totalReviews = reviews.length
    const averageRating =
      totalReviews > 0
        ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    }

    return NextResponse.json(
      {
        reviews,
        stats: {
          totalReviews,
          averageRating,
          ratingDistribution,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Fetch reviews error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred retrieving reviews' },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new review (Customer Access only)
 * Requirements:
 *   - User must be logged in
 *   - User must have a paid order containing this product (verified purchaser)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify customer authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { productId, rating, comment } = sanitizedBody

    // 3. Validation
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 })
    }

    // 4. Retrieve Product to verify existence and get storeId
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 5. Verify Purchase History
    // Customer must have a paid order containing this product
    const verifiedOrder = await Order.findOne({
      customerId: decodedUser.userId,
      paymentStatus: 'paid',
      'items.productId': productId,
    })

    if (!verifiedOrder) {
      return NextResponse.json(
        { error: 'You can only review products you have purchased and paid for.' },
        { status: 403 }
      )
    }

    // 6. Check if user already reviewed this product to avoid duplicate reviews
    const existingReview = await Review.findOne({
      productId,
      userId: decodedUser.userId,
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 400 }
      )
    }

    // 7. Create review
    const review = await Review.create({
      productId,
      storeId: product.storeId,
      userId: decodedUser.userId,
      rating,
      comment: comment.trim(),
      userName: decodedUser.email ? decodedUser.email.split('@')[0] : 'Anonymous Customer',
    })

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred submitting review' },
      { status: 500 }
    )
  }
}
