import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Store from '@/database/models/Store'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

/**
 * GET: Retrieve the logged-in merchant's store
 */
export async function GET(req: NextRequest) {
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

    // 2. Fetch the store linked to this vendor
    const store = await Store.findOne({ vendorId: decodedUser.userId })

    // Return 200 with store: null if not created yet (frontend will check this to show wizard)
    return NextResponse.json({ store }, { status: 200 })
  } catch (error) {
    console.error('Fetch merchant store error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred retrieving your store' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update merchant store profile (excluding slug)
 */
export async function PUT(req: NextRequest) {
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
    const { name, description, logoUrl, bannerUrl } = sanitizedBody

    // 3. Validation check
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Store name cannot be empty' }, { status: 400 })
    }

    // 4. Update the store
    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl.trim()
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl.trim()

    const store = await Store.findOneAndUpdate(
      { vendorId: decodedUser.userId },
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!store) {
      return NextResponse.json({ error: 'Store profile not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: 'Store settings updated successfully',
        store,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update merchant store error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred updating settings' },
      { status: 500 }
    )
  }
}
