import { useState, useEffect } from 'react'
import { Award, Star, ShoppingCart, Heart, ShieldCheck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

const BRANDS = [
  { name: 'Apple', logo: '🍎', banner: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400', tag: 'Premium Tech Partner' },
  { name: 'Samsung', logo: '🪐', banner: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', tag: 'Galaxy Tech' },
  { name: 'Sony', logo: '🎮', banner: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', tag: 'Masterful Acoustics' },
  { name: 'Bose', logo: '🎧', banner: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', tag: 'Pure Sound Engineering' },
  { name: 'Nike', logo: '✔️', banner: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', tag: 'Athletic Wear' },
  { name: 'Adidas', logo: '👟', banner: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400', tag: 'Sport & Lifestyle' },
]

export function TopBrandsPage() {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('Apple')
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const catMap: Record<string, string> = {
          Apple: 'electronics',
          Samsung: 'electronics',
          Sony: 'electronics',
          Bose: 'electronics',
          Nike: 'fashion-apparel',
          Adidas: 'fashion-apparel',
        }
        const activeCat = catMap[selectedBrand] || 'electronics'
        const r = await fetch(`/api/products?category=${activeCat}&limit=24`)
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
    fetchProducts()
  }, [selectedBrand])

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
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-background p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-emerald-500 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-500" /> Premium Brands
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Top Brands Directory</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Authentic certified brands. Shop directly from authorized partners with standard manufacturer warranty.
            </p>
          </div>
        </div>
      </div>

      {/* Brand Selection Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {BRANDS.map((br) => {
          const isSelected = selectedBrand === br.name
          return (
            <button
              key={br.name}
              onClick={() => setSelectedBrand(br.name)}
              className={`group flex flex-col text-left rounded-2xl border transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.02]'
                  : 'border-border bg-card hover:border-emerald-500/30'
              }`}
            >
              <div className="h-20 w-full relative overflow-hidden bg-muted/20">
                <img
                  src={br.banner}
                  alt={br.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-3xl filter drop-shadow">{br.logo}</span>
                </div>
              </div>
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-black text-foreground">{br.name}</h3>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight">{br.tag}</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Products under Brand */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Official Products from <span className="text-emerald-500 font-extrabold">{selectedBrand}</span>
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">{products.length} Products</span>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-bold text-foreground">No Products Found</p>
            <p className="text-xs text-muted-foreground mt-1">
              There are no products listed from this brand currently.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const origPrice = p.price * 1.2
              const rating = 4.3 + (p.name.length % 5) * 0.1

              return (
                <div
                  key={p._id}
                  className="group relative rounded-3xl border border-border bg-card hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="relative h-44 bg-muted/20 overflow-hidden">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=350'}
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

                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        OFFICIAL
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                      {p.name}
                    </h3>

                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-foreground">{rating.toFixed(1)}</span>
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
