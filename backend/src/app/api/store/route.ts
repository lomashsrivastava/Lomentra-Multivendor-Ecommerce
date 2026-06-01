import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Store from '@/database/models/Store'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

// Regex to validate alphanumeric and dashes in slug (lowercase enforced by schema)
const SLUG_REGEX = /^[a-z0-9-]+$/

/**
 * GET: Retrieve store profile by slug (Public Route)
 * Example: GET /api/store?slug=boutique-shop
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }

    const store = await Store.findOne({ slug: slug.toLowerCase().trim(), status: 'active' })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    return NextResponse.json({ store }, { status: 200 })
  } catch (error) {
    console.error('Fetch store by slug error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred retrieving store' },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new Store (Merchant Access only)
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // 1. Verify merchant authentication & roles
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
    const { name, slug, description, logoUrl, bannerUrl } = sanitizedBody

    // 3. Validation checks
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Store slug is required' }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim()
    if (!SLUG_REGEX.test(cleanSlug)) {
      return NextResponse.json(
        { error: 'Slug must contain only lowercase letters, numbers, and dashes (-)' },
        { status: 400 }
      )
    }

    // 4. Verify vendor does not already own a store (1 store per vendor limit)
    const existingVendorStore = await Store.findOne({ vendorId: decodedUser.userId })
    if (existingVendorStore) {
      return NextResponse.json(
        { error: 'You are already registered to a shop storefront' },
        { status: 400 }
      )
    }

    // 5. Verify slug uniqueness
    const existingSlugStore = await Store.findOne({ slug: cleanSlug })
    if (existingSlugStore) {
      return NextResponse.json(
        { error: 'This slug/subdomain is already taken by another store' },
        { status: 400 }
      )
    }

    // 6. Create the store
    const store = await Store.create({
      vendorId: decodedUser.userId,
      name: name.trim(),
      slug: cleanSlug,
      description: description?.trim() || '',
      logoUrl: logoUrl?.trim() || '',
      bannerUrl: bannerUrl?.trim() || '',
      status: 'active',
    })

    return NextResponse.json(
      {
        message: 'Storefront created successfully',
        store,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Store creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during store creation' },
      { status: 500 }
    )
  }
}
