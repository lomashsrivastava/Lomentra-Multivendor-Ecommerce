import { useEffect, useState } from 'react'
import { Package, MapPin, Calendar, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface StoreInfo {
  _id: string
  name: string
  slug: string
  logoUrl?: string
}

interface ChildOrder {
  _id: string
  parentOrderId: string
  customerId: string
  storeId: StoreInfo
  items: OrderItem[]
  subtotal: number
  paymentStatus: 'pending' | 'paid' | 'failed'
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

interface GroupedOrder {
  parentOrderId: string
  createdAt: string
  shippingAddress: any
  totalAmount: number
  childOrders: ChildOrder[]
  isOpen: boolean
}

export default function CustomerOrders() {
  const { currency, token } = useAuth()
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [token])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/orders/my', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (res.ok) {
        groupOrders(data.orders || [])
      } else {
        setError(data.error || 'Failed to fetch orders')
      }
    } catch (err) {
      console.error(err)
      setError('A network error occurred fetching orders.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return

    try {
      setCancellingId(orderId)
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        await fetchOrders()
      } else {
        alert(data.error || 'Failed to cancel order')
      }
    } catch (err) {
      console.error(err)
      alert('A network error occurred while cancelling your order.')
    } finally {
      setCancellingId(null)
    }
  }

  const groupOrders = (rawOrders: ChildOrder[]) => {
    const groups: { [key: string]: GroupedOrder } = {}

    rawOrders.forEach((order) => {
      const parentId = order.parentOrderId
      if (!groups[parentId]) {
        groups[parentId] = {
          parentOrderId: parentId,
          createdAt: order.createdAt,
          shippingAddress: order.shippingAddress,
          totalAmount: 0,
          childOrders: [],
          isOpen: true,
        }
      }
      groups[parentId].childOrders.push(order)
      groups[parentId].totalAmount += order.subtotal
    })

    // Sort parent orders by date (newest first)
    const sortedGroups = Object.values(groups).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    setGroupedOrders(sortedGroups)
  }

  const toggleGroup = (parentOrderId: string) => {
    setGroupedOrders((prev) =>
      prev.map((g) => (g.parentOrderId === parentOrderId ? { ...g, isOpen: !g.isOpen } : g))
    )
  }

  const getDynamicStatus = (createdAtStr: string, databaseStatus: string) => {
    if (databaseStatus === 'cancelled') {
      return { step: -1, statusText: 'Cancelled', daysRemaining: 0 }
    }

    const createdDate = new Date(createdAtStr)
    const currentDate = new Date()
    const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Day 0: Ordered (step 1)
    // Day 1-2: Processing (step 2)
    // Day 3-5: Shipped (step 3)
    // Day 6+: Delivered (step 4)
    if (diffDays === 0) {
      return { step: 1, statusText: 'Ordered', daysRemaining: 7 }
    } else if (diffDays <= 2) {
      return { step: 2, statusText: 'Processing', daysRemaining: 7 - diffDays }
    } else if (diffDays <= 5) {
      return { step: 3, statusText: 'Shipped', daysRemaining: 7 - diffDays }
    } else {
      return { step: 4, statusText: 'Delivered', daysRemaining: 0 }
    }
  }

  const getTimelineEvents = (createdAtStr: string, step: number) => {
    const createdDate = new Date(createdAtStr)
    
    const formatDate = (daysToAdd: number) => {
      const d = new Date(createdDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return [
      {
        title: 'Order Confirmed',
        date: formatDate(0),
        desc: 'Payment received. Order routed to vendor store.',
        completed: step >= 1,
        active: step === 1,
      },
      {
        title: 'Processing Order',
        date: formatDate(1),
        desc: 'Vendor is preparing items and checking specifications.',
        completed: step >= 2,
        active: step === 2,
      },
      {
        title: 'Shipped & In Transit',
        date: formatDate(3),
        desc: 'Carrier picked up package. Out of store facility.',
        completed: step >= 3,
        active: step === 3,
      },
      {
        title: 'Delivered',
        date: formatDate(7),
        desc: 'Courier delivered order package to your shipping address.',
        completed: step >= 4,
        active: step === 4,
      },
    ]
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading your purchases...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          My Orders & Shipment Tracking
        </h1>
        <p className="text-xs text-muted-foreground">
          Track packages, view receipts, and audit multi-vendor shipment statuses.
        </p>
      </div>

      {error && (
        <div className="p-3 text-xs font-bold text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20">
          {error}
        </div>
      )}

      {groupedOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card space-y-4">
          <Package className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No purchases yet</h3>
            <p className="text-xs text-muted-foreground">
              Once you checkout items from stores, they will be listed here.
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = '/'
            }}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow animate-pulse"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedOrders.map((group) => {
            const formattedDate = new Date(group.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={group.parentOrderId}
                className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
              >
                {/* Parent Order Header Banner */}
                <div
                  onClick={() => toggleGroup(group.parentOrderId)}
                  className="bg-muted/40 p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-muted/65 transition-colors"
                >
                  <div className="space-y-1">
                    <span className="inline-block text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Master Checkout Invoice
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold text-foreground">
                        {group.parentOrderId}
                      </code>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-muted-foreground">Aggregate Total</p>
                      <p className="text-sm font-black text-foreground">
                        {formatPrice(group.totalAmount, currency)}
                      </p>
                    </div>
                    {group.isOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {group.isOpen && (
                  <div className="p-4 sm:p-6 space-y-6">
                    {/* Shipping Address Summary */}
                    <div className="flex gap-2 text-[11px] text-muted-foreground bg-muted/20 border border-border/60 p-3 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground mr-1">Shipping To:</span>
                        {group.shippingAddress.street}, {group.shippingAddress.city},{' '}
                        {group.shippingAddress.state} {group.shippingAddress.zipCode},{' '}
                        {group.shippingAddress.country}
                      </div>
                    </div>

                    {/* Child Packages List */}
                    <div className="space-y-6">
                      {group.childOrders.map((child) => {
                        const { step, daysRemaining } = getDynamicStatus(child.createdAt, child.fulfillmentStatus)
                        const storeName = child.storeId?.name || 'Unknown Store'
                        const timelineEvents = getTimelineEvents(child.createdAt, step)

                        return (
                          <div
                            key={child._id}
                            className="border border-border/80 rounded-lg overflow-hidden"
                          >
                            {/* Vendor Sub-header */}
                            <div className="bg-muted/10 p-3 border-b border-border/60 flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                {child.storeId?.logoUrl ? (
                                  <img
                                    src={child.storeId.logoUrl}
                                    alt={storeName}
                                    className="h-5 w-5 rounded object-cover border border-border"
                                  />
                                ) : (
                                  <div className="h-5 w-5 bg-primary/10 text-primary flex items-center justify-center font-black rounded text-[9px]">
                                    S
                                  </div>
                                )}
                                <span className="font-bold text-foreground">
                                  {storeName}
                                </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Sub-order ID:{' '}
                                <code className="font-mono text-foreground">{child._id}</code>
                              </div>
                            </div>

                            {/* Sub-order Items List */}
                            <div className="p-4 divide-y divide-border/40">
                              {child.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 first:pt-0 last:pb-0">
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Qty: {item.quantity} × {formatPrice(item.price, currency)}
                                    </p>
                                  </div>
                                  <span className="text-xs font-extrabold text-foreground shrink-0">
                                    {formatPrice(item.price * item.quantity, currency)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* visual Shipment Stepper Progress */}
                            <div className="bg-muted/10 border-t border-border/50 p-4 space-y-4">
                              <div className="flex justify-between items-center">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                                  Shipment Delivery Status
                                </p>
                                <div className="flex items-center gap-2">
                                  {step !== -1 && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                                      {step === 4 ? 'Delivered' : `Estimated Arrival: In ${daysRemaining} days (Max 7 Days)`}
                                    </span>
                                  )}
                                  {step !== -1 && step < 3 && child.fulfillmentStatus !== 'cancelled' && (
                                    <button
                                      onClick={() => handleCancelOrder(child._id)}
                                      disabled={cancellingId === child._id}
                                      className="text-[10px] font-black text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-0.5 rounded-full transition-all border border-rose-500/20 cursor-pointer disabled:opacity-50"
                                    >
                                      {cancellingId === child._id ? 'Cancelling...' : 'Cancel Order'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {step === -1 ? (
                                <div className="text-xs font-bold text-rose-500 bg-rose-500/10 rounded border border-rose-500/20 p-2 text-center">
                                  This sub-order package has been cancelled.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {/* Visual Stepper */}
                                  <div className="relative flex justify-between items-center w-full max-w-lg mx-auto py-2">
                                    {/* Line Background */}
                                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10 animate-pulse" />
                                    <div
                                      className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300 -z-10"
                                      style={{
                                        width: `${((Math.max(1, step) - 1) / 3) * 100}%`,
                                      }}
                                    />

                                    {/* Steps */}
                                    {timelineEvents.map((event, idx) => {
                                      const isDone = step >= idx + 1
                                      return (
                                        <div key={idx} className="flex flex-col items-center">
                                          <div
                                            className={`h-7 w-7 rounded-full flex items-center justify-center border-2 text-[10px] font-bold transition-all ${
                                              idx + 1 === 4 && step === 4
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
                                                : isDone
                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                                                : 'bg-card border-border text-muted-foreground'
                                            }`}
                                          >
                                            {idx === 3 && step === 4 ? '✓' : idx + 1}
                                          </div>
                                          <span
                                            className={`text-[9px] font-semibold mt-1.5 ${
                                              isDone ? 'text-foreground' : 'text-muted-foreground'
                                            }`}
                                          >
                                            {event.title}
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>

                                  {/* Detailed Timeline Events */}
                                  <div className="border-t border-border/40 pt-4 space-y-3 max-w-md mx-auto">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
                                      Detailed Tracking Timeline Log
                                    </p>
                                    <div className="relative border-l border-border/80 pl-4 ml-2 space-y-4">
                                      {timelineEvents.map((event, idx) => (
                                        <div key={idx} className="relative">
                                          {/* Bullet Point */}
                                          <div
                                            className={`absolute -left-[20.5px] top-1 h-3 w-3 rounded-full border ${
                                              event.completed
                                                ? 'bg-primary border-primary'
                                                : 'bg-muted border-border'
                                            }`}
                                          />
                                          <div className="space-y-0.5">
                                            <div className="flex justify-between items-center">
                                              <h5 className={`text-[10px] font-bold ${event.completed ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                                {event.title}
                                              </h5>
                                              <span className="text-[9px] text-muted-foreground">{event.date}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground leading-normal">
                                              {event.desc}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
