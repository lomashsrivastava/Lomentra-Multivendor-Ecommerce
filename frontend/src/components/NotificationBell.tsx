import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationItem {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { user, token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/notifications?limit=15', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [token])

  // Poll for notifications every 30 seconds
  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    if (!token) return
    setLoading(true)
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all read:', err)
    } finally {
      setLoading(false)
    }
  }

  const markOneRead = async (id: string) => {
    if (!token) return
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [id] }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order_placed':
        return 'bg-violet-500/10 text-violet-500'
      case 'order_shipped':
        return 'bg-emerald-500/10 text-emerald-500'
      case 'review_received':
        return 'bg-amber-500/10 text-amber-500'
      case 'store_approved':
        return 'bg-blue-500/10 text-blue-500'
      case 'payout_sent':
        return 'bg-green-500/10 text-green-500'
      default:
        return 'bg-zinc-500/10 text-zinc-500'
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen((p) => !p)
          if (!isOpen) fetchNotifications()
        }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (!n.isRead) markOneRead(n._id)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${getTypeColor(n.type)}`}
                      >
                        {!n.isRead ? '●' : <Check className="h-3 w-3" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[9px] text-muted-foreground/70 mt-1">
                          {getTimeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
