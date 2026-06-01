import { useState, useEffect } from 'react'
import { User, Mail, Shield, Calendar, Lock, Save, Loader2, Camera, MapPin, Phone, CreditCard, Globe } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

export default function ProfilePage() {
  const { user, token, setUser, currency, setCurrency } = useAuth()
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  // Address State
  const [fullName, setFullName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [alternateNumber, setAlternateNumber] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [pincode, setPincode] = useState('')

  // Payment Details State
  const [upiId, setUpiId] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      if (user.address) {
        setFullName(user.address.fullName || '')
        setAddressLine1(user.address.addressLine1 || '')
        setAddressLine2(user.address.addressLine2 || '')
        setContactNumber(user.address.contactNumber || '')
        setAlternateNumber(user.address.alternateNumber || '')
        setCity(user.address.city || '')
        setDistrict(user.address.district || '')
        setState(user.address.state || '')
        setCountry(user.address.country || '')
        setPincode(user.address.pincode || '')
      }
      if (user.savedPaymentDetails) {
        setUpiId(user.savedPaymentDetails.upiId || '')
        setCardNumber(user.savedPaymentDetails.cardNumber || '')
        setCardHolderName(user.savedPaymentDetails.cardHolderName || '')
        setCardExpiry(user.savedPaymentDetails.cardExpiry || '')
      }
    }
  }, [user])

  // Fetch full profile (includes address/payments if missing from initial token login response)
  useEffect(() => {
    if (!token) return
    fetch('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          if (data.user.avatarUrl) setAvatarUrl(data.user.avatarUrl)
          if (data.user.address) {
            setFullName(data.user.address.fullName || '')
            setAddressLine1(data.user.address.addressLine1 || '')
            setAddressLine2(data.user.address.addressLine2 || '')
            setContactNumber(data.user.address.contactNumber || '')
            setAlternateNumber(data.user.address.alternateNumber || '')
            setCity(data.user.address.city || '')
            setDistrict(data.user.address.district || '')
            setState(data.user.address.state || '')
            setCountry(data.user.address.country || '')
            setPincode(data.user.address.pincode || '')
          }
          if (data.user.savedPaymentDetails) {
            setUpiId(data.user.savedPaymentDetails.upiId || '')
            setCardNumber(data.user.savedPaymentDetails.cardNumber || '')
            setCardHolderName(data.user.savedPaymentDetails.cardHolderName || '')
            setCardExpiry(data.user.savedPaymentDetails.cardExpiry || '')
          }
        }
      })
      .catch(() => {})
  }, [token])

  const handleSaveProfile = async () => {
    if (!token) return
    setLoading(true)
    setMessage(null)

    try {
      const body: Record<string, any> = {
        name,
        address: {
          fullName,
          addressLine1,
          addressLine2,
          contactNumber,
          alternateNumber,
          city,
          district,
          state,
          country,
          pincode,
        },
        savedPaymentDetails: {
          upiId,
          cardNumber,
          cardHolderName,
          cardExpiry,
        },
      }
      if (avatarUrl) body.avatarUrl = avatarUrl

      if (showPasswordForm && currentPassword && newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'New passwords do not match' })
          setLoading(false)
          return
        }
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        // Sync context user
        setUser(data.user)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordForm(false)
      } else {
        setMessage({ type: 'error', text: data.error || 'Update failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, delivery address, and payment options</p>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`px-4 py-3 rounded-xl text-xs font-semibold border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center overflow-hidden text-white text-2xl font-extrabold shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user.name[0].toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file || !token) return
                  const formData = new FormData()
                  formData.append('file', file)
                  const res = await fetch('/api/uploads', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                  })
                  if (res.ok) {
                    const data = await res.json()
                    setAvatarUrl(data.imageUrl)
                  }
                }
                input.click()
              }}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{user.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                <Shield className="h-2.5 w-2.5" />
                {user.role}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3" />
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Email (read only) */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            Email Address
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full h-10 rounded-xl border border-border bg-muted/50 px-4 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Account Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Delivery Address Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Delivery Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Address 1</label>
            <input
              type="text"
              placeholder="Street Address, P.O. Box"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Address 2</label>
            <input
              type="text"
              placeholder="Apartment, Suite, Unit (optional)"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Contact Number</label>
            <input
              type="text"
              placeholder="Primary Phone Number"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Alternate Number</label>
            <input
              type="text"
              placeholder="Secondary Phone Number (optional)"
              value={alternateNumber}
              onChange={(e) => setAlternateNumber(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">City</label>
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">District</label>
            <input
              type="text"
              placeholder="District"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">State</label>
            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Country</label>
            <input
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
            <input
              type="text"
              placeholder="Postal Code"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Saved Payment Details Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Saved Payment Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              UPI ID
            </label>
            <input
              type="text"
              placeholder="e.g. name@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Card Number</label>
            <input
              type="text"
              placeholder="e.g. 4111 1111 1111 1111"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Card Holder Name</label>
            <input
              type="text"
              placeholder="Name on Card"
              value={cardHolderName}
              onChange={(e) => setCardHolderName(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground">Card Expiry</label>
            <input
              type="text"
              placeholder="MM/YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* System Preferences Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
          <Globe className="h-4 w-4 text-primary" />
          System Preferences
        </h3>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Preferred Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD')}
            className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="INR">INR (Rs. - Indian Rupee)</option>
            <option value="USD">USD ($ - US Dollar)</option>
          </select>
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Security
          </h3>
          <button
            type="button"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </motion.div>
        )}
      </div>

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSaveProfile}
        disabled={loading}
        className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/95 disabled:opacity-50 transition-colors shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </button>
    </div>
  )
}
