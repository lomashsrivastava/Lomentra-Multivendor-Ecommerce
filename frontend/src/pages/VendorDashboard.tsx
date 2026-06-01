import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Store as StoreIcon,
  Loader2,
  AlertCircle,
  Edit,
  Globe,
  Settings,
  X,
  Sparkles,
  Plus,
  Trash2,
  Tag,
  Gift,
  Wallet,
  Calendar,
  CheckCircle2,
  Grid,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AIProductFormAssistant from '@/components/AIProductFormAssistant'
import { RevenueLineChart, CategoryPieChart, RatingBarChart } from '@/components/DashboardCharts'
import ImageUploader from '@/components/ImageUploader'

interface StoreProfile {
  _id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  status: string
}

interface ProductItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  images: string[]
  status: 'active' | 'draft' | 'archived'
  createdAt: string
}

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface OrderRecord {
  _id: string
  parentOrderId: string
  customerId: {
    _id: string
    name: string
    email: string
  }
  storeId: string
  items: OrderItem[]
  subtotal: number
  paymentStatus: string
  fulfillmentStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
}

interface CouponRecord {
  _id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderValue: number
  maxUses: number
  usedCount: number
  expiresAt: string
  isActive: boolean
}

interface PayoutRecord {
  _id: string
  amount: number
  status: 'pending' | 'paid' | 'rejected'
  createdAt: string
  note?: string
}

