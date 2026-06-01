import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import Notification from '@/database/models/Notification'
import { verifyAuth } from '@/middleware/auth'

/**
 * GET: Fetch notifications for the authenticated user
 * Query: ?limit=20&unreadOnly=true
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    let user
    try {
      user = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const filter: Record<string, unknown> = { userId: user.userId }
    if (unreadOnly) filter.isRead = false

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)

    const unreadCount = await Notification.countDocuments({
      userId: user.userId,
      isRead: false,
    })

    return NextResponse.json({ notifications, unreadCount }, { status: 200 })
  } catch (error) {
    console.error('Notification fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

/**
 * PUT: Mark notification(s) as read
 * Body: { ids: string[] } or { markAllRead: true }
 */
export async function PUT(req: NextRequest) {
  try {
    await dbConnect()

    let user
    try {
      user = verifyAuth(req)
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { ids, markAllRead } = body

    if (markAllRead) {
      await Notification.updateMany(
        { userId: user.userId, isRead: false },
        { $set: { isRead: true } }
      )
      return NextResponse.json({ message: 'All notifications marked as read' }, { status: 200 })
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    await Notification.updateMany(
      { _id: { $in: ids }, userId: user.userId },
      { $set: { isRead: true } }
    )

    return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

/**
 * POST: Create a notification (internal use by other API routes)
 * Body: { userId, type, title, message, link? }
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const body = await req.json()
    const { userId, type, title, message, link } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link,
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
