import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, requireRole } from '@/middleware/auth'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

/**
 * POST: Upload a product image
 * Accepts multipart form-data with a single 'file' field
 * Saves to public/uploads/ and returns the served URL
 */
export async function POST(req: NextRequest) {
  try {
    let user
    try {
      user = verifyAuth(req)
      requireRole(user, ['vendor', 'admin'])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unauthorized'
      return NextResponse.json({ error: msg }, { status: 401 })
    }

    // Suppress unused variable warning
    void user

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must not exceed 5MB' }, { status: 400 })
    }

    // Create uploads directory if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/${filename}`

    return NextResponse.json(
      { message: 'Image uploaded successfully', imageUrl },
      { status: 201 }
    )
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
