import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckoutModal } from './CheckoutModal'
import { CartContext } from '@/providers/CartProvider'

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

// Mock useAuth context
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { _id: 'user-123', name: 'John Smith', role: 'customer' },
    token: 'mock-jwt-token',
  })
}))

const mockCartContext = {
  cartItems: [
    {
      product: {
        _id: 'prod-123',
        name: 'Quantum Headphones',
        price: 100,
        stock: 5,
        storeId: 'store-abc',
        images: [],
        category: 'electronics',
        description: 'Noise cancelling',
      },
      quantity: 2,
    },
  ],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  isCartOpen: false,
  setIsCartOpen: vi.fn(),
  isCheckoutOpen: true,
  setIsCheckoutOpen: vi.fn(),
}

describe('CheckoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders shipping form fields and item summaries', () => {
    render(
      <CartContext.Provider value={mockCartContext}>
        <CheckoutModal isOpen={true} onClose={vi.fn()} />
      </CartContext.Provider>
    )

    expect(screen.getByText('Shipping Information')).toBeDefined()
    expect(screen.getByPlaceholderText('123 Commerce Way')).toBeDefined()
    expect(screen.getByText('Quantum Headphones')).toBeDefined()
    expect(screen.getByText('Qty: 2')).toBeDefined()
    // Total subtotal = 200, shipping = 9.99, tax (8%) = 16. Total = 225.99
    expect(screen.getByText('$225.99')).toBeDefined()
  })

  it('validates fields, proceeds to payment simulation, and places order successfully', async () => {
    // 1. Mock response for POST /api/orders
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ parentOrderId: 'parent_abc123' }),
    })

    // 2. Mock response for POST /api/payments/checkout-session
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sessionId: 'sess_123',
        parentOrderId: 'parent_abc123',
        totalAmount: 225.99,
        splitDetails: [
          {
            storeName: 'Test Store',
            amount: 200,
            commission: 20,
            payout: 180,
          },
        ],
      }),
    })

    // 3. Mock response for POST /api/payments/webhook
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(
      <CartContext.Provider value={mockCartContext}>
        <CheckoutModal isOpen={true} onClose={vi.fn()} onNavigateToOrders={vi.fn()} />
      </CartContext.Provider>
    )

    // Fill in shipping inputs
    fireEvent.change(screen.getByPlaceholderText('123 Commerce Way'), {
      target: { value: '456 Tech Blvd' },
    })
    fireEvent.change(screen.getByPlaceholderText('San Francisco'), { target: { value: 'Austin' } })
    fireEvent.change(screen.getByPlaceholderText('CA'), { target: { value: 'TX' } })
    fireEvent.change(screen.getByPlaceholderText('94103'), { target: { value: '78701' } })

    const proceedBtn = screen.getByText('Proceed to Payment ($225.99)')
    fireEvent.click(proceedBtn)

    // Verify orders and checkout session creation fetches are called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-jwt-token',
          },
          body: JSON.stringify({
            items: [{ productId: 'prod-123', quantity: 2 }],
            shippingAddress: {
              street: '456 Tech Blvd',
              city: 'Austin',
              state: 'TX',
              zipCode: '78701',
              country: 'United States',
            },
          }),
        })
      )
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/checkout-session',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentOrderId: 'parent_abc123' }),
        })
      )
    })

    // Verify it is on step === 'payment'
    await waitFor(() => {
      expect(screen.getByText('Stripe Split Payout Ledger Details')).toBeDefined()
      expect(screen.getByText('Simulate Payment ($225.99)')).toBeDefined()
    })

    // Fill in cardholder name input
    fireEvent.change(screen.getByPlaceholderText('Jane Doe'), {
      target: { value: 'John Smith' },
    })

    // Submit simulated payment
    const simulateBtn = screen.getByText('Simulate Payment ($225.99)')
    fireEvent.click(simulateBtn)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/payments/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentOrderId: 'parent_abc123' }),
        })
      )
    })

    // Verify success screen is shown
    await waitFor(() => {
      expect(screen.getByText('Payment Successful & Order Placed!')).toBeDefined()
      expect(screen.getByText('parent_abc123')).toBeDefined()
    })
  })
})
