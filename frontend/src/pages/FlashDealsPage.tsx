import { useState, useEffect } from 'react'
import { Zap, Clock, ShoppingCart, Heart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

export function FlashDealsPage() {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [countdown, setCountdown] = useState({ h: 4, m: 12, s: 48 })

  // Tick timer
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown((p) => {
        if (p.s > 0) return { ...p, s: p.s - 1 }
        if (p.m > 0) return { h: p.h, m: p.m - 1, s: 59 }
        if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 }
        return { h: 4, m: 0, s: 0 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const r = await fetch('/api/products?limit=12')
        if (r.ok) {
          const d = await r.json()
          // Take products and mark them as deals
          setProducts((d.products || []).slice(0, 12))
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    async function fetchWishlist() {
      if (!token) return
      try {
        const r = await fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
        if (r.ok) {
          const d = await r.json()
          setWishlistIds(new Set((d.products || []).map((p: any) => p._id)))
        }
      } catch {}
    }
    if (user) fetchWishlist()
  }, [token, user])

  const toggleWishlist = async (id: string) => {
    if (!token) return
    const has = wishlistIds.has(id)
    try {
      await fetch('/api/wishlist', {
        method: has ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id }),
      })
      setWishlistIds((p) => {
        const n = new Set(p)
        has ? n.delete(id) : n.add(id)
        return n
      })
    } catch {}
  }

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 via-violet-500/5 to-background p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-red-500 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 fill-red-500 text-red-500 animate-bounce" /> Limited Campaign
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Flash Deals</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Unbelievable prices on premium hardware. Stocks are strictly limited and refresh hourly. Hurry up!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-5 py-3 rounded-2xl">
            <Clock className="h-5 w-5 text-red-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-red-500 leading-none mb-1">
                Deals Expire In
              </span>
              <span className="text-lg font-black text-foreground tabular-nums">
                {pad(countdown.h)} : {pad(countdown.m)} : {pad(countdown.s)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Zap className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-bold text-foreground">No Active Deals</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for exciting limited offers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p, idx) => {
            const discPct = 20 + (idx % 4) * 8
            const origPrice = p.price / (1 - discPct / 100)
            const soldPct = 15 + (idx % 7) * 12

            return (
              <div
                key={p._id}
                className="group relative rounded-3xl border border-border bg-card hover:border-red-500/30 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <div className="relative h-44 bg-muted/20 overflow-hidden">
                  <img
                    src={p.images[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=350'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-md">
                    -{discPct}%
                  </span>
                  {user && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(p._id)
                      }}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm flex items-center justify-center shadow-md transition-colors"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlistIds.has(p._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-wider">
                    HOT DEAL
                  </span>
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{p.name}</h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-red-500">{formatPrice(p.price, currency)}</span>
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatPrice(origPrice, currency)}
                    </span>
                  </div>

                  {/* Stock sold bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>{soldPct}% Sold</span>
                      <span>{100 - soldPct}% left</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        style={{ width: `${soldPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(p, 1)
                    }}
                    className="w-full mt-2 h-10 rounded-xl magical-btn-glow text-white font-extrabold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Claim Deal
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => addToCart(p, 1)}
        />
      )}
    </div>
  )
}
