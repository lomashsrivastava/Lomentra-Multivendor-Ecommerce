import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Product from '@/database/models/Product'
import Store from '@/database/models/Store'

/**
 * GET: Global search across products and stores
 * Query: ?q=keyword&type=products|stores|all&limit=10
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const type = searchParams.get('type') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 30)

    if (!q || q.length < 2) {
      return NextResponse.json({ products: [], stores: [] }, { status: 200 })
    }

    const regex = new RegExp(q, 'i')
    const results: { products: unknown[]; stores: unknown[] } = { products: [], stores: [] }

    if (type === 'all' || type === 'products') {
      results.products = await Product.find({
        status: 'active',
        $or: [
          { name: regex },
          { description: regex },
          { category: regex },
        ],
      })
        .populate('storeId', 'name slug logoUrl')
        .sort({ createdAt: -1 })
        .limit(limit)
    }

    if (type === 'all' || type === 'stores') {
      results.stores = await Store.find({
        status: 'active',
        $or: [
          { name: regex },
          { description: regex },
          { slug: regex },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
