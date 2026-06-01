import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Product from '@/database/models/Product'
import Store from '@/database/models/Store'
import Category from '@/database/models/Category'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'
import mongoose from 'mongoose'

/**
 * GET: Retrieve single product details (Public Route)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params

    const product = await Product.findById(id)
      .populate('storeId', 'name slug logoUrl')
      .populate('categoryId', 'name parentId level slug')
    if (!product || product.status === 'archived') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const obj = product.toObject()
    if (product.categoryId && typeof product.categoryId === 'object' && 'name' in product.categoryId) {
      obj.category = (product.categoryId as any).name
    }

    return NextResponse.json({ product: obj }, { status: 200 })
  } catch (error) {
    console.error('Fetch product by id error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred retrieving product' },
      { status: 500 }
    )
  }
}

/**
 * PUT: Update product details (Store Owner only)
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params

    // 1. Verify merchant authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Fetch merchant store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({ error: 'Merchant store not found' }, { status: 400 })
    }

    // 3. Fetch product
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 4. Verify store ownership
    if (product.storeId.toString() !== store._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this product listing' },
        { status: 403 }
      )
    }

    // 5. Parse and sanitize input
    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { name, description, price, categoryId, category, stock, images, status } = sanitizedBody

    // 6. Validate name if passed
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Product name cannot be empty' }, { status: 400 })
    }

    // 7. Update product data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description.trim()
    if (price !== undefined && typeof price === 'number' && price >= 0) updateData.price = price
    
    if (categoryId !== undefined) {
      if (categoryId) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          return NextResponse.json({ error: 'Invalid Category ID format' }, { status: 400 })
        }
        const catDoc = await Category.findById(categoryId)
        if (!catDoc) {
          return NextResponse.json({ error: 'Category not found' }, { status: 400 })
        }
        updateData.categoryId = catDoc._id
        updateData.category = catDoc.name
      } else {
        return NextResponse.json({ error: 'Category cannot be empty' }, { status: 400 })
      }
    } else if (category !== undefined) {
      const catDoc = await Category.findOne({
        $or: [
          { slug: category.toLowerCase().trim() },
          { name: { $regex: new RegExp(`^${category.trim()}$`, 'i') } }
        ]
      })
      if (!catDoc) {
        return NextResponse.json({ error: `Category '${category}' not found` }, { status: 400 })
      }
      updateData.categoryId = catDoc._id
      updateData.category = catDoc.name
    }

    if (stock !== undefined && typeof stock === 'number' && stock >= 0) updateData.stock = stock
    if (images !== undefined && Array.isArray(images)) updateData.images = images
    if (status !== undefined && ['active', 'draft', 'archived'].includes(status))
      updateData.status = status

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name parentId level slug')

    const obj = updatedProduct ? updatedProduct.toObject() : null
    if (obj && obj.categoryId && typeof obj.categoryId === 'object' && 'name' in obj.categoryId) {
      obj.category = (obj.categoryId as any).name
    }

    return NextResponse.json(
      {
        message: 'Product updated successfully',
        product: obj,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred updating product' },
      { status: 500 }
    )
  }
}

/**
 * DELETE: Delete product listing (Store Owner only)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect()
    const { id } = await params

    // 1. Verify merchant authentication
    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    // 2. Fetch merchant store
    const store = await Store.findOne({ vendorId: decodedUser.userId })
    if (!store) {
      return NextResponse.json({ error: 'Merchant store not found' }, { status: 400 })
    }

    // 3. Fetch product
    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 4. Verify store ownership
    if (product.storeId.toString() !== store._id.toString()) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this product listing' },
        { status: 403 }
      )
    }

    // 5. Delete product document
    await Product.findByIdAndDelete(id)

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred deleting product' },
      { status: 500 }
    )
  }
}
