import { useState, useEffect } from 'react'
import { Heart, Trash2, ShoppingCart, Lock } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

export function WishlistPage() {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  async function fetchWishlist() {
    if (!token) return
    setLoading(true)
    try {
      const r = await fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      if (r.ok) {
        const d = await r.json()
        setProducts(d.products || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchWishlist()
    } else {
      setLoading(false)
    }
  }, [token, user])

  const removeFromWishlist = async (id: string) => {
    if (!token) return
    try {
      const r = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId: id }),
      })
      if (r.ok) {
        setProducts((p) => p.filter((item) => item._id !== id))
      }
    } catch {}
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Authentication Required</h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Please sign in to view and manage your personal wishlist.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-pink-500/5 via-violet-500/5 to-background p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-pink-500 flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 fill-pink-500 text-pink-500" /> Favorites
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">My Wishlist</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Keep track of items you love. Add them to your cart directly, or remove them when you change your mind.
            </p>
          </div>
        </div>
      </div>

      {/* Wishlist Items */}
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Heart className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm font-bold text-foreground">Your Wishlist is Empty</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap the heart icon on any product to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => {
            const origPrice = p.price * 1.2

            return (
              <div
                key={p._id}
                className="group relative rounded-3xl border border-border bg-card hover:border-pink-500/30 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setSelectedProduct(p)}
              >
                <div className="relative h-44 bg-muted/20 overflow-hidden">
                  <img
                    src={p.images[0] || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=350'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromWishlist(p._id)
                    }}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 flex items-center justify-center shadow-md transition-colors"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{p.name}</h3>

                  <div className="flex items-baseline gap-2">
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
                    className="w-full mt-2 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-colors shadow-lg"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Cart
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
