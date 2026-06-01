import { useState, useEffect } from 'react'
import {
  Star,
  ShoppingCart,
  Loader2,
  PackageOpen,
  ArrowLeft,
  SlidersHorizontal,
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { motion } from 'framer-motion'
import ProductDetailModal from '@/components/ProductDetailModal'
import { formatPrice } from '@/utils/utils'
import { useAuth } from '@/hooks/useAuth'

interface StorePageProps {
  storeSlug: string
  onBack: () => void
}

interface StoreInfo {
  _id: string
  name: string
  slug: string
  description?: string
  logoUrl?: string
  bannerUrl?: string
  avgRating: number
  reviewCount: number
  totalProducts: number
}

interface StoreProduct {
  _id: string
  name: string
  price: number
  images: string[]
  category: string
  stock: number
  description: string
}

export default function StorePage({ storeSlug, onBack }: StorePageProps) {
  const { currency } = useAuth()
  const { addToCart } = useCart()
  const [store, setStore] = useState<StoreInfo | null>(null)
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeCategory, setActiveCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  useEffect(() => {
    const fetchStorefront = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          slug: storeSlug,
          page: page.toString(),
          limit: '12',
          sort,
        })
        if (activeCategory) params.set('category', activeCategory)

        const res = await fetch(`/api/storefront?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setStore(data.store)
          setProducts(data.products || [])
          setCategories(data.categories || [])
          setTotalPages(data.pagination.totalPages)
        }
      } catch (err) {
        console.error('Failed to load storefront:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStorefront()
  }, [storeSlug, page, activeCategory, sort])

  if (loading && !store) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="text-center py-20 space-y-3">
        <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
        <h4 className="text-sm font-bold text-foreground">Store Not Found</h4>
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-primary hover:underline"
        >
          ← Back to Marketplace
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Marketplace
      </button>

      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden border border-border bg-gradient-to-r from-violet-600/80 to-indigo-600/80 shadow-xl shadow-indigo-500/10"
      >
        {store.bannerUrl && (
          <img
            src={store.bannerUrl}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="relative p-8 md:p-12 flex items-center gap-6">
          {/* Store Logo */}
          <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-white">{store.name[0]}</span>
            )}
          </div>
          <div className="space-y-2 text-white">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{store.name}</h1>
            {store.description && (
              <p className="text-white/70 text-sm max-w-lg">{store.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <strong>{store.avgRating}</strong>
                <span className="text-white/60">({store.reviewCount} reviews)</span>
              </span>
              <span className="text-white/60">{store.totalProducts} products</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter:
        </div>
        <button
          type="button"
          onClick={() => setActiveCategory('')}
          className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all ${
            activeCategory === ''
              ? 'bg-foreground text-background border-foreground'
              : 'bg-card text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all capitalize ${
              activeCategory === cat
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-[10px] font-semibold bg-card border border-border rounded-lg px-3 py-1.5 text-foreground"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-card border border-border rounded-3xl max-w-md mx-auto">
          <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground/60" />
          <h4 className="text-sm font-bold text-foreground">No Products Found</h4>
          <p className="text-xs text-muted-foreground">Try a different filter or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((product, idx) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg transition-all duration-300"
            >
              <div
                onClick={() => setSelectedProduct(product)}
                className="h-44 bg-muted/30 flex items-center justify-center overflow-hidden border-b border-border cursor-pointer"
              >
                <img
                  src={
                    product.images[0] ||
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60'
                  }
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div onClick={() => setSelectedProduct(product)} className="cursor-pointer space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    {product.category}
                  </span>
                  <h4 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-base font-extrabold text-foreground">
                    {formatPrice(product.price, currency)}
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(product as any, 1)}
                    disabled={product.stock === 0}
                    className="inline-flex h-8 px-3 items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-40 text-xs font-medium transition-colors shadow shadow-primary/10"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                page === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod) => addToCart(prod, 1)}
        />
      )}
    </div>
  )
}
