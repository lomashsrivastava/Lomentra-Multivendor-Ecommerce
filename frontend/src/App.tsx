import { useState } from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { CartProvider } from '@/providers/CartProvider'
import { ToastProvider } from '@/providers/ToastProvider'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { StorefrontLayout } from '@/layouts/StorefrontLayout'
import { Home } from '@/pages/Home'
import { VendorDashboard } from '@/pages/VendorDashboard'
import { AdminDashboard } from '@/pages/AdminDashboard'
import { SystemHealth } from '@/pages/SystemHealth'
import CustomerOrders from '@/pages/CustomerOrders'
import StorePage from '@/pages/StorePage'
import ProfilePage from '@/pages/ProfilePage'
import { AuthModal } from '@/components/AuthModal'
import { CartDrawer } from '@/components/CartDrawer'
import { CheckoutModal } from '@/components/CheckoutModal'
import WishlistDrawer from '@/components/WishlistDrawer'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeIn } from '@/animations/presets'
import { ShieldAlert, Clock, Lock } from 'lucide-react'

// Brand New Views
import { CategoriesPage } from '@/pages/CategoriesPage'
import { FlashDealsPage } from '@/pages/FlashDealsPage'
import { BestSellersPage } from '@/pages/BestSellersPage'
import { NewArrivalsPage } from '@/pages/NewArrivalsPage'
import { TopBrandsPage } from '@/pages/TopBrandsPage'
import { WishlistPage } from '@/pages/WishlistPage'
import { MessagesPage } from '@/pages/MessagesPage'
import { AIAssistantPage } from '@/pages/AIAssistantPage'
import { SummerSalePage } from '@/pages/SummerSalePage'
import { CouponsPage } from '@/pages/CouponsPage'

