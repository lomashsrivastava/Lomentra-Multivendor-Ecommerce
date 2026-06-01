import { useState, useEffect } from 'react'
import { Sun, Ticket, ShoppingCart, Heart, Gift } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

const COUPONS = [
  { code: 'SUMMER20', discount: 'Rs. 200 Off', min: 'Min Purchase Rs. 1,000', desc: 'Valid on electronics & gadgets' },
  { code: 'LOMBEACH', discount: '15% Off All Fashion', min: 'Min Purchase Rs. 500', desc: 'Upgrade your summer wardrobe' },
  { code: 'SUNFREE', discount: 'Free Express Shipping', min: 'Min Purchase Rs. 750', desc: 'Delivered securely to your doorstep' },
]

export function SummerSalePage() {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null)
  const [claimedGift, setClaimedGift] = useState(false)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const r = await fetch('/api/products?limit=15')
        if (r.ok) {
          const d = await r.json()
          // Select products and mock a summer extra discount
          const summerProducts = (d.products || []).slice(4, 12).map((p: any) => ({
            ...p,
            summerPrice: Math.round(p.price * 0.85), // 15% discount for summer campaign
          }))
          setProducts(summerProducts)
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

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCoupon(code)
    setTimeout(() => setCopiedCoupon(null), 2500)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Summer Campaign Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 p-8 text-slate-900 shadow-xl">
        {/* Absolute Background Ornaments */}
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute right-12 bottom-0 h-32 w-32 opacity-20 pointer-events-none">
          <Sun className="h-full w-full text-white animate-spin" style={{ animationDuration: '30s' }} />
        </div>

        <div className="max-w-xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1 bg-white/25 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest text-slate-900 border border-white/35">
            <Sun className="h-4.5 w-4.5 animate-pulse text-amber-100 fill-amber-100" /> Season Extravaganza
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-slate-950">
            Summer Beach Blast!
          </h1>
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">
            Get an instant <span className="underline decoration-2 font-black">15% discount</span> store-wide on all products listed below. Claim promo coupon codes to save more at checkout.
          </p>
        </div>
      </div>

      {/* Claimable Coupons Section */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-foreground flex items-center gap-2">
          <Ticket className="h-5 w-5 text-amber-500" /> Claim Exclusive Coupons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COUPONS.map((c) => (
            <div
              key={c.code}
              className="relative overflow-hidden rounded-2xl border border-dashed border-amber-500/30 bg-card p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              {/* Ticket Edge Notches */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border-r border-border" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-background border-l border-border" />

              <div className="space-y-1.5 pl-2 pr-2">
                <span className="text-xs font-black text-amber-500">{c.discount}</span>
                <p className="text-[10px] text-muted-foreground font-semibold">{c.min}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">{c.desc}</p>
              </div>

              <div className="mt-4 flex items-center gap-2 pl-2 pr-2">
                <code className="flex-1 bg-muted/60 text-center py-1.5 rounded-lg text-xs font-bold text-foreground border border-border">
                  {c.code}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(c.code)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-colors ${
                    copiedCoupon === c.code
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary text-primary-foreground hover:bg-primary/95'
                  }`}
                >
                  {copiedCoupon === c.code ? 'Copied!' : 'Claim'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summer Interactive Lucky Gift Card Widget */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="text-sm font-black text-foreground flex items-center gap-2 justify-center md:justify-start">
            <Gift className="h-4.5 w-4.5 text-primary" /> Summer Scratch Surprise
          </h3>
          <p className="text-xs text-muted-foreground max-w-md">
            Click the gift box below to unwrap a mystery free gift voucher of Rs. 100 on your next checkout!
          </p>
        </div>

        <button
          onClick={() => setClaimedGift(true)}
          disabled={claimedGift}
          className={`px-6 py-3 rounded-2xl font-black text-xs transition-all duration-300 flex items-center gap-2 shadow-lg ${
            claimedGift
              ? 'bg-emerald-500 text-white cursor-default shadow-emerald-500/10'
              : 'bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.03] shadow-primary/20'
          }`}
        >
          <Gift className={`h-4.5 w-4.5 ${claimedGift ? '' : 'animate-bounce'}`} />
          {claimedGift ? 'Voucher Claimed: SUMGIFT100' : 'Unwrap Mystery Gift'}
        </button>
      </div>

      {/* Summer Specials Catalog Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-foreground">Summer Special Offers</h2>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Sun className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-bold text-foreground">No Summer Offers</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const origPrice = p.price * 1.3

              return (
                <div
                  key={p._id}
                  className="group relative rounded-3xl border border-border bg-card hover:border-amber-400/40 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  {/* Discount tag */}
                  <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-md bg-amber-500 text-[8px] font-black text-white uppercase tracking-widest shadow-md">
                    -15% EXTRA
                  </div>

                  <div className="relative h-44 bg-muted/20 overflow-hidden">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=350'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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

                  <div className="p-4 space-y-2.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-wider">
                      BEACH BLAST DEAL
                    </span>
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{p.name}</h3>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-foreground">
                          {formatPrice(p.summerPrice, currency)}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatPrice(origPrice, currency)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart({ ...p, price: p.summerPrice }, 1)
                        }}
                        className="h-9 w-9 rounded-full magical-btn-glow text-white flex items-center justify-center"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
