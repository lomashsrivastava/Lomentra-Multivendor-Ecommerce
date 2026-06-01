import { createContext, useState, useEffect, type ReactNode } from 'react'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'admin' | 'vendor' | 'customer'
  status: 'active' | 'suspended' | 'pending'
  createdAt?: string
  avatarUrl?: string
  address?: {
    fullName: string
    addressLine1: string
    addressLine2: string
    contactNumber: string
    alternateNumber: string
    city: string
    district: string
    state: string
    country: string
    pincode: string
  }
  savedPaymentDetails?: {
    upiId: string
    cardNumber: string
    cardHolderName: string
    cardExpiry: string
  }
  currency?: 'INR' | 'USD'
}

export interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  error: string | null
  currency: 'INR' | 'USD'
  setCurrency: (c: 'INR' | 'USD') => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  clearError: () => void
  setUser: (user: UserProfile | null) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrencyState] = useState<'INR' | 'USD'>(() => {
    return (localStorage.getItem('user_currency') as 'INR' | 'USD') || 'INR'
  })

  // 1. Restore Session on Mount
  useEffect(() => {
    const checkSession = async () => {
      const savedToken = localStorage.getItem('nexus_auth_token')
      if (!savedToken) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setToken(savedToken)
          if (data.user.currency) {
            setCurrencyState(data.user.currency)
            localStorage.setItem('user_currency', data.user.currency)
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('nexus_auth_token')
        }
      } catch (err) {
        console.error('Session restoration failed:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // 2. Clear error helper
  const clearError = () => setError(null)

  // 3. Login Action
  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('nexus_auth_token', data.token)
      if (data.user.currency) {
        setCurrencyState(data.user.currency)
        localStorage.setItem('user_currency', data.user.currency)
      }
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred during sign in'
      setError(errMsg)
      return { success: false, error: errMsg }
    } finally {
      setLoading(false)
    }
  }

  // 4. Register Action
  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'vendor'
  ) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setUser(data.user)
      setToken(data.token)
      localStorage.setItem('nexus_auth_token', data.token)
      if (data.user.currency) {
        setCurrencyState(data.user.currency)
        localStorage.setItem('user_currency', data.user.currency)
      }
      return { success: true }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred during sign up'
      setError(errMsg)
      return { success: false, error: errMsg }
    } finally {
      setLoading(false)
    }
  }

  // 5. Logout Action
  const logout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout api request failed:', err)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('nexus_auth_token')
      setLoading(false)
    }
  }

  const setCurrency = async (c: 'INR' | 'USD') => {
    setCurrencyState(c)
    localStorage.setItem('user_currency', c)
    if (token) {
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ currency: c })
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        }
      } catch (err) {
        console.error('Failed to update currency on profile:', err)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        currency,
        setCurrency,
        login,
        register,
        logout,
        clearError,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
