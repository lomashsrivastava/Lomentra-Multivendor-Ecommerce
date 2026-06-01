import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Review from '@/database/models/Review'
import { generateReviewSummary } from '@/ai/gemini'
import { sanitizeObject } from '@/security/sanitize'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { productId } = sanitizedBody

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // 2. Fetch all reviews for this product
    const reviews = await Review.find({ productId }).select('rating comment')

    // 3. Generate summary using Gemini
    const summary = await generateReviewSummary(reviews)

    return NextResponse.json({ summary }, { status: 200 })
  } catch (error) {
    console.error('AI Review summary error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during review analysis' },
      { status: 500 }
    )
  }
}
