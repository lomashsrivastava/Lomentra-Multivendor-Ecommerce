import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    setToasts((prev) => [...prev, { id, type, title, message }])

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30'
      case 'error':
        return 'border-rose-500/30'
      case 'info':
        return 'border-blue-500/30'
    }
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${getBorderColor(toast.type)} bg-card shadow-2xl backdrop-blur-xl`}
            >
              <div className="mt-0.5">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{toast.title}</p>
                {toast.message && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 h-5 w-5 inline-flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
