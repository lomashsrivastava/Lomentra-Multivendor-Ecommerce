import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Product from '@/database/models/Product'
import { generateChatResponse } from '@/ai/gemini'
import { sanitizeObject } from '@/security/sanitize'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { message } = sanitizedBody

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Chat message cannot be empty' }, { status: 400 })
    }

    // 2. Query active product catalog to construct context (limit to 15 for prompt size efficiency)
    const products = await Product.find({ status: 'active' })
      .select('name description price category')
      .limit(15)

    const catalogContext = products.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      slug: p._id.toString(), // map id as slug fallback
      category: p.category || '',
    }))

    // 3. Call AI chatbot assistant generator
    const aiChatResponse = await generateChatResponse(message.trim(), catalogContext)

    // 4. Retrieve database product objects for the recommended IDs
    let recommendedProducts: any[] = []
    if (aiChatResponse.recommendedProductIds && aiChatResponse.recommendedProductIds.length > 0) {
      recommendedProducts = await Product.find({
        _id: { $in: aiChatResponse.recommendedProductIds },
        status: 'active'
      }).select('name price category images stock description')
    }

    return NextResponse.json({
      chat: {
        reply: aiChatResponse.reply,
        recommendedProductIds: aiChatResponse.recommendedProductIds,
        products: recommendedProducts
      }
    }, { status: 200 })
  } catch (error) {
    console.error('AI Chat assistant error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during chat assistant response' },
      { status: 500 }
    )
  }
}
