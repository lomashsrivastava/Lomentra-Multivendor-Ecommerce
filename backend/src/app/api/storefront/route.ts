import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Store from '@/database/models/Store'
import Product from '@/database/models/Product'
import Review from '@/database/models/Review'

/**
 * GET: Public storefront data for a given store slug
 * Query: ?slug=my-store&page=1&limit=12&category=&sort=newest
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'newest'

    if (!slug) {
      return NextResponse.json({ error: 'Store slug is required' }, { status: 400 })
    }

    const store = await Store.findOne({ slug, status: 'active' })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Build product filter
    const productFilter: Record<string, unknown> = {
      storeId: store._id,
      status: 'active',
    }
    if (category) {
      productFilter.category = category.toLowerCase().trim()
    }

    // Build sort option
    let sortOption: Record<string, 1 | -1> = { createdAt: -1 }
    if (sort === 'price_asc') sortOption = { price: 1 }
    else if (sort === 'price_desc') sortOption = { price: -1 }
    else if (sort === 'name') sortOption = { name: 1 }

    const skip = (page - 1) * limit
    const [products, totalProducts] = await Promise.all([
      Product.find(productFilter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(productFilter),
    ])

    // Get unique categories for filter dropdown
    const categories = await Product.distinct('category', {
      storeId: store._id,
      status: 'active',
    })

    // Average rating across all store reviews
    const reviewAgg = await Review.aggregate([
      { $match: { storeId: store._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])

    const avgRating = reviewAgg[0]?.avg || 0
    const reviewCount = reviewAgg[0]?.count || 0

    return NextResponse.json(
      {
        store: {
          _id: store._id,
          name: store.name,
          slug: store.slug,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount,
          totalProducts,
        },
        products,
        categories,
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages: Math.ceil(totalProducts / limit),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Storefront fetch error:', error)
    return NextResponse.json({ error: 'Failed to load storefront' }, { status: 500 })
  }
}
