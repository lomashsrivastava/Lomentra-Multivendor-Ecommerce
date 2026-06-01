import { useState, useRef, useEffect } from 'react'
import {
  Menu, Search, ShoppingBag, User, LogOut, ChevronDown, Shield, Package,
  Store, Heart, Settings, ShoppingCart
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import NotificationBell from '@/components/NotificationBell'
import { formatPrice } from '@/utils/utils'
import type { Category } from '@/types/category'

interface NavbarProps {
  onToggleSidebar: () => void
  currentView: string
  onViewChange: (view: string) => void
  onOpenAuthModal: () => void
  onOpenWishlist?: () => void
}

export function Navbar({ onToggleSidebar, currentView, onViewChange, onOpenAuthModal, onOpenWishlist }: NavbarProps) {
  if (currentView === 'never') {
    console.log(currentView)
  }
  const { user, logout, currency } = useAuth()
  const { cartItems, setIsCartOpen } = useCart()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [rootCategories, setRootCategories] = useState<Category[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const categoryRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories?level=1')
        if (res.ok) {
          const data = await res.json()
          if (data.categories) {
            setRootCategories(data.categories)
          }
        }
      } catch (err) {
        console.error('Error fetching root categories:', err)
      }
    }
    fetchCats()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ products: any[]; stores: any[] }>({ products: [], stores: [] })
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (q: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (q.length < 2) { setShowSearchResults(false); return }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data)
          setShowSearchResults(true)
        }
      } catch { /* ignore */ }
    }, 300)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const handleCategorySelect = (catName: string, catSlug?: string) => {
    setSelectedCategory(catName)
    setIsCategoryOpen(false)
    onViewChange('home')
    const catVal = catSlug || 'all'
    window.dispatchEvent(new CustomEvent('filter-change', { detail: { category: catVal } }))
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-background border-b border-border shadow-sm">
      {/* Top Bar */}
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">

        {/* Mobile Menu + Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-accent lg:hidden"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onViewChange('home')}
            className="flex items-center gap-2 shrink-0 lg:hidden"
          >
            <img src="/logo.png" alt="Lomentra Logo" className="h-8 w-auto rounded-md object-contain shadow-sm border border-border/10" />
          </button>
        </div>

        {/* Category Dropdown + Search Bar */}
        <div className="flex flex-1 items-center gap-0 max-w-2xl mx-auto">
          {/* All Categories Dropdown */}
          <div ref={categoryRef} className="relative hidden md:block shrink-0">
            <button
              type="button"
              onClick={() => setIsCategoryOpen(p => !p)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-l-xl border border-r-0 border-border bg-muted/30 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
            >
              <span>{selectedCategory}</span>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCategoryOpen && (
              <div className="absolute top-12 left-0 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 py-1.5 max-h-80 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('All Categories', 'all')}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                    selectedCategory === 'All Categories'
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-foreground hover:bg-muted/40'
                  }`}
                >
                  All Categories
                </button>
                {rootCategories.map(cat => (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name, cat.slug)}
                    className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input */}
          <div ref={searchRef} className="flex-1 relative">
            <input
              type="search"
              placeholder="Search for products, brands and more..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); handleSearch(e.target.value) }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              className="w-full h-10 border border-border bg-card pl-4 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:rounded-none md:border-l-0"
            />
            {/* Search Results */}
            {showSearchResults && (searchResults.products.length > 0 || searchResults.stores.length > 0) && (
              <div className="absolute top-12 left-0 w-full bg-card border border-border rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                {searchResults.stores.length > 0 && (
                  <div className="px-3 py-2 border-b border-border/50">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Stores</p>
                    {searchResults.stores.map((s: any) => (
                      <button key={s._id} type="button"
                        onClick={() => { onViewChange('store'); setShowSearchResults(false); setSearchQuery('') }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-xs font-medium text-foreground flex items-center gap-2">
                        <Store className="h-3 w-3 text-primary" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.products.length > 0 && (
                  <div className="px-3 py-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Products</p>
                    {searchResults.products.map((p: any) => (
                      <button key={p._id} type="button"
                        onClick={() => {
                          setShowSearchResults(false)
                          setSearchQuery('')
                          onViewChange('home')
                          window.dispatchEvent(new CustomEvent('view-product', { detail: { product: p } }))
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-xs font-medium text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3 text-primary" />
                        <span className="truncate flex-1">{p.name}</span>
                        <span className="text-[10px] text-primary font-bold shrink-0">{formatPrice(p.price, currency)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="button"
            className="h-10 w-12 rounded-r-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <NotificationBell />

          {/* Wishlist */}
          <button
            type="button"
            onClick={onOpenWishlist}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-accent transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 h-9 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors"
                onClick={() => setIsDropdownOpen(p => !p)}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground uppercase">
                    {user.name[0]}
                  </div>
                )}
                <span className="hidden sm:inline-block max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50">
                  <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold uppercase">
                      <Shield className="h-2 w-2" />{user.role}
                    </span>
                  </div>

                  {[
                    { label: 'Account Settings', icon: Settings, view: 'profile' },
                    { label: 'My Orders', icon: Package, view: 'orders' },
                    ...(user.role === 'vendor' || user.role === 'admin' ? [{ label: 'Vendor Center', icon: Store, view: 'vendor' }] : []),
                    ...(user.role === 'admin' ? [{ label: 'Admin Panel', icon: Shield, view: 'admin' }] : []),
                  ].map(item => (
                    <button
                      key={item.view}
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent rounded-xl transition-colors"
                      onClick={() => { onViewChange(item.view); setIsDropdownOpen(false) }}
                    >
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}

                  <div className="border-t border-border/50 mt-1 pt-1">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                      onClick={() => { logout(); setIsDropdownOpen(false) }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors"
              onClick={onOpenAuthModal}
            >
              <User className="h-3.5 w-3.5 mr-1.5 sm:hidden" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Nav Bar - Category Quick Links */}
      <div className="hidden md:flex items-center justify-center gap-2 px-6 h-12 border-t border-border/50 bg-background/60 backdrop-blur-md overflow-x-auto scrollbar-none">
        {[
          { label: 'Home', view: 'home' },
          { label: 'Categories', view: 'categories' },
          { label: 'Flash Deals', view: 'flash-deals' },
          { label: 'New Arrivals', view: 'new-arrivals' },
          { label: 'Best Sellers', view: 'best-sellers' },
          { label: 'Top Brands', view: 'top-brands' },
          { label: 'AI Assistant', view: 'ai-assistant' },
          { label: 'Summer Sale', view: 'summer-sale' }
        ].map(item => {
          const isActive = currentView === item.view
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                onViewChange(item.view)
              }}
              className={`magical-nav-item px-4 py-1.5 text-xs font-bold transition-all rounded-lg whitespace-nowrap ${
                isActive 
                  ? 'active text-primary bg-primary/5' 
                  : 'text-muted-foreground hover:bg-accent/50'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </header>
  )
}
