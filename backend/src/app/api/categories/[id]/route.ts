import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Category from '@/database/models/Category'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { sanitizeObject } from '@/security/sanitize'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)
    const { name, parentId, level, image, icon, description, seoTitle, seoDescription, sortOrder, isFeatured, isActive } = sanitizedBody

    const category = await Category.findById(id)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) {
      updateData.name = name.trim()
      updateData.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    if (parentId !== undefined) updateData.parentId = parentId ? parentId : null
    if (level !== undefined) updateData.level = parseInt(level, 10)
    if (image !== undefined) updateData.image = image
    if (icon !== undefined) updateData.icon = icon
    if (description !== undefined) updateData.description = description
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription
    if (sortOrder !== undefined) updateData.sortOrder = parseInt(sortOrder, 10)
    if (isFeatured !== undefined) updateData.isFeatured = !!isFeatured
    if (isActive !== undefined) updateData.isActive = !!isActive

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    return NextResponse.json(
      {
        message: 'Category updated successfully',
        category: updatedCategory,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred updating category' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()
    const { id } = await params

    let decodedUser
    try {
      decodedUser = verifyAuth(req)
      requireRole(decodedUser, ['vendor', 'admin'])
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Unauthorized'
      return NextResponse.json({ error: message }, { status: 401 })
    }

    const category = await Category.findById(id)
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Soft delete
    category.isActive = false
    await category.save()

    return NextResponse.json({ message: 'Category deactivated successfully' }, { status: 200 })
  } catch (error) {
    console.error('Deactivate category error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred deactivating category' },
      { status: 500 }
    )
  }
}
