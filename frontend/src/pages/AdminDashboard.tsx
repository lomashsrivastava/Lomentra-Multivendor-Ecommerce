import { useEffect, useState, useCallback } from 'react'
import {
  Shield,
  BadgePercent,
  Landmark,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Grid,
  Wallet,
  ShoppingCart,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { RevenueLineChart, CategoryPieChart } from '@/components/DashboardCharts'

interface LedgerEntry {
  _id: string
  orderId: {
    _id: string
    parentOrderId: string
    subtotal: number
  } | null
  storeId: {
    _id: string
    name: string
    slug: string
  } | null
  totalAmount: number
  platformFee: number
  merchantShare: number
  payoutStatus: 'pending' | 'paid'
  createdAt: string
}

interface AdminOrder {
  _id: string
  parentOrderId: string
  customerId: {
    _id: string
    name: string
    email: string
  } | null
  storeId: {
    _id: string
    name: string
    slug: string
  } | null
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  paymentStatus: string
  fulfillmentStatus: string
  createdAt: string
}

interface PayoutRecord {
  _id: string
  amount: number
  status: 'pending' | 'paid' | 'rejected'
  createdAt: string
  note?: string
  storeId: {
    _id: string
    name: string
    slug: string
  } | null
  vendorId: {
    _id: string
    email: string
  } | null
}

export function AdminDashboard() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'payouts' | 'orders'>('overview')

  const [ledgerMetrics, setLedgerMetrics] = useState({
    totalGMV: 0,
    totalPlatformFees: 0,
    totalMerchantShare: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
  })

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [payoutRequests, setPayoutRequests] = useState<PayoutRecord[]>([])

  const [isLoadingLedger, setIsLoadingLedger] = useState(true)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(true)
  const [isProcessingPayout, setIsProcessingPayout] = useState<string | null>(null)
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Analytics states
  const [analytics, setAnalytics] = useState<any>(null)

  const fetchLedger = useCallback(async () => {
    if (!token) return
    setIsLoadingLedger(true)
    try {
      const res = await fetch('/api/admin/ledger', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setLedgerEntries(data.ledger || [])
        setLedgerMetrics(data.metrics || {
          totalGMV: 0,
          totalPlatformFees: 0,
          totalMerchantShare: 0,
          pendingPayouts: 0,
          paidPayouts: 0,
        })
      } else {
        setError(data.error || 'Failed to load platform ledger stats')
      }
    } catch (err) {
      console.error(err)
      setError('Network failure loading ledger data')
    } finally {
      setIsLoadingLedger(false)
    }
  }, [token])

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setIsLoadingOrders(true)
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setOrders(data.orders || [])
      } else {
        setError(data.error || 'Failed to load platform orders')
      }
    } catch (err) {
      console.error(err)
      setError('Network failure loading orders data')
    } finally {
      setIsLoadingOrders(false)
    }
  }, [token])

  const fetchPayoutRequests = useCallback(async () => {
    if (!token) return
    setIsLoadingPayouts(true)
    try {
      const res = await fetch('/api/payouts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setPayoutRequests(data.payouts || [])
      }
    } catch (err) {
      console.error('Failed to fetch payouts:', err)
    } finally {
      setIsLoadingPayouts(false)
    }
  }, [token])

  const fetchAnalytics = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/analytics/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err)
    }
  }, [token])

  useEffect(() => {
    fetchLedger()
    fetchOrders()
    fetchPayoutRequests()
    fetchAnalytics()
  }, [fetchLedger, fetchOrders, fetchPayoutRequests, fetchAnalytics])

  const handleDisbursePayout = async (ledgerId: string) => {
    if (!token) return
    setIsProcessingPayout(ledgerId)
    try {
      const res = await fetch('/api/admin/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ledgerId }),
      })
      if (res.ok) {
        await fetchLedger()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to disburse payout')
      }
    } catch (err) {
      console.error(err)
      alert('Network error releasing merchant payout')
    } finally {
      setIsProcessingPayout(null)
    }
  }

  const handleDisburseAll = async () => {
    if (!token) return
    if (!confirm('Are you sure you want to disburse ALL pending vendor payouts?')) return
    setIsProcessingPayout('all')
    try {
      const res = await fetch('/api/admin/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        await fetchLedger()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to disburse all payouts')
      }
    } catch (err) {
      console.error(err)
      alert('Network error releasing all payouts')
    } finally {
      setIsProcessingPayout(null)
    }
  }

  // Handle Approve/Reject Withdrawal Request
  const handleUpdateWithdrawalStatus = async (payoutId: string, status: 'paid' | 'rejected') => {
    if (!token) return
    let note = ''
    if (status === 'rejected') {
      const promptVal = window.prompt('Please enter a rejection reason note:')
      if (promptVal === null) return // user cancelled prompt
      note = promptVal.trim()
    } else {
      if (!confirm('Approve and process this withdrawal transfer?')) return
    }

    setIsProcessingRequest(payoutId)
    try {
      const res = await fetch('/api/payouts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payoutId, status, note }),
      })
      if (res.ok) {
        await fetchPayoutRequests()
        await fetchLedger()
        await fetchAnalytics()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update withdrawal request')
      }
    } catch (err) {
      console.error(err)
      alert('Network error updating withdrawal request')
    } finally {
      setIsProcessingRequest(null)
    }
  }

  const stats = [
    {
      label: 'Gross Merchandise Value (GMV)',
      value: `$${ledgerMetrics.totalGMV.toFixed(2)}`,
      desc: 'System-wide sales',
      icon: BadgePercent,
      color: 'text-violet-500 bg-violet-500/10 border border-violet-500/20',
    },
    {
      label: 'Accumulated Platform Fees',
      value: `$${ledgerMetrics.totalPlatformFees.toFixed(2)}`,
      desc: '10% marketplace commission share',
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20',
    },
    {
      label: 'Pending Vendor Disbursements',
      value: `$${ledgerMetrics.pendingPayouts.toFixed(2)}`,
      desc: 'Awaiting disbursement payouts',
      icon: Landmark,
      color: 'text-amber-500 bg-amber-500/10 border border-amber-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Platform Master Console
          </h2>
          <p className="text-xs text-muted-foreground">
            Audit network gross merchandise value (GMV), platform fee shares, and release vendor settlements.
          </p>
        </div>
        {ledgerMetrics.pendingPayouts > 0 && (
          <button
            type="button"
            onClick={handleDisburseAll}
            disabled={isProcessingPayout !== null}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-4 text-xs font-semibold shadow transition-colors gap-1.5 disabled:opacity-50"
          >
            {isProcessingPayout === 'all' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Settling Payouts...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Settle All Pending Payouts
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs font-bold text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-border overflow-x-auto gap-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Grid className="h-4 w-4" />
          System Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payouts')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'payouts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="h-4 w-4" />
          Settlements & Withdrawals ({payoutRequests.filter((pr) => pr.status === 'pending').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Global Orders ({orders.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* TAB 1: SYSTEM OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Platform Line Chart & Donut Layout */}
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <RevenueLineChart
                    data={analytics.charts?.platformRevenueOverTime?.map((d: any) => ({
                      month: d.month,
                      revenue: d.revenue, // maps GMV
                    })) || []}
                  />
                </div>
                <div className="lg:col-span-1 flex">
                  <CategoryPieChart data={analytics.charts?.categoryGMV || []} />
                </div>
              </div>
            )}

            {/* Global Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-extrabold tracking-tight">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
                    </div>
                  </div>
                )
              })}
            </section>
          </div>
        )}

        {/* TAB 2: SETTLEMENTS & WITHDRAWALS */}
        {activeTab === 'payouts' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Withdrawal Queue */}
            <div className="lg:col-span-2 space-y-6">
              {/* Withdrawal Requests Queue */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Pending Withdrawal Queue</h3>
                  <p className="text-[10px] text-muted-foreground">Merchant disbursement requests awaiting authorization approval</p>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingPayouts ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : payoutRequests.filter((pr) => pr.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                      No withdrawal requests in queue.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold">
                          <th className="py-2 pr-2">Store / Email</th>
                          <th className="py-2 px-2 text-right">Amount</th>
                          <th className="py-2 px-2">Requested</th>
                          <th className="py-2 pl-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 text-foreground">
                        {payoutRequests
                          .filter((pr) => pr.status === 'pending')
                          .map((pr) => (
                            <tr key={pr._id}>
                              <td className="py-2.5 pr-2">
                                <div className="font-bold">{pr.storeId?.name || 'Unknown Store'}</div>
                                <div className="text-[9px] text-muted-foreground">{pr.vendorId?.email}</div>
                              </td>
                              <td className="py-2.5 px-2 text-right font-extrabold text-foreground">
                                ${pr.amount.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2 text-muted-foreground">
                                {new Date(pr.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 pl-2 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWithdrawalStatus(pr._id, 'paid')}
                                  disabled={isProcessingRequest !== null}
                                  className="inline-flex h-6 items-center justify-center rounded bg-emerald-500 hover:bg-emerald-600 text-white px-2 text-[8px] font-bold transition-colors disabled:opacity-50"
                                >
                                  {isProcessingRequest === pr._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Approve & Pay'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWithdrawalStatus(pr._id, 'rejected')}
                                  disabled={isProcessingRequest !== null}
                                  className="inline-flex h-6 items-center justify-center rounded border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-2 text-[8px] font-bold transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Stripe Split Ledger Splits */}
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Platform Split Ledgers</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Audit Stripe split accounts payouts per merchant</p>
                </div>

                <div className="overflow-x-auto">
                  {isLoadingLedger ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : ledgerEntries.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      No split payment transactions recorded.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold">
                          <th className="py-2.5 pr-2">Store</th>
                          <th className="py-2.5 px-2 text-right">Gross Sales</th>
                          <th className="py-2.5 px-2 text-right">Fee (10%)</th>
                          <th className="py-2.5 px-2 text-right">Vendor (90%)</th>
                          <th className="py-2.5 px-2 text-center">Status</th>
                          <th className="py-2.5 pl-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 font-medium">
                        {ledgerEntries.map((entry) => (
                          <tr key={entry._id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-2">
                              <div className="font-bold text-foreground truncate max-w-[100px]">
                                {entry.storeId?.name || 'Unknown Store'}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-right">${entry.totalAmount.toFixed(2)}</td>
                            <td className="py-2.5 px-2 text-right text-rose-500">-${entry.platformFee.toFixed(2)}</td>
                            <td className="py-2.5 px-2 text-right text-emerald-500 font-bold">
                              ${entry.merchantShare.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                                entry.payoutStatus === 'paid'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              }`}>
                                {entry.payoutStatus}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 text-right">
                              {entry.payoutStatus === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDisbursePayout(entry._id)}
                                  disabled={isProcessingPayout !== null}
                                  className="inline-flex h-6 items-center justify-center rounded bg-emerald-500 hover:bg-emerald-600 text-white px-2 text-[8px] font-bold tracking-wide transition-colors disabled:opacity-50"
                                >
                                  {isProcessingPayout === entry._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    'Disburse'
                                  )}
                                </button>
                              ) : (
                                <span className="text-[8px] text-muted-foreground font-semibold flex items-center justify-end gap-1">
                                  <CheckCircle className="h-3 w-3 text-emerald-500" /> Settled
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Historical Payout Logs */}
            <div className="lg:col-span-1">
              <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Processed Transfers Log
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Historical records of paid or rejected transfers</p>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {payoutRequests.filter((pr) => pr.status !== 'pending').length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No past processed logs</p>
                  ) : (
                    payoutRequests
                      .filter((pr) => pr.status !== 'pending')
                      .map((pr) => (
                        <div key={pr._id} className="p-3 border border-border/60 rounded-lg space-y-2 bg-muted/10 text-[10px]">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-foreground">{pr.storeId?.name}</span>
                              <p className="text-[9px] text-muted-foreground">{new Date(pr.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className="font-bold text-foreground">${pr.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                              pr.status === 'paid'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            }`}>
                              {pr.status === 'paid' ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                              {pr.status}
                            </span>
                            {pr.note && <span className="text-[9px] text-muted-foreground italic truncate max-w-[120px]">Note: {pr.note}</span>}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GLOBAL ORDERS */}
        {activeTab === 'orders' && (
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Global Customer Orders</h3>
                <p className="text-[10px] text-muted-foreground">Monitor all checkouts and shipping statuses</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingOrders ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No orders placed in the system yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[10px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="py-2.5 pr-2">Parent Order</th>
                      <th className="py-2.5 px-2">Store / Customer</th>
                      <th className="py-2.5 px-2 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center">Payment</th>
                      <th className="py-2.5 pl-2 text-center">Shipping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-2">
                          <code className="font-mono text-[9px] font-bold text-primary block truncate max-w-[80px]">
                            {order.parentOrderId}
                          </code>
                          <span className="text-[8px] text-muted-foreground block">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-foreground truncate max-w-[120px]">
                            {order.storeId?.name || 'Unknown Store'}
                          </div>
                          <div className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                            {order.customerId?.name || 'Guest Customer'}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-foreground">
                          ${order.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wide ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 text-center">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wide ${
                            order.fulfillmentStatus === 'delivered'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                              : order.fulfillmentStatus === 'shipped'
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          }`}>
                            {order.fulfillmentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
