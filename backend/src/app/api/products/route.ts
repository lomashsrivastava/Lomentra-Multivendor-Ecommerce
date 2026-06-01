import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Product from '@/database/models/Product'
import Store from '@/database/models/Store'
import Category from '@/database/models/Category'
import { getDescendants } from '@/services/categoryService'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'
import mongoose from 'mongoose'

/**
 * GET: Retrieve products catalog (Public Route)
 * Supports query parameters:
 *   - storeId: Filter by tenant store
 *   - category: Filter by category ID, slug, or name (hierarchical search)
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('storeId')
    const category = searchParams.get('category')

    const filterQuery: Record<string, unknown> = { status: 'active' }

    if (storeId) {
      filterQuery.storeId = storeId
    }

    if (category) {
      // Find Category document by ID, slug, or name (case-insensitive)
      let categoryDoc = null
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryDoc = await Category.findById(category)
      }
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({
          $or: [
            { slug: category.toLowerCase().trim() },
            { name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } }
          ]
        })
      }

      if (categoryDoc) {
        const descendantIds = await getDescendants(categoryDoc._id as mongoose.Types.ObjectId)
        filterQuery.categoryId = { $in: descendantIds }
      } else {
        filterQuery.category = category.toLowerCase().trim()
      }
    }

    const limitParam = searchParams.get('limit')
    const pageParam = searchParams.get('page')

    let query = Product.find(filterQuery)
      .populate('storeId', 'name slug logoUrl')
      .populate('categoryId', 'name parentId level slug')
      .sort({ createdAt: -1 })

    if (limitParam) {
      const limit = parseInt(limitParam, 10)
      if (!isNaN(limit) && limit > 0) {
        const page = parseInt(pageParam || '1', 10)
        const skip = (page - 1) * limit
        query = query.skip(skip).limit(limit)
      }
    } else {
      query = query.limit(100)
    }

    const products = await query

    // Map category for backward compatibility
    const mappedProducts = products.map((p) => {
      const obj = p.toObject()
      if (p.categoryId && typeof p.categoryId === 'object' && 'name' in p.categoryId) {
        obj.category = (p.categoryId as any).name
      }
      return obj
    })

    return NextResponse.json({ products: mappedProducts }, { status: 200 })
  } catch (error) {
    console.error('Fetch products error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching catalog' },
      { status: 500 }
    )
  }
}

/**
 * POST: Create a new product (Merchant Access only)
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

    // 2. Fetch the store owned by this vendor
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json(
        { error: 'Merchant must create a store before listing products' },
        { status: 400 }
      )
    }

    if (store.status !== 'active') {
      return NextResponse.json({ error: 'Your store is currently suspended' }, { status: 403 })
    }

    // 3. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { name, description, price, categoryId, category, stock, images } = sanitizedBody

    // 4. Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Product description is required' }, { status: 400 })
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 })
    }

    if (!categoryId && (!category || typeof category !== 'string' || category.trim().length === 0)) {
      return NextResponse.json({ error: 'Product category is required' }, { status: 400 })
    }

    let resolvedCategoryId: mongoose.Types.ObjectId | undefined = undefined
    let resolvedCategoryName = ''

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return NextResponse.json({ error: 'Invalid Category ID format' }, { status: 400 })
      }
      const catDoc = await Category.findById(categoryId)
      if (!catDoc) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 })
      }
      resolvedCategoryId = catDoc._id as mongoose.Types.ObjectId
      resolvedCategoryName = catDoc.name
    } else if (category) {
      const catDoc = await Category.findOne({
        $or: [
          { slug: category.toLowerCase().trim() },
          { name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } }
        ]
      })
      if (!catDoc) {
        return NextResponse.json({ error: `Category '${category}' not found` }, { status: 400 })
      }
      resolvedCategoryId = catDoc._id as mongoose.Types.ObjectId
      resolvedCategoryName = catDoc.name
    }

    const cleanStock = stock !== undefined && typeof stock === 'number' && stock >= 0 ? stock : 0

    // 5. Create product
    const product = await Product.create({
      storeId: store._id,
      name: name.trim(),
      description: description.trim(),
      price,
      categoryId: resolvedCategoryId as mongoose.Types.ObjectId,
      category: resolvedCategoryName,
      stock: cleanStock,
      images: Array.isArray(images) ? images : [],
      status: 'active',
    })

    return NextResponse.json(
      {
        message: 'Product listed successfully',
        product,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred listing product' },
      { status: 500 }
    )
  }
}
