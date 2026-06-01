import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, UserCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, error, clearError } = useAuth()
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Form Fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'customer' | 'vendor'>('customer')

  const toggleTab = () => {
    setIsLoginTab((prev) => !prev)
    setLocalError(null)
    clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email || !password) {
      setLocalError('All fields are required')
      return
    }

    if (!isLoginTab && !name) {
      setLocalError('Name is required')
      return
    }

    setIsLoading(true)
    let result

    if (isLoginTab) {
      result = await login(email, password)
    } else {
      result = await register(name, email, password, role)
    }

    setIsLoading(false)

    if (result.success) {
      // Clear forms
      setEmail('')
      setPassword('')
      setName('')
      setRole('customer')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl p-6 md:p-8"
          >
            {/* Top decorative animated gradient strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 auth-modal-cool-bg" />

            {/* Blurry ambient decorative blobs */}
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full auth-modal-cool-bg opacity-15 blur-2xl pointer-events-none ambient-blob" />
            <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-violet-600 opacity-15 blur-2xl pointer-events-none ambient-blob" style={{ animationDelay: '2.5s' }} />

            {/* Close Button */}
            <button
              type="button"
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors z-20"
              onClick={onClose}
              aria-label="Close auth dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title / Description */}
            <div className="text-center space-y-1.5 mb-6 relative z-10">
              <h3 className="text-xl font-black tracking-tight text-foreground">
                {isLoginTab ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isLoginTab
                  ? 'Access your Lomentra marketplace account'
                  : 'Join as customer or configure a seller shop'}
              </p>
            </div>

            {/* Tab switchers */}
            <div className="flex rounded-xl bg-muted p-1 mb-6 text-xs font-bold relative z-10">
              <button
                type="button"
                className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
                  isLoginTab
                    ? 'bg-card text-foreground shadow font-extrabold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => !isLoginTab && toggleTab()}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
                  !isLoginTab
                    ? 'bg-card text-foreground shadow font-extrabold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => isLoginTab && toggleTab()}
              >
                Sign Up
              </button>
            </div>

            {/* Error alerts */}
            {(localError || error) && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl mb-4 animate-shake relative z-10">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                <p className="flex-1 leading-snug">{localError || error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              {!isLoginTab && (
                <div className="space-y-1.5">
                  <label
                    className="text-[10px] font-black text-muted-foreground uppercase tracking-wider"
                    htmlFor="auth-name"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 rounded-xl border border-input bg-muted/20 pl-10 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus:border-primary transition-all duration-200"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-wider"
                  htmlFor="auth-email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="email@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-muted/20 pl-10 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  className="text-[10px] font-black text-muted-foreground uppercase tracking-wider"
                  htmlFor="auth-password"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-xl border border-input bg-muted/20 pl-10 pr-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              {!isLoginTab && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                    I want to register as
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        role === 'customer'
                          ? 'border-primary bg-primary/10 text-primary shadow shadow-primary/10'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      onClick={() => setRole('customer')}
                    >
                      <User className="h-4 w-4" />
                      Customer
                    </button>
                    <button
                      type="button"
                      className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                        role === 'vendor'
                          ? 'border-primary bg-primary/10 text-primary shadow shadow-primary/10'
                          : 'border-border bg-muted/20 text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                      onClick={() => setRole('vendor')}
                    >
                      <UserCheck className="h-4 w-4" />
                      Vendor / Seller
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/95 shadow-lg shadow-primary/15 flex items-center justify-center gap-2 mt-6 disabled:opacity-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] premium-glow-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : isLoginTab ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