export function VendorDashboard() {
  const { token } = useAuth()
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [products, setProducts] = useState<ProductItem[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [isLoadingStore, setIsLoadingStore] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [recentCount, setRecentCount] = useState(0)

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons' | 'payouts'>('overview')

  // Payout Ledger States
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
  const [ledgerMetrics, setLedgerMetrics] = useState({
    totalEarnings: 0,
    pendingPayouts: 0,
    paidPayouts: 0,
  })
  const [isLoadingLedger, setIsLoadingLedger] = useState(true)
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [availableBalance, setAvailableBalance] = useState(0)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null)

  // Coupon States
  const [coupons, setCoupons] = useState<CouponRecord[]>([])
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true)
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage')
  const [couponValue, setCouponValue] = useState('')
  const [couponMinOrder, setCouponMinOrder] = useState('')
  const [couponMaxUses, setCouponMaxUses] = useState('')
  const [couponExpires, setCouponExpires] = useState('')
  const [couponAddLoading, setCouponAddLoading] = useState(false)
  const [couponAddError, setCouponAddError] = useState<string | null>(null)

  // Onboarding Form States
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit Settings Modal States
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const [editBannerUrl, setEditBannerUrl] = useState('')
  const [isEditingLoading, setIsEditingLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Add Product Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [prodName, setProdName] = useState('')
  const [prodDescription, setProdDescription] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodStock, setProdStock] = useState('')
  const [prodImageUrl, setProdImageUrl] = useState('')
  const [isAddLoading, setIsAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Dynamic Categories Hierarchy States
  const [categoriesTree, setCategoriesTree] = useState<any[]>([])
  const [selectedL1, setSelectedL1] = useState<string>('')
  const [selectedL2, setSelectedL2] = useState<string>('')
  const [selectedL3, setSelectedL3] = useState<string>('')
  const [selectedL4, setSelectedL4] = useState<string>('')

  useEffect(() => {
    async function fetchTree() {
      try {
        const r = await fetch('/api/categories?tree=true')
        if (r.ok) {
          const d = await r.json()
          setCategoriesTree(d.categories || [])
        }
      } catch (err) {
        console.error('Error fetching categories tree:', err)
      }
    }
    fetchTree()
  }, [])

  // Analytics States
  const [analytics, setAnalytics] = useState<any>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setIsLoadingOrders(true)
    try {
      const res = await fetch('/api/orders/merchant', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (err) {
      console.error('Failed to load merchant orders:', err)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [token])

  const fetchLedger = useCallback(async () => {
    if (!token) return
    setIsLoadingLedger(true)
    try {
      const res = await fetch('/api/payments/ledger', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setLedgerEntries(data.ledger || [])
        setLedgerMetrics(data.metrics || { totalEarnings: 0, pendingPayouts: 0, paidPayouts: 0 })
      }
    } catch (err) {
      console.error('Failed to load merchant ledger:', err)
    } finally {
      setIsLoadingLedger(false)
    }
  }, [token])

  const fetchPayouts = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/payouts', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts || [])
        setAvailableBalance(data.availableBalance || 0)
      }
    } catch (err) {
      console.error('Failed to load payouts:', err)
    }
  }, [token])

  const fetchCoupons = useCallback(async () => {
    if (!token) return
    setIsLoadingCoupons(true)
    try {
      const res = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons || [])
      }
    } catch (err) {
      console.error('Failed to load coupons:', err)
    } finally {
      setIsLoadingCoupons(false)
    }
  }, [token])

  const fetchAnalytics = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/analytics/vendor', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }, [token])

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!token) return
    try {
      const res = await fetch('/api/orders/merchant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      })
      if (res.ok) {
        await fetchOrders()
        await fetchLedger()
        await fetchAnalytics()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update order status')
      }
    } catch (err) {
      console.error('Order status update error:', err)
    }
  }

  const fetchProducts = useCallback(async (storeId: string) => {
    setIsLoadingProducts(true)
    try {
      const res = await fetch(`/api/products?storeId=${storeId}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
        const count = (data.products || []).filter(
          (p: ProductItem) => new Date(p.createdAt).getTime() > cutoff
        ).length
        setRecentCount(count)
      }
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  // Fetch store on mount
  useEffect(() => {
    const fetchStore = async () => {
      if (!token) return
      try {
        const res = await fetch('/api/store/my', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setStore(data.store)
          if (data.store) {
            setEditName(data.store.name)
            setEditDescription(data.store.description || '')
            setEditLogoUrl(data.store.logoUrl || '')
            setEditBannerUrl(data.store.bannerUrl || '')
            await fetchProducts(data.store._id)
            await fetchOrders()
            await fetchLedger()
            await fetchPayouts()
            await fetchCoupons()
            await fetchAnalytics()
          }
        }
      } catch (err) {
        console.error('Failed to load store settings:', err)
      } finally {
        setIsLoadingStore(false)
      }
    }

    fetchStore()
  }, [token, fetchProducts, fetchOrders, fetchLedger, fetchPayouts, fetchCoupons, fetchAnalytics])

  const handleNameChange = (val: string) => {
    setName(val)
    const suggestedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(suggestedSlug)
  }

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsOnboarding(true)

    try {
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          description,
          logoUrl:
            logoUrl ||
            'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=150&auto=format&fit=crop&q=60',
          bannerUrl:
            bannerUrl ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create shop storefront')

      setStore(data.store)
      setEditName(data.store.name)
      setEditDescription(data.store.description || '')
      setEditLogoUrl(data.store.logoUrl || '')
      setEditBannerUrl(data.store.bannerUrl || '')
      setProducts([])
      setIsLoadingProducts(false)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred during onboarding'
      setError(errMsg)
    } finally {
      setIsOnboarding(false)
    }
  }

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setIsEditingLoading(true)

    try {
      const res = await fetch('/api/store/my', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          logoUrl: editLogoUrl,
          bannerUrl: editBannerUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update store settings')

      setStore(data.store)
      setIsEditOpen(false)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred updating store'
      setEditError(errMsg)
    } finally {
      setIsEditingLoading(false)
    }
  }

  const handleAIFill = (details: any) => {
    setProdName(details.name)
    setProdDescription(details.description)
    setProdPrice(details.price.toString())
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError(null)
    setIsAddLoading(true)

    try {
      const parsedPrice = parseFloat(prodPrice)
      const parsedStock = parseInt(prodStock, 10)

      if (isNaN(parsedPrice) || parsedPrice < 0) {
        throw new Error('Price must be a valid number greater than or equal to 0')
      }
      if (isNaN(parsedStock) || parsedStock < 0) {
        throw new Error('Stock must be a valid integer greater than or equal to 0')
      }

      const catId = selectedL4 || selectedL3 || selectedL2 || selectedL1
      if (!catId) {
        throw new Error('Please select at least a main category (L1)')
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: prodName,
          description: prodDescription,
          price: parsedPrice,
          categoryId: catId,
          stock: parsedStock,
          images: prodImageUrl
            ? [prodImageUrl.trim()]
            : [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60',
              ],
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to list product')

      setProdName('')
      setProdDescription('')
      setProdPrice('')
      setSelectedL1('')
      setSelectedL2('')
      setSelectedL3('')
      setSelectedL4('')
      setProdStock('')
      setProdImageUrl('')
      setIsAddOpen(false)

      if (store) await fetchProducts(store._id)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred listing product'
      setAddError(errMsg)
    } finally {
      setIsAddLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p._id !== productId))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete product')
      }
    } catch (err) {
      console.error('Delete product error:', err)
      alert('An error occurred deleting the product listing')
    }
  }

  // Handle Request Payout
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayoutError(null)
    setPayoutSuccess(null)
    setPayoutLoading(true)

    try {
      const parsedAmount = parseFloat(payoutAmount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid positive withdrawal amount.')
      }

      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: parsedAmount }),
      })
      const data = await res.json()
      if (res.ok) {
        setPayoutSuccess(`Successfully requested withdrawal of $${parsedAmount.toFixed(2)}.`)
        setPayoutAmount('')
        await fetchPayouts()
        await fetchLedger()
      } else {
        setPayoutError(data.error || 'Failed to submit withdrawal request.')
      }
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setPayoutLoading(false)
    }
  }

  // Handle Add Coupon
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponAddError(null)
    setCouponAddLoading(true)

    try {
      const parsedVal = parseFloat(couponValue)
      const parsedMin = couponMinOrder ? parseFloat(couponMinOrder) : 0
      const parsedMax = couponMaxUses ? parseInt(couponMaxUses, 10) : 0

      if (!couponCode.trim()) throw new Error('Code is required')
      if (isNaN(parsedVal) || parsedVal <= 0) throw new Error('Value must be greater than 0')
      if (couponType === 'percentage' && parsedVal > 100) throw new Error('Percentage cannot exceed 100')
      if (!couponExpires) throw new Error('Expiration date is required')

      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          discountType: couponType,
          discountValue: parsedVal,
          minOrderValue: parsedMin,
          maxUses: parsedMax,
          expiresAt: couponExpires,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setIsAddCouponOpen(false)
        setCouponCode('')
        setCouponValue('')
        setCouponMinOrder('')
        setCouponMaxUses('')
        setCouponExpires('')
        await fetchCoupons()
      } else {
        setCouponAddError(data.error || 'Failed to create coupon')
      }
    } catch (err) {
      setCouponAddError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setCouponAddLoading(false)
    }
  }

  // Handle Delete Coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm('Delete this coupon campaign?')) return
    try {
      const res = await fetch('/api/coupons', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ couponId }),
      })
      if (res.ok) {
        await fetchCoupons()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete coupon')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoadingStore) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 1. Onboarding State (No store created yet)
  if (!store) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-4">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
            <StoreIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Setup Your Merchant Store</h2>
          <p className="text-sm text-muted-foreground">
            Initialize your tenant shop storefront profile before listing inventory items.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-4 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form
          onSubmit={handleCreateStore}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-5 shadow-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-1">
              <label
                className="text-xs font-bold text-muted-foreground uppercase"
                htmlFor="onboard-name"
              >
                Shop Name
              </label>
              <input
                id="onboard-name"
                type="text"
                placeholder="Apex Electronics"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-1.5 col-span-1">
              <label
                className="text-xs font-bold text-muted-foreground uppercase"
                htmlFor="onboard-slug"
              >
                Storefront Slug
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="onboard-slug"
                  type="text"
                  placeholder="apex-electronics"
                  required
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))
                  }
                  className="w-full h-10 rounded-lg border border-input bg-muted/20 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/80 font-medium">
                Live URL:{' '}
                <span className="text-violet-500 font-mono">
                  nexus.com/store/{slug || 'shop-slug'}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-bold text-muted-foreground uppercase"
              htmlFor="onboard-desc"
            >
              Shop Description
            </label>
            <textarea
              id="onboard-desc"
              rows={3}
              placeholder="Tell customers about your products, shipping, and brand..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted/20 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Shop Logo</span>
              <ImageUploader currentImage={logoUrl} onImageUploaded={setLogoUrl} />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Shop Banner</span>
              <ImageUploader currentImage={bannerUrl} onImageUploaded={setBannerUrl} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isOnboarding}
            className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/95 shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-50 transition-colors"
          >
            {isOnboarding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing Storefront...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Launch Storefront
              </>
            )}
          </button>
        </form>
      </div>
    )
  }

  // Active Dashboard
  const totalEarnings = orders.reduce((sum, o) => sum + o.subtotal, 0)
  const activeOrdersCount = orders.filter(
    (o) => o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'cancelled'
  ).length

  const stats = [
    {
      label: 'Total Earnings',
      value: `$${totalEarnings.toFixed(2)}`,
      change: '+12.5%',
      trend: true,
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Products Listed',
      value: products.length.toString(),
      change: `+${recentCount} new`,
      trend: true,
      icon: Package,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Active Orders',
      value: activeOrdersCount.toString(),
      change: '+4%',
      trend: true,
      icon: ShoppingCart,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ]

  const l1Category = categoriesTree.find(c => c._id === selectedL1)
  const l2Options = l1Category ? (l1Category.children || []) : []

  const l2Category = l2Options.find((c: any) => c._id === selectedL2)
  const l3Options = l2Category ? (l2Category.children || []) : []

  const l3Category = l3Options.find((c: any) => c._id === selectedL3)
  const l4Options = l3Category ? (l3Category.children || []) : []

  return (
    <div className="space-y-6">
      {/* Shop profile banner */}
      <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden border border-border bg-card">
        <img
          src={
            store.bannerUrl ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60'
          }
          alt="Store Banner"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute bottom-4 left-6 flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl border border-border bg-card p-1 shadow overflow-hidden">
            <img
              src={
                store.logoUrl ||
                'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=150&auto=format&fit=crop&q=60'
              }
              alt="Store Logo"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground">
                {store.name}
              </h2>
              <span className="text-[10px] font-bold bg-violet-500/10 border border-violet-500/25 text-violet-500 rounded px-1.5 py-0.5 uppercase tracking-wide">
                Active Shop
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
              <Globe className="h-3.5 w-3.5" />
              nexus.com/store/{store.slug}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="absolute top-4 right-4 inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card/80 hover:bg-accent hover:text-accent-foreground px-3.5 text-xs font-semibold backdrop-blur-sm transition-colors gap-1.5 shadow-sm"
          onClick={() => setIsEditOpen(true)}
        >
          <Settings className="h-4 w-4" />
          Shop Settings
        </button>
      </div>

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
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="h-4 w-4" />
          Inventory ({products.length})
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
          Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gift className="h-4 w-4" />
          Coupons & Campaigns
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
          Payout Settlements
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-sm hover:border-foreground/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-extrabold tracking-tight">{stat.value}</span>
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${stat.trend ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stat.change}
                        <TrendingUp className={`h-3 w-3 ${stat.trend ? '' : 'rotate-180'}`} />
                      </span>
                    </div>
                  </div>
                )
              })}
            </section>

            {analytics && (
              <div className="w-full">
                <RevenueLineChart data={analytics.charts?.revenueOverTime} />
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics && (
                <>
                  <CategoryPieChart data={analytics.charts?.categorySales} />
                  <RatingBarChart data={analytics.charts?.ratingDistribution} />
                </>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: PRODUCTS (INVENTORY) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-foreground">Catalog & Inventory</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Manage product parameters and stock allocations
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow transition-all duration-200 gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="overflow-x-auto">
                {isLoadingProducts ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-xl">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
                    <p className="text-xs font-semibold text-foreground">No Products Listed Yet</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                      Click &ldquo;Add Product&rdquo; above to display your first items to customer storefronts.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold">
                        <th className="py-3 pr-4">Details</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Stock</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {products.map((item) => (
                        <tr key={item._id} className="group hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4 font-semibold text-foreground flex items-center gap-3">
                            <img
                              src={item.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60'}
                              alt={item.name}
                              className="h-10 w-10 object-cover rounded-lg border border-border"
                            />
                            <div className="max-w-[200px] truncate">
                              <div className="font-bold truncate">{item.name}</div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                {item._id.slice(-8).toUpperCase()}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-secondary/80 text-secondary-foreground border border-border">
                              <Tag className="h-2.5 w-2.5" />
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">{item.stock} units</td>
                          <td className="py-3 px-4 text-right font-bold text-foreground">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(item._id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Recent Customer Orders</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Manage shipping routing and update line item fulfillment status
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingOrders ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-xl">
                  <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <p className="text-xs font-semibold text-foreground">No Orders Placed Yet</p>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                    Your storefront catalog items are live! Customer orders will display here once checkout is completed.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="py-3 pr-4">Order ID / Customer</th>
                      <th className="py-3 px-4">Line Items</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                      <th className="py-3 px-4 text-center">Fulfillment Status</th>
                      <th className="py-3 pl-4 text-right font-bold uppercase tracking-wider">
                        Fulfill Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold text-foreground">
                          <div className="font-bold font-mono text-xs text-primary">
                            {order.parentOrderId}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {order.customerId?.name} ({order.customerId?.email})
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[250px]">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="truncate text-muted-foreground font-medium">
                              {item.name} <span className="text-foreground">x{item.quantity}</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-foreground">
                          ${order.subtotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              order.fulfillmentStatus === 'delivered'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : order.fulfillmentStatus === 'shipped'
                                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                  : order.fulfillmentStatus === 'cancelled'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                            }`}
                          >
                            {order.fulfillmentStatus}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-right">
                          <select
                            value={order.fulfillmentStatus}
                            onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                            className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-semibold"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-foreground">Coupons & Promo Codes</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Launch discount codes to drive traffic to your store
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCouponOpen(true)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 shadow transition-all duration-200 gap-1"
              >
                <Plus className="h-4 w-4" />
                New Coupon
              </button>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
              <div className="overflow-x-auto">
                {isLoadingCoupons ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="text-center py-12 space-y-2 border border-dashed border-border rounded-xl">
                    <Gift className="h-8 w-8 mx-auto text-muted-foreground/60" />
                    <p className="text-xs font-semibold text-foreground">No Coupon Campaigns</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                      Create store-scoped discount coupons that apply at checkout.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-semibold">
                        <th className="py-3 pr-4">Code</th>
                        <th className="py-3 px-4">Discount</th>
                        <th className="py-3 px-4">Min. Spend</th>
                        <th className="py-3 px-4 text-center">Usage Count</th>
                        <th className="py-3 px-4">Expires</th>
                        <th className="py-3 pl-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {coupons.map((c) => (
                        <tr key={c._id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4 font-bold text-foreground">
                            <span className="font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-[10px]">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `$${c.discountValue.toFixed(2)} Off`}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            ${c.minOrderValue.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {c.usedCount} {c.maxUses > 0 ? `/ ${c.maxUses}` : ''}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(c.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 pl-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c._id)}
                              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PAYOUTS */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-6 shadow-sm">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                  Payout Settlements & Commissions
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Track gross sales, platform commissions (10%), net payout shares (90%), and current settlement statuses
                </p>
              </div>

              {/* Ledger stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Net Earnings</p>
                  <p className="text-lg font-black text-foreground">${ledgerMetrics.totalEarnings.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground">Total payout share accumulated</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Available For Withdrawal</p>
                  <p className="text-lg font-black text-amber-500">${availableBalance.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground">Unpaid pending settlements</p>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Paid Payouts</p>
                  <p className="text-lg font-black text-emerald-500">${ledgerMetrics.paidPayouts.toFixed(2)}</p>
                  <p className="text-[9px] text-muted-foreground">Transferred to merchant bank details</p>
                </div>
              </div>

              {/* Withdrawal Form */}
              {availableBalance > 0 && (
                <form onSubmit={handleRequestPayout} className="border border-border p-5 rounded-2xl bg-muted/10 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Withdraw Balance</h4>
                    <p className="text-[10px] text-muted-foreground">Request immediate settlement disbursement from the platform</p>
                  </div>
                  {payoutError && (
                    <div className="p-3 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      {payoutError}
                    </div>
                  )}
                  {payoutSuccess && (
                    <div className="p-3 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      {payoutSuccess}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-2.5 text-xs text-muted-foreground font-semibold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        max={availableBalance}
                        placeholder={availableBalance.toFixed(2)}
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="w-full h-9 rounded-lg border border-input bg-card pl-7 pr-3.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={payoutLoading || !payoutAmount}
                      className="h-9 px-5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {payoutLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                      Request Withdrawal
                    </button>
                  </div>
                </form>
              )}

              {/* Past Payout Requests */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Past Withdrawal History
                </h4>
                {payouts.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground italic">No payout request logs available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px] font-semibold text-muted-foreground">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-2">Amount Requested</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Date Requested</th>
                          <th className="py-2 text-right">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 text-foreground">
                        {payouts.map((p) => (
                          <tr key={p._id}>
                            <td className="py-2 font-bold">${p.amount.toFixed(2)}</td>
                            <td className="py-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border ${
                                p.status === 'paid'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : p.status === 'rejected'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-2 text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-2 text-right text-muted-foreground truncate max-w-xs">{p.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Fee Ledgers list */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-bold text-foreground">Stripe Split Settlement Ledgers</h4>
                <div className="overflow-x-auto">
                  {isLoadingLedger ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : ledgerEntries.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                      No transaction ledger records logged yet. Checkout simulation will generate splits.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-semibold">
                          <th className="py-2.5 pr-4">Order ID</th>
                          <th className="py-2.5 px-4 text-right">Gross Sales</th>
                          <th className="py-2.5 px-4 text-right">Platform Fee (10%)</th>
                          <th className="py-2.5 px-4 text-right">Your Share (90%)</th>
                          <th className="py-2.5 px-4 text-center">Payout Status</th>
                          <th className="py-2.5 pl-4 text-right">Transaction Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium text-foreground">
                        {ledgerEntries.map((entry) => (
                          <tr key={entry._id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-2.5 pr-4 font-mono text-[9px] text-muted-foreground">
                              {entry.orderId?._id || entry.orderId || entry._id}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold">
                              ${entry.totalAmount.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-rose-500/90">
                              -${entry.platformFee.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-500 font-bold">
                              +${entry.merchantShare.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                                entry.payoutStatus === 'paid'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              }`}>
                                {entry.payoutStatus}
                              </span>
                            </td>
                            <td className="py-2.5 pl-4 text-right text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT STORE PROFILE MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
              onClick={() => setIsEditOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Update Storefront Profile</h3>
              <p className="text-xs text-muted-foreground">Adjust details, logo, and banners for your shop</p>
            </div>

            {editError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{editError}</p>
              </div>
            )}

            <form onSubmit={handleUpdateStore} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="edit-name">
                  Shop Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="edit-desc">
                  Shop Description
                </label>
                <textarea
                  id="edit-desc"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-muted/20 p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploader currentImage={editLogoUrl} onImageUploaded={setEditLogoUrl} />
                <ImageUploader currentImage={editBannerUrl} onImageUploaded={setEditBannerUrl} />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-border bg-card px-4 font-semibold hover:bg-accent text-foreground transition-colors"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingLoading}
                  className="h-10 rounded-lg bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/95 shadow flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {isEditingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsAddOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
              onClick={() => setIsAddOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">List New Product</h3>
              <p className="text-xs text-muted-foreground">Add a new item to your storefront catalog inventory</p>
            </div>

            {addError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{addError}</p>
              </div>
            )}

            <div className="mb-4">
              <AIProductFormAssistant onGenerate={handleAIFill} />
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="add-name">
                  Product Name
                </label>
                <input
                  id="add-name"
                  type="text"
                  required
                  placeholder="Zenith Noise Cancelling Headphones"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="add-desc">
                  Product Description
                </label>
                <textarea
                  id="add-desc"
                  rows={3}
                  required
                  placeholder="Provide details specs, variants, features..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full rounded-lg border border-input bg-muted/20 p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="add-price">
                    Price ($ USD)
                  </label>
                  <input
                    id="add-price"
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="add-stock">
                    Stock Quantity
                  </label>
                  <input
                    id="add-stock"
                    type="number"
                    required
                    placeholder="50"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                {/* Dynamic Cascading Categories Selector (Level 1 -> Level 4) */}
                <div className="space-y-3 border-t border-border/40 pt-3 font-semibold text-xs text-foreground">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Product Classification Hierarchy
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Level 1 Select */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-muted-foreground uppercase" htmlFor="category-l1">
                        Main Category (L1)
                      </label>
                      <select
                        id="category-l1"
                        required
                        value={selectedL1}
                        onChange={(e) => {
                          setSelectedL1(e.target.value)
                          setSelectedL2('')
                          setSelectedL3('')
                          setSelectedL4('')
                        }}
                        className="w-full h-10 rounded-lg border border-input bg-muted/20 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                      >
                        <option value="">Select Category</option>
                        {categoriesTree.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Level 2 Select */}
                    {l2Options.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase" htmlFor="category-l2">
                          Subcategory (L2)
                        </label>
                        <select
                          id="category-l2"
                          value={selectedL2}
                          onChange={(e) => {
                            setSelectedL2(e.target.value)
                            setSelectedL3('')
                            setSelectedL4('')
                          }}
                          className="w-full h-10 rounded-lg border border-input bg-muted/20 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                        >
                          <option value="">Select Subcategory</option>
                          {l2Options.map((c: any) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Level 3 Select */}
                    {l3Options.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase" htmlFor="category-l3">
                          Section (L3)
                        </label>
                        <select
                          id="category-l3"
                          value={selectedL3}
                          onChange={(e) => {
                            setSelectedL3(e.target.value)
                            setSelectedL4('')
                          }}
                          className="w-full h-10 rounded-lg border border-input bg-muted/20 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                        >
                          <option value="">Select Section</option>
                          {l3Options.map((c: any) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Level 4 Select */}
                    {l4Options.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase" htmlFor="category-l4">
                          Leaf Class (L4)
                        </label>
                        <select
                          id="category-l4"
                          value={selectedL4}
                          onChange={(e) => setSelectedL4(e.target.value)}
                          className="w-full h-10 rounded-lg border border-input bg-muted/20 px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-semibold"
                        >
                          <option value="">Select Subtype</option>
                          {l4Options.map((c: any) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <ImageUploader currentImage={prodImageUrl} onImageUploaded={setProdImageUrl} />

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-border bg-card px-4 font-semibold hover:bg-accent text-foreground transition-colors"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddLoading}
                  className="h-10 rounded-lg bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/95 shadow flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {isAddLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding Listing...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add to Catalog
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW COUPON MODAL */}
      {isAddCouponOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setIsAddCouponOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 space-y-6">
            <button
              type="button"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
              onClick={() => setIsAddCouponOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Launch Coupon Campaign</h3>
              <p className="text-xs text-muted-foreground">Create a new coupon discount for checkout incentives</p>
            </div>

            {couponAddError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{couponAddError}</p>
              </div>
            )}

            <form onSubmit={handleAddCoupon} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-code">
                    Coupon Code
                  </label>
                  <input
                    id="coupon-code"
                    type="text"
                    required
                    placeholder="WINTER20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring uppercase font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-type">
                    Discount Type
                  </label>
                  <select
                    id="coupon-type"
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value as any)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-value">
                    Value
                  </label>
                  <input
                    id="coupon-value"
                    type="number"
                    step="0.01"
                    required
                    placeholder={couponType === 'percentage' ? '20' : '15.00'}
                    value={couponValue}
                    onChange={(e) => setCouponValue(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-min">
                    Min. Order Value ($)
                  </label>
                  <input
                    id="coupon-min"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={couponMinOrder}
                    onChange={(e) => setCouponMinOrder(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-max">
                    Max. Uses (0 = inf)
                  </label>
                  <input
                    id="coupon-max"
                    type="number"
                    placeholder="100"
                    value={couponMaxUses}
                    onChange={(e) => setCouponMaxUses(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase" htmlFor="coupon-expiry">
                  Expiry Date
                </label>
                <input
                  id="coupon-expiry"
                  type="date"
                  required
                  value={couponExpires}
                  onChange={(e) => setCouponExpires(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-muted/20 px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-border bg-card px-4 font-semibold hover:bg-accent text-foreground transition-colors"
                  onClick={() => setIsAddCouponOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={couponAddLoading}
                  className="h-10 rounded-lg bg-primary text-primary-foreground px-5 font-semibold hover:bg-primary/95 shadow flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {couponAddLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Launching...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4" />
                      Create Campaign
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
