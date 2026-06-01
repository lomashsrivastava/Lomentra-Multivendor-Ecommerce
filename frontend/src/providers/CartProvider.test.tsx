import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, renderHook } from '@testing-library/react'
import { CartProvider } from './CartProvider'
import type { ProductItem } from './CartProvider'
import { useCart } from '@/hooks/useCart'

// Test helper component
function TestComponent() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()

  return (
    <div>
      <div data-testid="cart-length">{cartItems.length}</div>
      <div data-testid="cart-total">
        {cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)}
      </div>
      {cartItems.map((item) => (
        <div key={item.product._id} data-testid={`item-${item.product._id}`}>
          {item.product.name} - Qty: {item.quantity}
        </div>
      ))}
      <button
        onClick={() =>
          addToCart(
            {
              _id: 'prod-123',
              name: 'Quantum Headphones',
              price: 100,
              stock: 5,
              storeId: 'store-abc',
              images: [],
              category: 'electronics',
              description: 'Noise cancelling',
            } as unknown as ProductItem,
            1
          )
        }
        data-testid="add-btn"
      >
        Add Item
      </button>
      <button onClick={() => updateQuantity('prod-123', 3)} data-testid="update-btn">
        Update Qty to 3
      </button>
      <button onClick={() => removeFromCart('prod-123')} data-testid="remove-btn">
        Remove Item
      </button>
      <button onClick={clearCart} data-testid="clear-btn">
        Clear Cart
      </button>
    </div>
  )
}

describe('CartProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('provides empty cart by default', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('cart-length').textContent).toBe('0')
    expect(screen.getByTestId('cart-total').textContent).toBe('0')
  })

  it('adds items to the cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    const addBtn = screen.getByTestId('add-btn')
    act(() => {
      addBtn.click()
    })

    expect(screen.getByTestId('cart-length').textContent).toBe('1')
    expect(screen.getByTestId('cart-total').textContent).toBe('100')
    expect(screen.getByTestId('item-prod-123').textContent).toContain('Qty: 1')
  })

  it('updates item quantities', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add first
    act(() => {
      screen.getByTestId('add-btn').click()
    })

    // Update quantity
    act(() => {
      screen.getByTestId('update-btn').click()
    })

    expect(screen.getByTestId('item-prod-123').textContent).toContain('Qty: 3')
    expect(screen.getByTestId('cart-total').textContent).toBe('300')
  })

  it('checks stock limits', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const product = {
      _id: 'prod-123',
      name: 'Quantum Headphones',
      price: 100,
      stock: 5,
      storeId: 'store-abc',
      images: [],
      category: 'electronics',
      description: 'Noise cancelling',
    } as unknown as ProductItem

    const { result } = renderHook(() => useCart(), {
      wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
    })

    act(() => {
      result.current.addToCart(product, 6)
    })

    expect(alertSpy).toHaveBeenCalled()
    expect(result.current.cartItems.length).toBe(0)
  })

  it('removes items and clears cart', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add first
    act(() => {
      screen.getByTestId('add-btn').click()
    })
    expect(screen.getByTestId('cart-length').textContent).toBe('1')

    // Remove
    act(() => {
      screen.getByTestId('remove-btn').click()
    })
    expect(screen.getByTestId('cart-length').textContent).toBe('0')

    // Add again and clear
    act(() => {
      screen.getByTestId('add-btn').click()
    })
    expect(screen.getByTestId('cart-length').textContent).toBe('1')

    act(() => {
      screen.getByTestId('clear-btn').click()
    })
    expect(screen.getByTestId('cart-length').textContent).toBe('0')
  })
})
