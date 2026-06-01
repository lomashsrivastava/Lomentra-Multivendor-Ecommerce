import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { generateProductDetails } from '@/ai/gemini'
import { sanitizeObject } from '@/security/sanitize'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify merchant authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { prompt } = sanitizedBody

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Generation prompt is required' }, { status: 400 })
    }

    // 3. Generate Details via Gemini service
    const aiResponse = await generateProductDetails(prompt.trim())

    // 4. Content Moderation Check
    if (!aiResponse.sfw) {
      return NextResponse.json(
        {
          error: 'Content flag: Your prompt contains inappropriate language or violates marketplace policies.',
          sfw: false,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ details: aiResponse }, { status: 200 })
  } catch (error) {
    console.error('AI Product generate error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during AI listing generation' },
      { status: 500 }
    )
  }
}
