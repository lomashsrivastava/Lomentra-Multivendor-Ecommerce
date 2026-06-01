import { useCart } from '@/hooks/useCart'
import type { StoreInfo, CartItem } from '@/providers/CartProvider'
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store, Truck, Sparkles } from 'lucide-react'
import { formatPrice } from '@/utils/utils'
import { useAuth } from '@/hooks/useAuth'

export function CartDrawer() {
  const { currency } = useAuth()
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    setIsCheckoutOpen,
  } = useCart()

  if (!isCartOpen) return null

  const getStoreDetails = (storeId: string | StoreInfo | undefined | null) => {
    if (storeId && typeof storeId === 'object' && '_id' in storeId) {
      return {
        id: storeId._id,
        name: storeId.name || 'Merchant Store',
        slug: storeId.slug || '',
        logoUrl: storeId.logoUrl || '',
      }
    }
    return {
      id: typeof storeId === 'string' ? storeId : 'independent',
      name: 'Independent Merchant',
      slug: '',
      logoUrl: '',
    }
  }

  // Group cart items by store
  const groupedItems = cartItems.reduce<
    Record<
      string,
      {
        storeName: string
        slug: string
        logoUrl?: string
        items: CartItem[]
      }
    >
  >((acc, item) => {
    const store = getStoreDetails(item.product.storeId)
    if (!acc[store.id]) {
      acc[store.id] = {
        storeName: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl,
        items: [],
      }
    }
    acc[store.id].items.push(item)
    return acc
  }, {})

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const freeShippingThreshold = 500
  const isFreeShipping = subtotal >= freeShippingThreshold
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100)
  const missingAmount = freeShippingThreshold - subtotal

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-md bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-255">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="text-xs font-bold text-foreground">Shopping Cart</h2>
            <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5 animate-pulse">
              {cartItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-[9px] font-extrabold text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-wider px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Free Shipping Progress Alert */}
        {cartItems.length > 0 && (
          <div className="p-4 border-b border-border bg-primary/5 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Truck className={`h-4.5 w-4.5 ${isFreeShipping ? 'text-emerald-500' : 'text-primary'}`} />
              <span className="font-semibold text-foreground">
                {isFreeShipping ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-extrabold">
                    Free shipping unlocked! <Sparkles className="h-3 w-3 text-emerald-500" />
                  </span>
                ) : (
                  <>
                    Add <strong className="text-primary font-black">{formatPrice(missingAmount, currency)}</strong> more for{' '}
                    <strong className="underline">Free Shipping</strong>
                  </>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full cart-free-shipping-progress rounded-full bg-gradient-to-r ${
                  isFreeShipping ? 'from-emerald-500 to-teal-400' : 'from-primary to-violet-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground/60 border border-border/85">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground">Your cart is empty</h3>
                <p className="text-[10px] text-muted-foreground max-w-[200px] mx-auto">
                  Browse our dynamic marketplace storefront to add premium catalog items.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            Object.entries(groupedItems).map(([storeId, group]) => (
              <div
                key={storeId}
                className="space-y-3.5 border border-border/60 bg-muted/20 p-4 rounded-2xl transition-all hover:border-primary/20"
              >
                {/* Vendor Header */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-black text-foreground uppercase tracking-wider">
                    {group.storeName}
                  </span>
                  {group.slug && (
                    <span className="text-[9px] font-semibold text-muted-foreground/80 bg-muted/80 px-1.5 py-0.5 rounded">
                      {group.slug}.nexus
                    </span>
                  )}
                </div>

                {/* Vendor Cart Items */}
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.product._id} className="flex gap-3">
                      {/* Product Thumbnail */}
                      <img
                        src={
                          item.product.images[0] ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=60'
                        }
                        alt={item.product.name}
                        className="h-14 w-14 object-cover rounded-xl border border-border shrink-0 hover:scale-103 transition-transform"
                      />

                      {/* Product details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {formatPrice(item.product.price, currency)} each
                          </p>
                        </div>

                        {/* Adjusters */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                              className="h-6.5 w-6.5 flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-[10px] font-extrabold text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              className="h-6.5 w-6.5 flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Delete Item */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product._id)}
                            className="text-muted-foreground hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Total price for this line item */}
                      <div className="text-right self-start">
                        <span className="text-xs font-black text-foreground">
                          {formatPrice(item.product.price * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-border bg-card space-y-4 shadow-inner">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subtotal</span>
              <span className="text-lg font-black text-foreground">{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>Taxes & details calculated at checkout</span>
              {isFreeShipping && (
                <span className="text-emerald-600 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                  Free Delivery Enabled
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCheckoutOpen(true)
                setIsCartOpen(false)
              }}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all premium-glow-button"
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

