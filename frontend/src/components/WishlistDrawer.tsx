import { useState, useEffect, useCallback } from 'react'
import { Heart, ShoppingCart, X, Trash2, Loader2, PackageOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'

interface WishlistProduct {
  _id: string
  name: string
  price: number
  images: string[]
  category: string
  stock: number
  description: string
  storeId?: { name: string; slug: string; logoUrl?: string }
}

interface WishlistDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { user, token } = useAuth()
  const { addToCart } = useCart()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isOpen && user) fetchWishlist()
  }, [isOpen, user, fetchWishlist])

  const removeFromWishlist = async (productId: string) => {
    if (!token) return
    try {
      await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      })
      setProducts((prev) => prev.filter((p) => p._id !== productId))
    } catch (err) {
      console.error('Failed to remove from wishlist:', err)
    }
  }

  const handleAddToCart = (product: WishlistProduct) => {
    addToCart(
      {
        _id: product._id,
        name: product.name,
        price: product.price,
        images: product.images,
        category: product.category,
        stock: product.stock,
        description: product.description,
        storeId: product.storeId as any,
      },
      1
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 border-l border-border bg-background/95 backdrop-blur-xl flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <h2 className="font-bold text-lg">My Wishlist</h2>
                <span className="text-xs text-muted-foreground">({products.length})</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <PackageOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground font-medium">Your wishlist is empty</p>
                  <p className="text-xs text-muted-foreground">
                    Tap the heart icon on products to save them here
                  </p>
                </div>
              ) : (
                products.map((product) => (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="flex gap-3 p-3 rounded-xl border border-border bg-card hover:border-foreground/10 transition-all"
                  >
                    <img
                      src={
                        product.images[0] ||
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60'
                      }
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate">{product.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {product.category}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-extrabold text-foreground">
                          ${product.price.toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="inline-flex h-7 px-2 items-center gap-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Cart
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(product._id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
