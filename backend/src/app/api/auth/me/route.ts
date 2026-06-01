import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/database/models/User'
import { verifyAuth } from '@/middleware/auth'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify Authentication token
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Fetch User Profile
    const user = await User.findById(decodedUser.userId).select('-passwordHash')
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // 3. Return user profile info
    return NextResponse.json(
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Fetch me profile error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred retrieving profile' },
      { status: 500 }
    )
  }
}
