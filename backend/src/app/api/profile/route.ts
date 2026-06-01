import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import User from '@/database/models/User'
import { verifyAuth } from '@/middleware/auth'
import bcrypt from 'bcryptjs'

/**
 * GET: Fetch current user's full profile
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    let decoded
    try {
      decoded = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const user = await User.findById(decoded.userId).select('-passwordHash')
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

/**
 * PUT: Update profile (name, avatar) or change password
 * Body: { name?, avatarUrl?, currentPassword?, newPassword? }
 */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()
    let decoded
    try {
      decoded = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { name, avatarUrl, currency, address, savedPaymentDetails, currentPassword, newPassword } = body

    const user = await User.findById(decoded.userId)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Update name
    if (name && typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim()
    }

    // Update avatar
    if (avatarUrl !== undefined) {
      user.avatarUrl = avatarUrl
    }

    // Update currency
    if (currency === 'INR' || currency === 'USD') {
      user.currency = currency
    }

    // Update address details
    if (address) {
      user.address = {
        fullName: address.fullName || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        contactNumber: address.contactNumber || '',
        alternateNumber: address.alternateNumber || '',
        city: address.city || '',
        district: address.district || '',
        state: address.state || '',
        country: address.country || '',
        pincode: address.pincode || '',
      }
    }

    // Update saved payment details
    if (savedPaymentDetails) {
      user.savedPaymentDetails = {
        upiId: savedPaymentDetails.upiId || '',
        cardNumber: savedPaymentDetails.cardNumber || '',
        cardHolderName: savedPaymentDetails.cardHolderName || '',
        cardExpiry: savedPaymentDetails.cardExpiry || '',
      }
    }

    // Change password
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isMatch) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    await user.save()

    return NextResponse.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        currency: user.currency,
        address: user.address,
        savedPaymentDetails: user.savedPaymentDetails,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
