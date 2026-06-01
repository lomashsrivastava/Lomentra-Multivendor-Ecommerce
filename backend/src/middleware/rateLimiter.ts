import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes window
const MAX_REQUESTS = 100 // max 100 requests per window

export function rateLimiter(req: NextRequest) {
  // Retrieve connection client IP
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
  const now = Date.now()

  let record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + WINDOW_MS,
    }
  }

  record.count++
  rateLimitMap.set(ip, record)

  const remaining = Math.max(0, MAX_REQUESTS - record.count)
  const headers = {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(record.resetTime / 1000)),
  }

  if (record.count > MAX_REQUESTS) {
    return {
      isBlocked: true,
      response: NextResponse.json(
        {
          error: 'Too many requests, please try again later.',
        },
        {
          status: 429,
          headers,
        }
      ),
    }
  }

  return {
    isBlocked: false,
    headers,
  }
}
