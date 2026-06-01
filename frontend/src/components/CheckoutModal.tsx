import React, { useState, useEffect } from 'react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { X, CreditCard, Ship, ShoppingBag, Loader2, Landmark, CheckCircle2, Tag, Smartphone, Wallet, ArrowRight, ShieldCheck, QrCode } from 'lucide-react'
import { formatPrice } from '@/utils/utils'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToOrders?: () => void
}

interface SplitDetail {
  storeId: string
  storeName: string
  amount: number
  commission: number
  payout: number
}

interface SessionDetails {
  sessionId: string
  parentOrderId: string
  totalAmount: number
  splitDetails: SplitDetail[]
}

export function CheckoutModal({ isOpen, onClose, onNavigateToOrders }: CheckoutModalProps) {
  const { cartItems, clearCart } = useCart()
  const { user, token, currency } = useAuth()

  // Steps: shipping -> payment -> success
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentParentOrderId, setCurrentParentOrderId] = useState<string | null>(null)
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null)

  // Billing address state
  // Detailed Billing / Shipping address state (aligns with Profile page address fields)
  const [detailedAddress, setDetailedAddress] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    contactNumber: '',
    alternateNumber: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
  })



  // Saved profile context cache
  const [profileAddress, setProfileAddress] = useState<any>(null)
  const [profilePayments, setProfilePayments] = useState<any>(null)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [wonCoupons, setWonCoupons] = useState<any[]>([])

  // Payment method options
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet' | 'paypal' | 'others'>('card')
  const [selectedUpiApp, setSelectedUpiApp] = useState<'paytm' | 'gpay' | 'phonepe' | 'bhim' | null>('gpay')
  const [selectedBank, setSelectedBank] = useState<string>('hdfc')
  const [selectedWallet, setSelectedWallet] = useState<string>('paytm')

  // Card details
  const [cardDetails, setCardDetails] = useState({
    number: '4242 4242 4242 4242',
    expiry: '12/28',
    cvv: '123',
    name: '',
  })

  const [upiId, setUpiId] = useState('')

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const shipping = 9.99
  const tax = Math.max(0, (subtotal - couponDiscount) * 0.08)
  const total = Math.max(0, subtotal - couponDiscount + shipping + tax)

  // Helper to save address / payment details back to the user's profile
  const saveToProfile = async (addressData?: typeof detailedAddress, paymentData?: any) => {
    if (!token) return
    try {
      const body: any = {}
      if (addressData) {
        body.address = addressData
      }
      if (paymentData) {
        body.savedPaymentDetails = paymentData
      }
      await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error('Auto-save to profile failed:', err)
    }
  }

  // 1. Fetch address and payment info from Profile on mount
  useEffect(() => {
    if (isOpen) {
      // Reset checkout wizard states
      setStep('shipping')
      setError(null)
      setCurrentParentOrderId(null)
      setSessionDetails(null)
      setCouponCode('')
      setCouponDiscount(0)
      setCouponApplied(false)
      setCouponError(null)
      setIsLoading(false)

      const saved = localStorage.getItem('won_coupons')
      if (saved) {
        try {
          setWonCoupons(JSON.parse(saved))
        } catch {
          setWonCoupons([])
        }
      }

      if (token) {
        fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) {
              if (data.user.address) {
                setProfileAddress(data.user.address)
                setDetailedAddress({
                  fullName: data.user.address.fullName || '',
                  addressLine1: data.user.address.addressLine1 || '',
                  addressLine2: data.user.address.addressLine2 || '',
                  contactNumber: data.user.address.contactNumber || '',
                  alternateNumber: data.user.address.alternateNumber || '',
                  city: data.user.address.city || '',
                  district: data.user.address.district || '',
                  state: data.user.address.state || '',
                  country: data.user.address.country || 'India',
                  pincode: data.user.address.pincode || '',
                })

              }
              if (data.user.savedPaymentDetails) {
                setProfilePayments(data.user.savedPaymentDetails)
                setCardDetails({
                  number: data.user.savedPaymentDetails.cardNumber || '4242 4242 4242 4242',
                  expiry: data.user.savedPaymentDetails.cardExpiry || '12/28',
                  cvv: '123',
                  name: data.user.savedPaymentDetails.cardHolderName || data.user.name || '',
                })
                setUpiId(data.user.savedPaymentDetails.upiId || '')
                if (data.user.savedPaymentDetails.upiId) {
                  setPaymentMethod('upi')
                }
              }
            }
          })
          .catch((err) => console.error('Checkout profile auto-fill failed:', err))
      }
    }
  }, [isOpen, token])

  // Automatically skip shipping form and proceed to payment for admin@lomentra.com
  useEffect(() => {
    if (isOpen && user?.email === 'admin@lomentra.com' && step === 'shipping') {
      handleExpressCheckout()
    }
  }, [isOpen, user, step])



  const handleDetailedAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDetailedAddress((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCardDetails((prev) => ({ ...prev, [name]: value }))
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !token) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const firstItem = cartItems[0]
      const storeId = firstItem?.product?.storeId && typeof firstItem.product.storeId === 'object'
        ? (firstItem.product.storeId as any)._id
        : firstItem?.product?.storeId
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, storeId, subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setCouponDiscount(data.discount)
        setCouponApplied(true)
      } else {
        setCouponError(data.error || 'Invalid coupon')
        setCouponDiscount(0)
        setCouponApplied(false)
      }
    } catch {
      setCouponError('Failed to validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  // 2. Submit Shipping -> Create Order (Pending Payment)
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const { fullName, addressLine1, city, state, country, pincode, contactNumber } = detailedAddress
    if (!fullName.trim() || !addressLine1.trim() || !city.trim() || !state.trim() || !country.trim() || !pincode.trim() || !contactNumber.trim()) {
      setError('Please fill in all required shipping fields.')
      return
    }

    setIsLoading(true)
    try {
      // Auto-save detailed address to user profile
      if (token) {
        await saveToProfile(detailedAddress)
      }

      // Construct flat shipping address formatted for the order schema
      const streetFormatted = `${fullName} | ${addressLine1} ${detailedAddress.addressLine2 || ''} | Tel: ${contactNumber} ${detailedAddress.alternateNumber ? 'Alt: ' + detailedAddress.alternateNumber : ''}`
      const flatShippingAddress = {
        street: streetFormatted,
        city,
        state,
        zipCode: pincode,
        country,
      }

      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: flatShippingAddress,
        couponCode: couponApplied ? couponCode : undefined,
        discount: couponApplied ? couponDiscount : undefined,
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to place orders')
      }

      const pOrderId = orderData.parentOrderId
      setCurrentParentOrderId(pOrderId)

      const sessionRes = await fetch('/api/payments/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentOrderId: pOrderId }),
      })

      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to initialize payment session')
      }

      setSessionDetails(sessionData)
      setStep('payment')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Shipping submit error')
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Direct/Express Checkout Bypassing the Form
  const handleExpressCheckout = async () => {
    setError(null)
    setIsLoading(true)

    // Construct shipping address from profile cache or fall back to dummy details
    const addressToUse = profileAddress && profileAddress.addressLine1 ? {
      street: `${profileAddress.fullName || user?.name || 'Customer'} | ${profileAddress.addressLine1} ${profileAddress.addressLine2 || ''} | Tel: ${profileAddress.contactNumber}`,
      city: profileAddress.city,
      state: profileAddress.state,
      zipCode: profileAddress.pincode,
      country: profileAddress.country || 'India',
    } : {
      street: `${user?.name || 'Customer'} | 102 Sector 4, MG Road | Tel: 9876543210`,
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India',
    }

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: addressToUse,
        couponCode: couponApplied ? couponCode : undefined,
        discount: couponApplied ? couponDiscount : undefined,
      }

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to place orders')
      }

      const pOrderId = orderData.parentOrderId
      setCurrentParentOrderId(pOrderId)

      const sessionRes = await fetch('/api/payments/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentOrderId: pOrderId }),
      })

      const sessionData = await sessionRes.json()
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to initialize payment session')
      }

      setSessionDetails(sessionData)
      setStep('payment')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Express checkout failed')
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Submit Payment simulation
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentParentOrderId) return

    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentOrderId: currentParentOrderId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Auto-save payment details to user profile
        if (token) {
          const paymentData = {
            upiId: paymentMethod === 'upi' ? upiId : profilePayments?.upiId || '',
            cardNumber: paymentMethod === 'card' ? cardDetails.number : profilePayments?.cardNumber || '',
            cardHolderName: paymentMethod === 'card' ? cardDetails.name : profilePayments?.cardHolderName || '',
            cardExpiry: paymentMethod === 'card' ? cardDetails.expiry : profilePayments?.cardExpiry || '',
          }
          await saveToProfile(undefined, paymentData)
        }
        clearCart()
        setStep('success')
      } else {
        setError(data.error || 'Payment simulation failed. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('A network error occurred confirming payment simulation.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-h-[95vh] md:max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Left Side: Forms */}
        <div className="flex-1 p-6 md:p-8 overflow-y-visible md:overflow-y-auto space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              {step === 'shipping' && (
                <>
                  <Ship className="h-5 w-5 text-primary" />
                  Checkout Shipping Address
                </>
              )}
              {step === 'payment' && (
                <>
                  <CreditCard className="h-5 w-5 text-primary" />
                  Interactive Multi-Option Payment Gateway
                </>
              )}
              {step === 'success' && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Order Placed Successfully!
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {error && (
            <div className="p-3 text-[10px] font-bold text-rose-500 bg-rose-500/10 rounded-lg border border-rose-500/20">
              {error}
            </div>
          )}

          {step === 'shipping' && (
            <div className="space-y-4">
              {/* Express Checkout Trigger */}
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                    ⚡ Express Checkout
                  </h4>
                  <p className="text-[10px] text-muted-foreground max-w-sm">
                    {profileAddress ? 'Auto-populate your saved profile address details and proceed instantly to payment.' : 'Skip the form and checkout immediately with default delivery parameters.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExpressCheckout}
                  disabled={isLoading}
                  className="px-4 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] hover:bg-primary/95 transition flex items-center gap-1 w-full sm:w-auto justify-center shadow-lg shadow-primary/10"
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Express Pay'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border/60"></div>
                <span className="flex-shrink mx-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Or Fill Address</span>
                <div className="flex-grow border-t border-border/60"></div>
              </div>

              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={detailedAddress.fullName}
                      onChange={handleDetailedAddressChange}
                      placeholder="e.g. John Doe"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={detailedAddress.addressLine1}
                      onChange={handleDetailedAddressChange}
                      placeholder="Street Address, P.O. Box"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={detailedAddress.addressLine2}
                      onChange={handleDetailedAddressChange}
                      placeholder="Apartment, Suite, Unit"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={detailedAddress.contactNumber}
                      onChange={handleDetailedAddressChange}
                      placeholder="Primary Phone"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Alternate Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="alternateNumber"
                      value={detailedAddress.alternateNumber}
                      onChange={handleDetailedAddressChange}
                      placeholder="Secondary Phone"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={detailedAddress.city}
                      onChange={handleDetailedAddressChange}
                      placeholder="City"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      District (Optional)
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={detailedAddress.district}
                      onChange={handleDetailedAddressChange}
                      placeholder="District"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={detailedAddress.state}
                      onChange={handleDetailedAddressChange}
                      placeholder="State"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={detailedAddress.country}
                      onChange={handleDetailedAddressChange}
                      placeholder="Country"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                      Pincode
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={detailedAddress.pincode}
                      onChange={handleDetailedAddressChange}
                      placeholder="Postal Code"
                      className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>
                </div>

                {/* Coupon Code Input */}
                <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. LOM100"
                      disabled={couponApplied}
                      className="flex-1 h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                    />
                    {couponApplied ? (
                      <button
                        type="button"
                        onClick={() => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(''); setCouponError(null) }}
                        className="h-9 px-3 rounded-lg border border-rose-500/30 text-rose-500 text-[10px] font-bold hover:bg-rose-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                      >
                        {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                      </button>
                    )}
                  </div>
                  {couponError && <p className="text-[10px] text-rose-500 font-medium">{couponError}</p>}
                  {couponApplied && (
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Discount applied: -${couponDiscount.toFixed(2)}
                    </p>
                  )}

                  {/* Quick Select Won Coupons Shelf */}
                  {wonCoupons.length > 0 && !couponApplied && (
                    <div className="mt-2.5 space-y-1.5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wide">
                        Quick Apply Won Coupons:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {wonCoupons.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setCouponCode(c.code)
                            }}
                            className="px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[9px] font-black hover:bg-primary/10 transition"
                          >
                            {c.code} ({c.discountText})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || cartItems.length === 0}
                  className="w-full h-10 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-colors mt-4 disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Reserving Stock...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Proceed to Payment (${total.toFixed(2)})
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 'payment' && sessionDetails && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Payment Methods Layout */}
              <div className="flex flex-col md:flex-row border border-border rounded-2xl overflow-hidden min-h-[350px]">
                
                {/* Payment Selection Sidebar */}
                <div className="w-full md:w-48 bg-muted/20 border-b md:border-b-0 md:border-r border-border p-2 space-y-1">
                  <p className="text-[9px] font-black text-muted-foreground uppercase px-2.5 py-1 tracking-wider">
                    Select Method
                  </p>
                  {[
                    { id: 'upi', label: 'UPI / QR Code', icon: Smartphone },
                    { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Landmark },
                    { id: 'wallet', label: 'Mobile Wallets', icon: Wallet },
                    { id: 'paypal', label: 'PayPal Checkout', icon: CreditCard },
                    { id: 'others', label: 'Others (COD)', icon: ShieldCheck },
                  ].map((method) => {
                    const Icon = method.icon
                    const isSelected = paymentMethod === method.id
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {method.label}
                      </button>
                    )
                  })}
                </div>

                {/* Method detail forms */}
                <div className="flex-1 p-5 bg-card/40 overflow-y-auto">
                  
                  {/* UPI Method */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-foreground">UPI Payment & QR Code</h4>
                      <p className="text-[10px] text-muted-foreground">Select a client application or scan the generated merchant QR code to transfer funds.</p>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'paytm', label: 'Paytm' },
                          { id: 'gpay', label: 'GPay' },
                          { id: 'phonepe', label: 'PhonePe' },
                          { id: 'bhim', label: 'BHIM UPI' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id as any)}
                            className={`py-2 rounded-xl text-[10px] font-black border text-center transition-all ${
                              selectedUpiApp === app.id
                                ? 'bg-primary/10 text-primary border-primary'
                                : 'border-border bg-background hover:bg-accent text-muted-foreground'
                            }`}
                          >
                            {app.label}
                          </button>
                        ))}
                      </div>

                      {/* UPI ID input field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Enter / Edit UPI ID
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. name@upi"
                          className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          required={paymentMethod === 'upi'}
                        />
                      </div>

                      {/* Display QR code */}
                      <div className="bg-muted/30 border border-border p-4 rounded-xl flex flex-col items-center justify-center space-y-3">
                        <div className="bg-white p-2.5 rounded-xl shadow-md border border-border">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=lomentra@upi&pn=Lomentra&am=${total.toFixed(2)}`}
                            alt="UPI QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <div className="text-center space-y-0.5">
                          <p className="text-[10px] font-black text-foreground flex items-center gap-1 justify-center">
                            <QrCode className="h-3.5 w-3.5 text-primary" />
                            Scan QR Code to Pay
                          </p>
                          <p className="text-[9px] text-muted-foreground">Amount: {formatPrice(total, currency)} to lomentra@upi</p>
                        </div>
                      </div>

                      {profilePayments?.upiId && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-primary uppercase">Saved Profile UPI ID</p>
                            <p className="text-xs font-bold text-foreground">{profilePayments.upiId}</p>
                          </div>
                          <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Pre-filled</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Method */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      {/* Glassmorphic Mock Credit Card */}
                      <div className="relative overflow-hidden h-36 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-4 text-white flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-400">Merchant Payment</p>
                            <p className="text-xs font-bold mt-1 text-slate-100">{cardDetails.name || 'CARDHOLDER NAME'}</p>
                          </div>
                          <div className="h-6 w-9 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                            TEST
                          </div>
                        </div>
                        <div>
                          <p className="font-mono text-sm tracking-widest text-slate-200">{cardDetails.number}</p>
                          <div className="flex gap-4 mt-2 text-[10px] text-slate-400">
                            <div>
                              <span className="block text-[8px] uppercase text-slate-500">Expires</span>
                              <span>{cardDetails.expiry}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] uppercase text-slate-500">CVV</span>
                              <span>{cardDetails.cvv}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={cardDetails.name}
                            onChange={handleCardChange}
                            placeholder="Jane Doe"
                            className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                              Card Number
                            </label>
                            <input
                              type="text"
                              name="number"
                              value={cardDetails.number}
                              onChange={handleCardChange}
                              className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={cardDetails.cvv}
                              onChange={handleCardChange}
                              className="w-full h-9 rounded-lg border border-input bg-muted/40 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking */}
                  {paymentMethod === 'netbanking' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-foreground">Net Banking</h4>
                      <p className="text-[10px] text-muted-foreground">Select your bank from the popular banks list or search from the dropdown selector.</p>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'sbi', label: 'State Bank of India' },
                          { id: 'hdfc', label: 'HDFC Bank' },
                          { id: 'icici', label: 'ICICI Bank' },
                          { id: 'axis', label: 'Axis Bank' },
                        ].map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            onClick={() => setSelectedBank(bank.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                              selectedBank === bank.id
                                ? 'bg-primary/10 text-primary border-primary'
                                : 'border-border bg-background hover:bg-accent text-muted-foreground'
                            }`}
                          >
                            {bank.label}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Other Banks</label>
                        <select
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                        >
                          <option value="sbi">State Bank of India</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                          <option value="kotak">Kotak Mahindra Bank</option>
                          <option value="pnb">Punjab National Bank</option>
                          <option value="boi">Bank of India</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Wallets */}
                  {paymentMethod === 'wallet' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-foreground">Mobile Wallets</h4>
                      <p className="text-[10px] text-muted-foreground">Link and deduct funds instantly from your digital wallets.</p>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'paytm', label: 'Paytm Wallet' },
                          { id: 'phonepe', label: 'PhonePe Wallet / Wallets' },
                          { id: 'amazon', label: 'Amazon Pay' },
                        ].map((wallet) => (
                          <button
                            key={wallet.id}
                            type="button"
                            onClick={() => setSelectedWallet(wallet.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-bold flex justify-between items-center transition-all ${
                              selectedWallet === wallet.id
                                ? 'bg-primary/10 text-primary border-primary'
                                : 'border-border bg-background hover:bg-accent text-muted-foreground'
                            }`}
                          >
                            <span>{wallet.label}</span>
                            <span className="text-[9px] text-muted-foreground">Deduct {formatPrice(total, currency)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PayPal */}
                  {paymentMethod === 'paypal' && (
                    <div className="space-y-4 text-center py-6">
                      <div className="h-10 w-28 bg-[#003087] text-white flex items-center justify-center font-black rounded-lg mx-auto text-sm italic shadow-md">
                        PayPal
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground">Pay safely with PayPal</p>
                        <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                          Click pay below to open a secure PayPal mock overlay window to authorize the debit of {formatPrice(total, currency)}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Others (COD) */}
                  {paymentMethod === 'others' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-foreground">Other Options</h4>
                      
                      <div className="p-4 bg-muted/40 border border-border rounded-xl space-y-1">
                        <p className="text-xs font-bold text-foreground">Cash on Delivery (COD)</p>
                        <p className="text-[10px] text-muted-foreground leading-normal">
                          Pay with cash or digital UPI upon doorstep parcel receipt. Additional handling fees of {formatPrice(0, currency)} apply.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Split Details Ledger */}
              <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Landmark className="h-4 w-4 text-primary" />
                  Stripe Split Payout Ledger Details
                </h3>
                <p className="text-[10px] text-muted-foreground">
                  The checkout subtotal is partitioned by store, allocating a 10% platform fee and routing 90% to the merchant accounts automatically:
                </p>
                <div className="space-y-2 mt-2">
                  {sessionDetails.splitDetails.map((split, i) => (
                    <div key={i} className="text-[10px] border-b border-border/50 pb-2 last:border-b-0 last:pb-0">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>{split.storeName}</span>
                        <span>{formatPrice(split.amount, currency)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground mt-0.5">
                        <span>Platform Commission (10%)</span>
                        <span className="text-rose-500/85">-{formatPrice(split.commission, currency)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-500 font-medium">
                        <span>Vendor Net Payout Share (90%)</span>
                        <span>+{formatPrice(split.payout, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10 transition-all mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing Split Transaction...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Checkout Payment ({formatPrice(total, currency)})
                  </>
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-10 space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto text-lg font-bold">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Payment Successful & Order Placed!</h3>
                <p className="text-[10px] text-muted-foreground">
                  Your tracking master invoice is:{' '}
                  <code className="font-mono text-foreground">{currentParentOrderId}</code>.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Funds have been split. Merchant vendors will begin fulfillment shortly.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    if (onNavigateToOrders) {
                      onNavigateToOrders()
                    }
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow"
                >
                  Track Order Shipment
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Order Summary Panel */}
        <div className="w-full md:w-80 bg-muted/30 border-t md:border-t-0 md:border-l border-border p-6 md:p-8 flex flex-col justify-between overflow-y-visible md:overflow-y-auto max-h-none md:max-h-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Cart Summary
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 hidden md:block"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List items */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.product._id} className="flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-extrabold text-foreground shrink-0">
                    {formatPrice(item.product.price * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="border-t border-border/80 pt-4 mt-6 space-y-2">
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-[11px] font-semibold text-emerald-500">
                <span>Discount ({couponCode})</span>
                <span>-{formatPrice(couponDiscount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Shipping</span>
              <span>{formatPrice(shipping, currency)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Estimated Tax (8%)</span>
              <span>{formatPrice(tax, currency)}</span>
            </div>
            <div className="flex justify-between text-xs font-extrabold text-foreground pt-2 border-t border-border/40">
              <span>Total</span>
              <span>{formatPrice(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
