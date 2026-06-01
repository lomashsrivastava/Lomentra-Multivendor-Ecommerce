import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dbConnect from '@/lib/dbConnect'
import User from '@/database/models/User'
import { sanitizeObject } from '@/security/sanitize'

const JWT_SECRET = process.env.JWT_SECRET || 'development_only_secret_key_antigravity_multivendor'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const sanitizedBody = sanitizeObject(body)

    const { name, email, password, role } = sanitizedBody

    // 1. Basic validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    if (!role || (role !== 'customer' && role !== 'vendor')) {
      return NextResponse.json({ error: 'Role must be customer or vendor' }, { status: 400 })
    }

    // 2. Check if user already exists
    const normalizedEmail = email.toLowerCase().trim()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
    }

    // 3. Hash password and save new User
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      status: role === 'vendor' ? 'pending' : 'active', // Vendors need admin approval
    })

    // 4. Generate JWT
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    })

    // 5. Create Response and set secure cookie
    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        token,
      },
      { status: 201 }
    )

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    )
  }
}
