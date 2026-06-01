import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/jwtSecret'

export interface DecodedUser {
  userId: string
  email: string
  role: 'admin' | 'vendor' | 'customer'
}

/**
 * Extracts and verifies the JWT token from the NextRequest headers or cookies.
 * Throws an error if authentication fails.
 */
export function verifyAuth(req: NextRequest): DecodedUser {
  let token: string | null = null

  // 1. Check Authorization Header (Bearer <token>)
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // 2. Fallback: Check for 'token' Cookie
  if (!token) {
    const cookieToken = req.cookies.get('token')
    if (cookieToken) {
      token = cookieToken.value
    }
  }

  if (!token) {
    throw new Error('Authentication token is missing')
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser
    if (!decoded.userId || !decoded.role || !decoded.email) {
      throw new Error('Invalid token structure')
    }
    return decoded
  } catch {
    throw new Error('Authentication token is invalid or expired')
  }
}

/**
 * Validates if the authenticated user has one of the allowed roles.
 * Throws an error if role validation fails.
 */
export function requireRole(user: DecodedUser, allowedRoles: ('admin' | 'vendor' | 'customer')[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: Role '${user.role}' does not have permission to access this resource`
    )
  }
}
