import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import mongoose from 'mongoose'
import { rateLimiter } from '@/middleware/rateLimiter'

export async function GET(req: NextRequest) {
  const limit = rateLimiter(req)
  if (limit.isBlocked && limit.response) {
    return limit.response
  }

  try {
    await dbConnect()

    const dbState = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    }

    const isConnected = dbState === 1

    return NextResponse.json(
      {
        status: isConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: {
          status: states[dbState as keyof typeof states] || 'unknown',
          readyState: dbState,
        },
      },
      {
        status: isConnected ? 200 : 503,
        headers: limit.headers,
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      {
        status: 500,
        headers: limit.headers,
      }
    )
  }
}
