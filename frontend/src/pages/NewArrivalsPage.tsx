import { useState, useEffect } from 'react'
import { Sparkles, Star, ShoppingCart, Heart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

export function NewArrivalsPage() {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const r = await fetch('/api/products?limit=12')
        if (r.ok) {
          const d = await r.json()
          // Sort items by creation (mock sort newest first)
          const items = [...(d.products || [])].reverse()
          setProducts(items.slice(0, 12))
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

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-indigo-500/5 via-fuchsia-500/5 to-background p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Fresh In Store
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">New Arrivals</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Be the first to own the latest items. Fresh shipments added daily to keep your setup ahead of the curve.
            </p>
          </div>
        </div>
      </div>

      {/* New Arrivals Grid */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-bold text-foreground">No New Arrivals</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const origPrice = p.price * 1.15
            const rating = 4.2 + (p.name.length % 5) * 0.1

            return (
              <div
                key={p._id}
                className="group relative rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                {/* Shiny Neon Tag */}
                <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[8px] font-black text-white uppercase tracking-widest animate-pulse shadow-md shadow-emerald-500/25">
                  NEW
                </div>

                <div className="relative h-44 bg-muted/20 overflow-hidden">
                  <img
                    src={p.images[0] || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=350'}
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
                  <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider">
                    NEW ARRIVAL
                  </span>
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{p.name}</h3>

                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(rating) ? 'fill-amber-400' : 'text-muted/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-extrabold text-foreground">{rating.toFixed(1)}</span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-foreground">{formatPrice(p.price, currency)}</span>
                      <span className="text-[10px] text-muted-foreground line-through">
                        {formatPrice(origPrice, currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart(p, 1)
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
