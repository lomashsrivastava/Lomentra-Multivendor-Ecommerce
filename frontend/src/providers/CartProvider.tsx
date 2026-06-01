import React, { createContext, useState } from 'react'

export interface StoreInfo {
  _id: string
  name: string
  slug: string
  logoUrl?: string
}

export interface ProductItem {
  _id: string
  name: string
  description: string
  price: number
  category: string
  stock: number
  images: string[]
  storeId: string | StoreInfo
}

export interface CartItem {
  product: ProductItem
  quantity: number
}

export interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: ProductItem, quantity: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  isCheckoutOpen: boolean
  setIsCheckoutOpen: (open: boolean) => void
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nexus_cart')
        return stored ? JSON.parse(stored) : []
      }
    } catch (err) {
      console.error('Failed to parse cart items:', err)
    }
    return []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Persist to localStorage on change
  const saveCart = (items: CartItem[]) => {
    setCartItems(items)
    try {
      localStorage.setItem('nexus_cart', JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save cart items:', err)
    }
  }

  const addToCart = (product: ProductItem, quantity: number) => {
    const existingIndex = cartItems.findIndex((item) => item.product._id === product._id)
    const newItems = [...cartItems]

    if (existingIndex > -1) {
      const existingItem = cartItems[existingIndex]
      const newQuantity = existingItem.quantity + quantity
      // Check stock limit
      if (newQuantity > product.stock) {
        alert(`Cannot add more. Only ${product.stock} items left in stock.`)
        return
      }
      newItems[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
      }
    } else {
      if (quantity > product.stock) {
        alert(`Cannot add more. Only ${product.stock} items left in stock.`)
        return
      }
      newItems.push({ product, quantity })
    }

    saveCart(newItems)
    setIsCartOpen(true)
  }

  const removeFromCart = (productId: string) => {
    const newItems = cartItems.filter((item) => item.product._id !== productId)
    saveCart(newItems)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const item = cartItems.find((i) => i.product._id === productId)
    if (!item) return

    if (quantity > item.product.stock) {
      alert(`Only ${item.product.stock} units available in stock.`)
      return
    }

    const newItems = cartItems.map((i) => (i.product._id === productId ? { ...i, quantity } : i))
    saveCart(newItems)
  }

  const clearCart = () => {
    saveCart([])
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
