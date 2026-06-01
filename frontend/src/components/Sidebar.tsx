import { useState } from 'react'
import {
  Home,
  X,
  Package,
  LayoutGrid,
  Zap,
  TrendingUp,
  Sparkles,
  Award,
  Heart,
  MessageSquare,
  Bot,
  Sun,
  Tag
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ isOpen, onClose, currentView, onViewChange }: SidebarProps) {
  const [clickedItemId, setClickedItemId] = useState<string | null>(null)

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'flash-deals', label: 'Flash Deals', icon: Zap },
    { id: 'best-sellers', label: 'Best Sellers', icon: TrendingUp },
    { id: 'new-arrivals', label: 'New Arrivals', icon: Sparkles },
    { id: 'top-brands', label: 'Top Brands', icon: Award },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'coupons', label: 'Coupons', icon: Tag, isNew: true },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, isNew: true },
    { id: 'summer-sale', label: 'Summer Sale', icon: Sun },
  ]

  const handleItemClick = (id: string) => {
    setClickedItemId(id)
    setTimeout(() => {
      setClickedItemId(null)
      onClose() // Close mobile menu after animation
      onViewChange(id)
    }, 450)
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar-custom transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-24 items-center justify-between border-b border-border bg-card relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center p-0 bg-card">
            <img 
              src="/logo.png" 
              alt="Lomentra Logo" 
              className="h-full w-auto max-w-full object-contain transition-transform duration-300 scale-135 hover:scale-150" 
            />
          </div>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/80 hover:bg-accent hover:text-accent-foreground lg:hidden absolute right-4 z-10 backdrop-blur shadow-sm"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            const isClicked = clickedItemId === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 sidebar-item-hover-blink sidebar-item-click-multicolor ${
                  isClicked ? 'clicked-sparkle' : ''
                } ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                }`}
                onClick={() => handleItemClick(item.id)}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.isNew && (
                  <span className="px-1.5 py-0.5 rounded bg-primary text-[8px] font-bold text-primary-foreground uppercase tracking-wide animate-pulse">
                    New
                  </span>
                )}
              </button>
            )
          })}

          {/* Summer Sale Promo Box */}
          <div className="pt-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4 flex flex-col justify-between h-36">
              <div className="space-y-1 relative z-10">
                <span className="text-[9px] uppercase tracking-widest font-extrabold text-primary">Summer Sale</span>
                <h4 className="font-extrabold text-sm text-foreground leading-tight">Upto 50% Off</h4>
                <p className="text-[9px] text-muted-foreground font-medium">On selected items</p>
              </div>

              <button
                type="button"
                onClick={() => handleItemClick('summer-sale')}
                className="mt-2 w-max px-3 py-1.5 rounded-lg bg-primary text-[9px] font-black text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/20 relative z-10"
              >
                Shop Now
              </button>

              {/* Floating Illustration elements */}
              <div className="absolute right-0 bottom-0 w-24 h-24 opacity-80 pointer-events-none">
                <img
                  src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=150&auto=format&fit=crop&q=80"
                  alt="Summer promo model"
                  className="w-full h-full object-cover rounded-tl-full rounded-br-2xl"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-border bg-muted/5 flex flex-col gap-2">
          {/* Admin shortcuts if user role allows */}
          <div className="flex gap-2">
            <button
              onClick={() => handleItemClick('vendor')}
              className="flex-1 py-1.5 px-2 rounded-lg border border-border bg-card text-[9px] font-bold text-muted-foreground hover:text-foreground text-center transition"
            >
              Vendor Center
            </button>
            <button
              onClick={() => handleItemClick('admin')}
              className="flex-1 py-1.5 px-2 rounded-lg border border-border bg-card text-[9px] font-bold text-muted-foreground hover:text-foreground text-center transition"
            >
              Platform Admin
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

