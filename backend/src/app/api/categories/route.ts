import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Category from '@/database/models/Category'
import { verifyAuth, requireRole } from '@/middleware/auth'
import { buildTree } from '@/services/categoryService'
import { sanitizeObject } from '@/security/sanitize'

export async function GET(req: NextRequest) {
  try {
    await dbConnect()
    const { searchParams } = new URL(req.url)
    const tree = searchParams.get('tree') === 'true'
    const featured = searchParams.get('featured') === 'true'
    const level = searchParams.get('level')

    if (tree) {
      const categoriesTree = await buildTree()
      return NextResponse.json({ categories: categoriesTree }, { status: 200 })
    }

    const query: Record<string, any> = { isActive: true }
    if (featured) {
      query.isFeatured = true
    }
    if (level) {
      query.level = parseInt(level, 10)
    }

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 })
    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred fetching categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

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
    const { name, parentId, level, image, icon, description, seoTitle, seoDescription, sortOrder, isFeatured } = sanitizedBody

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    const newCategory = await Category.create({
      name: name.trim(),
      slug,
      parentId: parentId ? parentId : null,
      level: level ? parseInt(level, 10) : 1,
      image,
      icon,
      description,
      seoTitle,
      seoDescription,
      sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
      isFeatured: !!isFeatured,
      isActive: true,
    })

    return NextResponse.json(
      {
        message: 'Category created successfully',
        category: newCategory,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred creating category' },
      { status: 500 }
    )
  }
}
