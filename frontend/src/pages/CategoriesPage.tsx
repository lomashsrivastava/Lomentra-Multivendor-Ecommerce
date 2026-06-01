import { useState, useEffect } from 'react'
import { LayoutGrid, ShoppingCart, Heart, ChevronRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice } from '@/utils/utils'
import ProductDetailModal from '@/components/ProductDetailModal'

const CATEGORY_ICONS: Record<string, string> = {
  'fashion-apparel': '👕',
  'electronics': '🎧',
  'home-furniture': '🪑',
  'kitchen-appliances': '🍳',
  'grocery': '🍎',
  'beauty-personal-care': '💄',
  'health-wellness': '💊',
  'sports-fitness': '⚽',
  'books-stationery': '📚',
  'toys-baby-products': '🎮',
  'automotive': '🚗',
  'jewelry': '💍',
}

const CATEGORY_COLORS: Record<string, string> = {
  'electronics': 'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 text-blue-500 border-blue-500/20',
  'fashion-apparel': 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 text-pink-500 border-pink-500/20',
  'home-furniture': 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-500 border-amber-500/20',
  'beauty-personal-care': 'from-purple-500/10 to-fuchsia-500/10 hover:from-purple-500/20 hover:to-fuchsia-500/20 text-purple-500 border-purple-500/20',
  'sports-fitness': 'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-500 border-emerald-500/20',
  'toys-baby-products': 'from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 text-red-500 border-red-500/20',
  'automotive': 'from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-500 border-cyan-500/20',
}

interface CategoriesPageProps {
  activeCategory?: any | null
  setActiveCategory?: (cat: any | null) => void
  selectedPath?: any[]
  setSelectedPath?: (path: any[]) => void
}

export function CategoriesPage({
  activeCategory: propActiveCategory,
  setActiveCategory: propSetActiveCategory,
  selectedPath: propSelectedPath,
  setSelectedPath: propSetSelectedPath,
}: CategoriesPageProps = {}) {
  const { addToCart } = useCart()
  const { token, user, currency } = useAuth()
  const [products, setProducts] = useState<any[]>([])
  const [categoriesTree, setCategoriesTree] = useState<any[]>([])
  
  const [localActiveCategory, localSetActiveCategory] = useState<any | null>(null)
  const [localSelectedPath, localSetSelectedPath] = useState<any[]>([])

  const activeCategory = propActiveCategory !== undefined ? propActiveCategory : localActiveCategory
  const setActiveCategory = propSetActiveCategory || localSetActiveCategory
  const selectedPath = propSelectedPath !== undefined ? propSelectedPath : localSelectedPath
  const setSelectedPath = propSetSelectedPath || localSetSelectedPath

  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  // Helper to find a node by slug in the tree and return the path (list of ancestors + node)
  function findPathInTree(nodes: any[], targetSlug: string, currentPath: any[] = []): any[] | null {
    for (const node of nodes) {
      const path = [...currentPath, node]
      if (node.slug === targetSlug) {
        return path
      }
      if (node.children && node.children.length > 0) {
        const found = findPathInTree(node.children, targetSlug, path)
        if (found) return found
      }
    }
    return null
  }

  // Fetch full category tree
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

  // Sync activeCategory details and selectedPath from tree when tree is loaded or category slug changes
  useEffect(() => {
    if (activeCategory && categoriesTree.length > 0) {
      const path = findPathInTree(categoriesTree, activeCategory.slug)
      if (path) {
        setSelectedPath(path)
        const fullActiveCategory = path[path.length - 1]
        // Only update if detailed reference in the tree is different
        if (activeCategory !== fullActiveCategory) {
          setActiveCategory(fullActiveCategory)
        }
      }
    }
  }, [categoriesTree, activeCategory?.slug])

  // Fetch products under active category (backend recursively handles descendants)
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const url = !activeCategory ? '/api/products' : `/api/products?category=${activeCategory.slug}`
        const r = await fetch(url)
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
  }, [activeCategory])

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

  const currentSubcategories = selectedPath.length === 0
    ? categoriesTree
    : (selectedPath[selectedPath.length - 1].children || [])

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-primary flex items-center gap-1.5">
              <LayoutGrid className="h-3 w-3" /> Catalog Directory
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Explore Categories</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Browse products through our multi-level taxonomy. Select subcategories below to narrow down your results.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap bg-muted/20 px-4 py-2.5 rounded-xl border border-border/50">
        <button
          onClick={() => {
            setSelectedPath([])
            setActiveCategory(null)
          }}
          className={`hover:text-primary transition-colors font-bold ${!activeCategory ? 'text-primary font-black' : ''}`}
        >
          All Categories
        </button>
        {selectedPath.map((cat, idx) => (
          <span key={cat._id} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            <button
              onClick={() => {
                const newPath = selectedPath.slice(0, idx + 1)
                setSelectedPath(newPath)
                setActiveCategory(cat)
              }}
              className={`hover:text-primary transition-colors font-bold ${
                idx === selectedPath.length - 1 ? 'text-primary font-black pointer-events-none' : ''
              }`}
            >
              {cat.name}
            </button>
          </span>
        ))}
      </div>

      {/* Category Grid Selection */}
      {currentSubcategories.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-foreground tracking-tight">
            {selectedPath.length === 0 ? 'Select Main Category' : `Subcategories of ${selectedPath[selectedPath.length - 1].name}`}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {currentSubcategories.map((cat: any) => {
              // Find matching icon/color based on slug or main root slug
              const rootSlug = selectedPath.length > 0 ? selectedPath[0].slug : cat.slug
              const icon = CATEGORY_ICONS[rootSlug] || '📁'
              const colorClass = CATEGORY_COLORS[rootSlug] || 'from-violet-500/10 to-purple-500/10 text-primary border-primary/20'

              return (
                <button
                  key={cat._id}
                  onClick={() => {
                    const newPath = [...selectedPath, cat]
                    setSelectedPath(newPath)
                    setActiveCategory(cat)
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 bg-gradient-to-b ${colorClass} border-border hover:shadow-md hover:scale-[1.02]`}
                >
                  <span className="text-3xl mb-2">{icon}</span>
                  <span className="text-[11px] font-bold text-foreground leading-tight tracking-tight">
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-foreground capitalize tracking-tight">
            Showing {!activeCategory ? 'All Products' : `${activeCategory.name} Catalog`}
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">{products.length} Items Found</span>
        </div>

        {loading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <LayoutGrid className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-bold text-foreground">No Products Found</p>
            <p className="text-xs text-muted-foreground mt-1">There are no items listed under this subcategory tree yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const origPrice = p.price * 1.2
              return (
                <div
                  key={p._id}
                  className="group relative rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(p)}
                >
                  <div className="relative h-40 bg-muted/20 overflow-hidden">
                    <img
                      src={p.images[0] || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=350'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full magical-btn-glow text-white shadow"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(p, 1)
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </button>
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(p._id)
                        }}
                        className="absolute top-2.5 right-2.5 h-7 w-7 rounded-full bg-background/80 hover:bg-background backdrop-blur-sm flex items-center justify-center shadow-md transition-colors"
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            wishlistIds.has(p._id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <div className="p-3.5 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      {p.category}
                    </p>
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">{p.name}</h3>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-xs font-black text-foreground">{formatPrice(p.price, currency)}</span>
                      <span className="text-[9px] text-muted-foreground line-through">{formatPrice(origPrice, currency)}</span>
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