function MainContent() {
  const [currentView, setCurrentView] = useState('home')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isWishlistOpen, setIsWishlistOpen] = useState(false)
  const [activeStoreSlug, setActiveStoreSlug] = useState<string | null>(null)
  const { user } = useAuth()
  const { isCheckoutOpen, setIsCheckoutOpen } = useCart()

  const [categoriesActiveCategory, setCategoriesActiveCategory] = useState<any | null>(null)
  const [categoriesSelectedPath, setCategoriesSelectedPath] = useState<any[]>([])

  const handleNavigateToStore = (slug: string) => {
    setActiveStoreSlug(slug)
    setCurrentView('store')
  }

  // Guard routes based on roles
  const renderActiveView = () => {
    // 1. Guard Vendor dashboard
    if (currentView === 'vendor') {
      if (!user) {
        return (
          <AccessDeniedState
            icon={Lock}
            title="Authentication Required"
            desc="Sign in to your merchant account to access the Vendor Control Center."
            onAction={() => setIsAuthModalOpen(true)}
            actionLabel="Sign In Now"
          />
        )
      }
      if (user.role !== 'vendor' && user.role !== 'admin') {
        return (
          <AccessDeniedState
            icon={ShieldAlert}
            title="Merchant Clearance Required"
            desc="Your account is registered as a customer. Only registered vendors have access to these settings."
          />
        )
      }
      if (user.status === 'pending') {
        return (
          <AccessDeniedState
            icon={Clock}
            title="Application Pending Approval"
            desc="Your registration request is being verified by platform administrators. You will gain access once audited."
          />
        )
      }
      return <VendorDashboard />
    }

    // 2. Guard Admin dashboard
    if (currentView === 'admin') {
      if (!user) {
        return (
          <AccessDeniedState
            icon={Lock}
            title="Admin Authentication Required"
            desc="Sign in with administrative credentials to access master platform controls."
            onAction={() => setIsAuthModalOpen(true)}
            actionLabel="Admin Sign In"
          />
        )
      }
      if (user.role !== 'admin') {
        return (
          <AccessDeniedState
            icon={ShieldAlert}
            title="Forbidden: Master Console"
            desc="Access restricted. You require platform administrator credentials to load this dashboard."
          />
        )
      }
      return <AdminDashboard />
    }

    // 3. Guard System Health diagnostic console
    if (currentView === 'health') {
      if (!user) {
        return (
          <AccessDeniedState
            icon={Lock}
            title="Admin Access Required"
            desc="Sign in as an administrator to monitor real-time network and database diagnostics."
            onAction={() => setIsAuthModalOpen(true)}
            actionLabel="Admin Login"
          />
        )
      }
      if (user.role !== 'admin') {
        return (
          <AccessDeniedState
            icon={ShieldAlert}
            title="Forbidden: Core Monitoring"
            desc="Access restricted. Real-time platform log streaming is restricted to network administrators."
          />
        )
      }
      return <SystemHealth />
    }

    // 4. Customer Orders history page
    if (currentView === 'orders') {
      if (!user) {
        return (
          <AccessDeniedState
            icon={Lock}
            title="Authentication Required"
            desc="Sign in to your account to view your purchase history and track active packages."
            onAction={() => setIsAuthModalOpen(true)}
            actionLabel="Sign In Now"
          />
        )
      }
      return <CustomerOrders />
    }

    // 5. Profile Page
    if (currentView === 'profile') {
      if (!user) {
        return (
          <AccessDeniedState
            icon={Lock}
            title="Authentication Required"
            desc="Sign in to manage your account settings."
            onAction={() => setIsAuthModalOpen(true)}
            actionLabel="Sign In Now"
          />
        )
      }
      return <ProfilePage />
    }

    // 6. Public Store Page
    if (currentView === 'store' && activeStoreSlug) {
      return (
        <StorePage
          storeSlug={activeStoreSlug}
          onBack={() => {
            setCurrentView('home')
            setActiveStoreSlug(null)
          }}
        />
      )
    }

    // 7. Lomentra evolved storefront views
    if (currentView === 'categories') {
      return (
        <CategoriesPage
          activeCategory={categoriesActiveCategory}
          setActiveCategory={setCategoriesActiveCategory}
          selectedPath={categoriesSelectedPath}
          setSelectedPath={setCategoriesSelectedPath}
        />
      )
    }
    if (currentView === 'flash-deals') {
      return <FlashDealsPage />
    }
    if (currentView === 'best-sellers') {
      return <BestSellersPage />
    }
    if (currentView === 'new-arrivals') {
      return <NewArrivalsPage />
    }
    if (currentView === 'top-brands') {
      return <TopBrandsPage />
    }
    if (currentView === 'wishlist') {
      return <WishlistPage />
    }
    if (currentView === 'messages') {
      return <MessagesPage />
    }
    if (currentView === 'ai-assistant') {
      return <AIAssistantPage />
    }
    if (currentView === 'summer-sale') {
      return <SummerSalePage />
    }
    if (currentView === 'coupons') {
      return <CouponsPage />
    }

    return (
      <Home
        onNavigateToStore={handleNavigateToStore}
        onViewChange={setCurrentView}
        onSelectCategory={(cat, path) => {
          setCategoriesActiveCategory(cat)
          setCategoriesSelectedPath(path)
        }}
      />
    )
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* Ambient Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <StorefrontLayout
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (activeStoreSlug || '')}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeIn}
            transition={{ duration: 0.25 }}
            className="relative z-10"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </StorefrontLayout>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <CartDrawer />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onNavigateToOrders={() => {
          setIsCheckoutOpen(false)
          setCurrentView('orders')
        }}
      />
    </div>
  )
}

interface AccessDeniedProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  onAction?: () => void
  actionLabel?: string
}

function AccessDeniedState({ icon: Icon, title, desc, onAction, actionLabel }: AccessDeniedProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 md:p-8 text-center space-y-6 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
        {onAction && actionLabel && (
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors shadow shadow-primary/10"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="lomentra-theme">
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <MainContent />
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
