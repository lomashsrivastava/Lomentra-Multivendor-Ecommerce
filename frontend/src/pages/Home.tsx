import { useState, useEffect, useCallback } from 'react'
import { Star, ShoppingCart, Heart, Loader2, PackageOpen, ChevronLeft, ChevronRight, Clock, Zap, TrendingUp, Bot, Shield, RotateCcw, Headphones, CheckCircle, RefreshCw } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import type { ProductItem } from '@/providers/CartProvider'
import ProductDetailModal from '@/components/ProductDetailModal'
import ChatWidget from '@/components/ChatWidget'
import { SpinWheel } from '@/components/SpinWheel'
import { formatPrice } from '@/utils/utils'

interface HomeProps {
  onNavigateToStore?: (slug: string) => void
  onViewChange?: (view: string) => void
  onSelectCategory?: (category: any, path: any[]) => void
}

const HERO_SLIDES = [
  { title: 'Flipkart Big Billion Days', sub: 'Craziest deals on Mobiles, Electronics, Fashion & more! Up to 80% Off', badge: 'Live Now', btn1: 'Shop Mobiles', btn2: 'Explore Deals', bg: 'from-blue-600 via-indigo-600 to-violet-700', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80' },
  { title: 'Great Indian Festival', sub: 'Big savings, no-cost EMI, and instant bank discounts. Shop the biggest festive store', badge: 'Mega Sale', btn1: 'Grab Offer', btn2: 'Top Brands', bg: 'from-orange-600 via-amber-500 to-red-600', img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&auto=format&fit=crop&q=80' },
  { title: 'Diwali Mahabachat Sale', sub: 'Celebrate the festival of lights with gold coins, ethnic wear, and home decor discounts', badge: 'Festive Spl', btn1: 'Shop Ethnic', btn2: 'Home Decor', bg: 'from-yellow-600 via-red-500 to-orange-600', img: 'https://images.unsplash.com/photo-1547989453-11e67ffb3885?w=500&auto=format&fit=crop&q=80' },
  { title: 'New Year Bash Sale', sub: 'Kickstart your resolutions with brand new gadgets, activewear, and party essentials', badge: 'New Beginnings', btn1: 'Shop Tech', btn2: 'Fitness Gear', bg: 'from-fuchsia-600 via-purple-600 to-pink-500', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80' },
  { title: 'Christmas Gift Wonderland', sub: 'Spread the holiday cheer with custom gift boxes, toy deals, and cozy winter wear', badge: 'Holiday Gifts', btn1: 'Buy Gifts', btn2: 'Winter Apparel', bg: 'from-red-700 via-rose-600 to-emerald-600', img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80' },
  { title: 'Holi Color Festival', sub: 'Vibrant discounts on whites, herbal colors, sweets, and celebration packages', badge: 'Holi Dhamaka', btn1: 'Shop Outfits', btn2: 'Festive Sweets', bg: 'from-pink-500 via-yellow-500 to-teal-500', img: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500&auto=format&fit=crop&q=80' },
  { title: 'Independence Day Freedom Sale', sub: 'Honoring the nation with top deals on Made-in-India handlooms, crafts, and heritage brands', badge: '75% Off', btn1: 'Shop Local', btn2: 'Vocal for Local', bg: 'from-orange-600 via-amber-100 to-emerald-600', img: 'https://images.unsplash.com/photo-1532156427227-fd63304a89c6?w=500&auto=format&fit=crop&q=80' },
  { title: 'Eid Mubarak Sale', sub: 'Glow this Eid with premium fragrances, ethnic wear, dry fruits, and gold jewelry', badge: 'Eid Mubarak', btn1: 'Shop Fragrances', btn2: 'Best Sellers', bg: 'from-emerald-700 via-teal-600 to-cyan-700', img: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80' },
  { title: "Valentine's Day Love Store", sub: 'Show your love with curated gift hampers, luxury watches, and fine jewelry', badge: 'Sweet Deals', btn1: 'Buy Gifts', btn2: 'Jewelry Store', bg: 'from-red-600 via-rose-500 to-pink-500', img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop&q=80' },
  { title: 'Black Friday Frenzy', sub: 'Unbelievable flash discounts on premium gadgets, soundbars, and gaming gear', badge: 'Hourly Drops', btn1: 'View Deals', btn2: 'Tech Hub', bg: 'from-zinc-800 via-neutral-900 to-zinc-950', img: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=500&auto=format&fit=crop&q=80' },
  { title: 'Cyber Monday Specials', sub: 'Upgrade your workstation with mechanical keyboards, developer gear, and smart home tech', badge: 'Tech Only', btn1: 'Shop Gear', btn2: 'Laptops', bg: 'from-cyan-600 via-blue-700 to-indigo-800', img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop&q=80' },
  { title: 'Monsoon Magic Essentials', sub: 'Stay dry and trendy with premium waterproof gear, umbrellas, and smart appliances', badge: 'Rainy Deals', btn1: 'Rainwear', btn2: 'Home Care', bg: 'from-blue-500 via-sky-600 to-indigo-500', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80' },
  { title: 'Summer Heatwave Clearance', sub: 'Beat the heat with massive discounts on air conditioners, refrigerators, and coolers', badge: 'Beat the Heat', btn1: 'Shop ACs', btn2: 'Cooling Deals', bg: 'from-yellow-500 via-orange-500 to-red-500', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80' },
  { title: 'Spring Fashion Blossom', sub: 'Revamp your wardrobe with fresh pastels, floral prints, and lightweight outerwear', badge: 'Fresh Arrivals', btn1: 'Shop Floral', btn2: 'Mens Casuals', bg: 'from-green-400 via-emerald-500 to-teal-500', img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=500&auto=format&fit=crop&q=80' },
  { title: 'Back to School Bonanza', sub: 'Prepare for class with backpacks, student laptop deals, and smart notebooks', badge: 'Kids & College', btn1: 'School Kits', btn2: 'Laptops', bg: 'from-blue-600 via-indigo-500 to-violet-600', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&auto=format&fit=crop&q=80' },
  { title: 'Raksha Bandhan Hampers', sub: 'Express sibling love with beautiful rakhi sets, sweet boxes, and gift combos', badge: 'Siblings Love', btn1: 'Buy Rakhi', btn2: 'Gift Sweets', bg: 'from-rose-500 via-orange-400 to-yellow-500', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&auto=format&fit=crop&q=80' },
  { title: 'Dussehra Super Utsav', sub: 'Welcome prosperity with discounts on washing machines, LED TVs, and kitchen chimneys', badge: 'Prosperity Deals', btn1: 'Appliances', btn2: 'Smart TVs', bg: 'from-orange-600 via-red-600 to-amber-500', img: 'https://images.unsplash.com/photo-1532156427227-fd63304a89c6?w=500&auto=format&fit=crop&q=80' },
  { title: "Mother's Day Specials", sub: 'Show your gratitude with elegant designer sarees, luxury hand creams, and jewelry', badge: 'Love You Mom', btn1: 'Sarees & Ethnic', btn2: 'Skincare', bg: 'from-pink-400 via-rose-400 to-red-400', img: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=500&auto=format&fit=crop&q=80' },
  { title: "Father's Day Curations", sub: 'Treat Dad to premium leather wallets, smartwatches, and shaving kits', badge: "Dad's Day Out", btn1: 'Leather Goods', btn2: 'Grooming', bg: 'from-slate-700 via-blue-800 to-slate-900', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=80' },
  { title: 'Halloween Spooky Sale', sub: 'Frighteningly good discounts on costumes, pumpkin lights, candies, and party props', badge: 'Trick or Treat', btn1: 'Costumes', btn2: 'Spooky Decor', bg: 'from-orange-600 via-purple-900 to-zinc-900', img: 'https://images.unsplash.com/photo-1508349654737-aa3cd87e58b1?w=500&auto=format&fit=crop&q=80' },
  { title: 'Grand Wedding Season Sale', sub: 'Glow in high-fidelity lehengas, gold necklaces, sherwanis, and luxury footwears', badge: 'Royal Festive', btn1: 'Bridal Collection', btn2: 'Men Ethnic', bg: 'from-red-800 via-rose-700 to-yellow-600', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80' },
  { title: 'Grand Winter Clearance', sub: 'Keep warm with heavy discounts on leather jackets, soft cardigans, and room heaters', badge: 'Winter Warmth', btn1: 'Jackets & Coats', btn2: 'Heaters', bg: 'from-sky-400 via-blue-500 to-indigo-600', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=80' },
  { title: 'Fitness Resolution Sale', sub: 'Gear up with adjustable dumbbells, yoga mats, tracksuits, and smart fit bands', badge: 'Get Fit', btn1: 'Gym Gear', btn2: 'Wearables', bg: 'from-emerald-600 via-teal-500 to-cyan-600', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80' },
  { title: 'Super Toy Bonanza', sub: 'Best deals on board games, remote cars, AI toy bots, and action figures for kids', badge: 'Kids Corner', btn1: 'Shop Toys', btn2: 'Board Games', bg: 'from-amber-400 via-pink-500 to-purple-500', img: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=500&auto=format&fit=crop&q=80' },
  { title: 'Smart Kitchen Makeover', sub: 'Upgrade your cooking with high-speed blenders, smart ovens, and sleek cooktops', badge: 'Chef Special', btn1: 'Blenders & Ovens', btn2: 'Utensils', bg: 'from-stone-600 via-neutral-500 to-stone-700', img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80' },
  { title: 'Grand Home Makeover', sub: 'Style your space with premium corner sofas, wall lamps, and designer rugs', badge: 'Cozy Home', btn1: 'Furniture', btn2: 'Lamps & Rugs', bg: 'from-amber-800 via-orange-700 to-yellow-700', img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=80' },
  { title: 'Travel & Adventure Sale', sub: 'Explore the world with hiking backpacks, waterproof tents, and action cameras', badge: 'Go Wild', btn1: 'Luggage & Bags', btn2: 'Camping Gear', bg: 'from-teal-600 via-green-600 to-emerald-700', img: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&auto=format&fit=crop&q=80' },
  { title: 'Books & Wisdom Fair', sub: 'Feed your mind with classic literature, top sci-fi novels, and paperbacks', badge: 'Read More', btn1: 'Best Sellers', btn2: 'New Releases', bg: 'from-amber-700 via-orange-600 to-amber-900', img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&auto=format&fit=crop&q=80' },
  { title: 'Premium Timepieces Sale', sub: 'Timeless elegance. Up to 40% off on luxury chronographs and smartwatches', badge: 'Premium Watches', btn1: 'Mens Chrono', btn2: 'Smartwatches', bg: 'from-zinc-700 via-slate-800 to-zinc-900', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80' },
  { title: 'Footwear Festival', sub: 'Step out in style with sneakers, formal oxfords, and elegant high heels', badge: 'Sneakers & Formal', btn1: 'Shop Sneakers', btn2: 'Formal Shoes', bg: 'from-red-500 via-orange-600 to-rose-600', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80' },
]

const CATEGORY_ICONS: Record<string, string> = {
  'fashion-apparel': '👕',
  'electronics': '🎧',
  'home-furniture': '🪑',
  'kitchen-appliances': '🍳',
  'grocery': '🍎',
  'beauty-personal-care': '💄',
  'health-wellness': '💊',
  'sports-fitness': '⚽',
  'books-stationery': '📚',
  'toys-baby-products': '🎮',
  'automotive': '🚗',
  'jewelry': '💍',
  'pet-supplies': '🐱',
  'digital-products': '💻',
  'festival-gifts': '🎁',
  'industrial-business-supplies': '🛠️'
}

const TRUST = [
  { icon: Shield, title: 'Free Shipping', sub: 'On all orders over Rs. 500' },
  { icon: RotateCcw, title: 'Easy Returns', sub: '30 day return policy' },
  { icon: Shield, title: 'Secure Payments', sub: '100% secure payments' },
  { icon: Headphones, title: '24/7 Support', sub: 'Dedicated support' },
]

export function Home({ onNavigateToStore, onViewChange, onSelectCategory }: HomeProps) {
  const { addToCart } = useCart()
  const { user, token, currency } = useAuth()

  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        const res = await fetch('/api/categories?featured=true')
        if (res.ok) {
          const data = await res.json()
          if (data.categories) {
            setCategories(data.categories)
          }
        }
      } catch (err) {
        console.error('Error fetching featured categories:', err)
      }
    }
    fetchFeaturedCategories()
  }, [])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [slide, setSlide] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [countdown, setCountdown] = useState({ h: 2, m: 45, s: 30 })
  const [liveAlert, setLiveAlert] = useState<any>(null)

  // New advanced features states
  const [suggestions, setSuggestions] = useState<ProductItem[]>([])
  const [compareList, setCompareList] = useState<ProductItem[]>([])
  const [visibleProducts, setVisibleProducts] = useState(15)

  // Reset visible products when category or search changes
  useEffect(() => {
    setVisibleProducts(15)
  }, [activeCategory, searchQuery])

  // Live search suggestions filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    setSuggestions(filtered.slice(0, 5))
  }, [searchQuery, products])

  const toggleCompare = (p: ProductItem) => {
    setCompareList(prev => {
      if (prev.some(item => item._id === p._id)) {
        return prev.filter(item => item._id !== p._id)
      }
      if (prev.length >= 3) return prev
      return [...prev, p]
    })
  }

  // Hero auto-slide
  useEffect(() => {
    const t = setInterval(() => setSlide(p => (p + 1) % HERO_SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  // Countdown
  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(p => {
        if (p.s > 0) return { ...p, s: p.s - 1 }
        if (p.m > 0) return { h: p.h, m: p.m - 1, s: 59 }
        if (p.h > 0) return { h: p.h - 1, m: 59, s: 59 }
        return { h: 2, m: 45, s: 30 }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Filter and product view events from sidebar/navbar
  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail
      if (d.category !== undefined) setActiveCategory(d.category)
      if (d.sortBy !== undefined) setSortBy(d.sortBy)
    }
    const viewHandler = (e: any) => {
      if (e.detail.product) {
        setSelectedProduct(e.detail.product)
      }
    }
    window.addEventListener('filter-change', handler)
    window.addEventListener('view-product', viewHandler)
    return () => {
      window.removeEventListener('filter-change', handler)
      window.removeEventListener('view-product', viewHandler)
    }
  }, [])

  const fetchWishlist = useCallback(async () => {
    if (!token) return
    try {
      const r = await fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
      if (r.ok) { const d = await r.json(); setWishlistIds(new Set((d.products || []).map((p: any) => p._id))) }
    } catch {}
  }, [token])

  useEffect(() => { if (user) fetchWishlist() }, [user, fetchWishlist])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const url = activeCategory === 'all' ? '/api/products' : `/api/products?category=${activeCategory}`
      const r = await fetch(url)
      if (r.ok) {
        const d = await r.json()
        let catalog = d.products || []
        if (catalog.length === 0) {
          const sr = await fetch('/api/seed')
          if (sr.ok) { const r2 = await fetch(url); if (r2.ok) { const d2 = await r2.json(); catalog = d2.products || [] } }
        }
        setProducts(catalog)
      }
    } catch {} finally { setLoading(false) }
  }, [activeCategory])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Live alert
  useEffect(() => {
    if (!products.length) return
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune']
    const fire = () => {
      const p = products[Math.floor(Math.random() * products.length)]
      setLiveAlert({ name: p.name, city: cities[Math.floor(Math.random() * cities.length)], img: p.images[0] })
      setTimeout(() => setLiveAlert(null), 5000)
    }
    const t1 = setTimeout(fire, 4000)
    const t2 = setInterval(fire, 18000)
    return () => { clearTimeout(t1); clearInterval(t2) }
  }, [products])

  const toggleWishlist = async (id: string) => {
    if (!token) return
    const has = wishlistIds.has(id)
    try {
      await fetch('/api/wishlist', { method: has ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: id }) })
      setWishlistIds(p => { const n = new Set(p); has ? n.delete(id) : n.add(id); return n })
    } catch {}
  }

  const processed = [...products]
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : b._id.localeCompare(a._id))

  const flashDeals = products.slice(0, 5)

  const pad = (n: number) => n.toString().padStart(2, '0')

  return (
    <div className="space-y-8 pb-16">

      {/* HERO CAROUSEL */}
      <section className="relative group mx-2 md:mx-0">
        <div className={`rounded-2xl overflow-hidden bg-gradient-to-r ${HERO_SLIDES[slide].bg} p-8 md:p-12 min-h-[320px] flex items-center`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-center">
            <div className="space-y-4 text-white">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold border border-white/30">{HERO_SLIDES[slide].badge}</span>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">{HERO_SLIDES[slide].title}</h1>
              <p className="text-white/80 text-sm md:text-base max-w-md">{HERO_SLIDES[slide].sub}</p>
              <div className="flex gap-3 pt-2">
                <button className="px-6 py-2.5 bg-white text-slate-900 font-bold text-sm rounded-xl hover:bg-white/90 transition shadow-lg">{HERO_SLIDES[slide].btn1}</button>
                <button className="px-6 py-2.5 bg-white/10 border border-white/30 text-white font-bold text-sm rounded-xl hover:bg-white/20 transition">{HERO_SLIDES[slide].btn2}</button>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <img src={HERO_SLIDES[slide].img} alt="hero" className="h-52 w-52 object-cover rounded-2xl shadow-2xl" />
            </div>
          </div>
        </div>
        {/* Slide controls */}
        <button 
          onClick={(e) => { e.stopPropagation(); setSlide(p => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length); }} 
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition backdrop-blur-sm border border-white/10 cursor-pointer shadow-md"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setSlide(p => (p + 1) % HERO_SLIDES.length); }} 
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition backdrop-blur-sm border border-white/10 cursor-pointer shadow-md"
          aria-label="Next Slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        
        {/* Sleek Progress Bar Indicator */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-56 h-1 rounded-full bg-white/20 overflow-hidden backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
          <div 
            className="h-full bg-white transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ width: `${((slide + 1) / HERO_SLIDES.length) * 100}%` }}
          />
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TRUST.map((t, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <t.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{t.title}</p>
              <p className="text-[10px] text-muted-foreground">{t.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* TOP CATEGORIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground">Top Categories</h2>
          <button onClick={() => onViewChange?.('categories')} className="text-xs text-primary font-bold hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          <button onClick={() => {
            if (onSelectCategory && onViewChange) {
              onSelectCategory(null, [])
              onViewChange('categories')
            } else {
              setActiveCategory('all')
            }
          }}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${activeCategory === 'all' ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'}`}>
            <span className="text-2xl">⋯</span>
            <span className="text-[10px] font-semibold text-foreground text-center leading-tight">All</span>
          </button>
          {categories.map(cat => {
            const icon = CATEGORY_ICONS[cat.slug] || '📁'
            return (
              <button key={cat.slug} onClick={() => {
                if (onSelectCategory && onViewChange) {
                  onSelectCategory(cat, [cat])
                  onViewChange('categories')
                } else {
                  setActiveCategory(cat.slug)
                }
              }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${activeCategory === cat.slug ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'}`}>
                <span className="text-2xl">{icon}</span>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* FLASH DEALS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Flash Deals
            </h2>
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-black">
              <Clock className="h-3 w-3" />
              {pad(countdown.h)} : {pad(countdown.m)} : {pad(countdown.s)}
            </div>
          </div>
          <button className="text-xs text-primary font-bold hover:underline">View all</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {flashDeals.map((p, idx) => {
            const origPrice = p.price * (1 + (15 + idx * 5) / 100)
            const discPct = Math.round((1 - p.price / origPrice) * 100)
            const soldPct = 20 + idx * 12
            return (
              <div key={p._id} className="group rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(p)}>
                <div className="relative h-36 bg-muted/20 overflow-hidden">
                  <img src={p.images[0] || ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">-{discPct}%</span>
                  {user && (
                    <button onClick={e => { e.stopPropagation(); toggleWishlist(p._id) }}
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 flex items-center justify-center shadow">
                      <Heart className={`h-3 w-3 ${wishlistIds.has(p._id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                    </button>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs font-bold text-foreground line-clamp-2 leading-tight">{p.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-foreground">{formatPrice(p.price, currency)}</span>
                    <span className="text-[9px] text-muted-foreground line-through">{formatPrice(origPrice, currency)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>{soldPct}% Sold</span>
                      <span>{100 - soldPct}% left</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${soldPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* PROMO BANNERS ROW */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-400 to-pink-500 text-white space-y-2">
          <span className="text-xs font-bold opacity-80">Summer Sale</span>
          <h3 className="text-lg font-black">Up to 50% Off</h3>
          <button className="px-4 py-1.5 bg-white text-orange-600 text-xs font-black rounded-lg hover:bg-white/90 transition">Shop Now</button>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-violet-600 to-indigo-600 text-white space-y-2">
          <span className="text-xs font-bold opacity-80">New Arrivals</span>
          <h3 className="text-lg font-black">Latest Collections</h3>
          <button onClick={() => setSortBy('newest')} className="px-4 py-1.5 bg-white text-violet-700 text-xs font-black rounded-lg hover:bg-white/90 transition">Explore Now</button>
        </div>
        <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white space-y-2 relative overflow-hidden">
          <span className="text-xs font-bold opacity-80">AI Assistant</span>
          <h3 className="text-lg font-black">Shop Smarter</h3>
          <button className="px-4 py-1.5 bg-white text-emerald-600 text-xs font-black rounded-lg hover:bg-white/90 transition">Chat Now</button>
          <div className="absolute right-4 bottom-2 text-4xl opacity-30">🤖</div>
        </div>
      </section>

      {/* PRODUCT CATALOG */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Best Selling Products</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{processed.length} products</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="h-8 px-3 text-xs rounded-lg border border-border bg-card w-40 focus:outline-none focus:ring-1 focus:ring-ring transition-all focus:w-48"
              />
              {suggestions.length > 0 && (
                <div className="absolute right-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 divide-y divide-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {suggestions.map(p => (
                    <div
                      key={p._id}
                      onClick={() => { setSelectedProduct(p); setSuggestions([]); setSearchQuery('') }}
                      className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <img src={p.images[0] || ''} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-foreground truncate">{p.name}</p>
                        <p className="text-[9px] text-primary font-black">{formatPrice(p.price, currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="h-8 px-2 text-xs rounded-lg border border-border bg-card focus:outline-none">
              <option value="newest">Newest</option>
              <option value="price-low">Price ↑</option>
              <option value="price-high">Price ↓</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button 
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button 
              key={c.slug} 
              onClick={() => setActiveCategory(c.slug)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap transition-all ${activeCategory === c.slug ? 'bg-primary text-primary-foreground border-primary shadow' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading products...</p>
          </div>
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {processed.slice(0, visibleProducts).map(p => (
              <div key={p._id} className="group rounded-2xl border border-border bg-card hover:shadow-lg hover:border-primary/20 transition-all overflow-hidden flex flex-col">
                <div className="relative h-44 bg-muted/20 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(p)}>
                  <img src={p.images[0] || ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  {p.stock === 0 && <span className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Sold Out</span>}
                  {p.stock > 0 && p.stock <= 5 && <span className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Low Stock</span>}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    {user && (
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(p._id) }}
                        className="h-7 w-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition">
                        <Heart className={`h-3.5 w-3.5 ${wishlistIds.has(p._id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                      </button>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); toggleCompare(p) }}
                      className={`h-7 w-7 rounded-full backdrop-blur flex items-center justify-center shadow transition ${compareList.some(item => item._id === p._id) ? 'bg-primary text-primary-foreground' : 'bg-white/80 text-gray-500 hover:bg-white'}`}
                      title="Compare product"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1 gap-2">
                  <div className="cursor-pointer" onClick={() => setSelectedProduct(p)}>
                    <span className="text-[9px] font-extrabold text-primary uppercase tracking-wide">{p.category}</span>
                    <h4 className="text-xs font-bold text-foreground line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">{p.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-[10px]">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}
                    <span className="text-muted-foreground font-medium">(24)</span>
                  </div>
                  {p.storeId && typeof p.storeId === 'object' && 'name' in p.storeId && (
                    <button onClick={() => onNavigateToStore?.((p.storeId as any).slug)} className="text-[9px] text-primary font-bold hover:underline text-left">🏪 {(p.storeId as any).name}</button>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                    <span className="text-sm font-black text-foreground">{formatPrice(p.price, currency)}</span>
                    <button onClick={() => addToCart(p, 1)} disabled={p.stock === 0}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold magical-btn-glow text-white rounded-lg disabled:opacity-40 transition shadow">
                      <ShoppingCart className="h-3.5 w-3.5" />Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            {processed.length > visibleProducts && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setVisibleProducts(prev => prev + 15)}
                  className="px-6 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary hover:text-primary-foreground text-primary font-bold text-xs transition shadow-sm hover:shadow-md cursor-pointer"
                >
                  Load More Products
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* AI ASSISTANT BANNER */}
      <section className="rounded-2xl border border-border bg-gradient-to-r from-violet-600/10 via-purple-500/5 to-indigo-600/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-black text-foreground">Shop Smarter with AI</h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">Ask anything, get recommendations, compare products and find the best deals on Lomentra!</p>
          <button className="px-6 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20">
            Chat with AI
          </button>
        </div>
        <div className="text-8xl opacity-80">🤖</div>
      </section>

      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={p => addToCart(p, 1)} />}

      <ChatWidget onViewProduct={p => setSelectedProduct(p)} onAddToCart={p => addToCart(p, 1)} />

      <SpinWheel />

      {/* Product Compare Drawer */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card border-t border-border shadow-2xl z-40 p-4 animate-in slide-in-from-bottom duration-300">
          <div className="max-w-6xl mx-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wide">Compare Products ({compareList.length}/3)</h3>
              </div>
              <button onClick={() => setCompareList([])} className="text-[10px] text-muted-foreground hover:text-foreground font-semibold">Clear All</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {compareList.map(p => (
                <div key={p._id} className="relative p-2.5 rounded-xl border border-border bg-muted/20 flex flex-col gap-1.5 min-w-0">
                  <button onClick={() => toggleCompare(p)} className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-destructive text-sm font-black w-5 h-5 rounded-full border border-border/50 flex items-center justify-center bg-card hover:bg-muted transition shadow-sm">×</button>
                  <img src={p.images[0] || ''} alt="" className="h-10 w-10 rounded-lg object-cover mx-auto" />
                  <div className="text-center min-w-0">
                    <p className="text-[10px] font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-[10px] font-black text-primary mt-0.5">{formatPrice(p.price, currency)}</p>
                    <p className="text-[8px] text-primary font-bold uppercase tracking-wider mt-0.5">{p.category}</p>
                    <p className="text-[8px] text-muted-foreground line-clamp-2 mt-1 px-1">{p.description}</p>
                  </div>
                  <button
                    onClick={() => addToCart(p, 1)}
                    className="w-full mt-2 py-1.5 text-[9px] font-black magical-btn-glow text-white rounded-lg transition shadow-sm"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
              {[...Array(3 - compareList.length)].map((_, i) => (
                <div key={i} className="rounded-xl border border-dashed border-border/60 flex flex-col items-center justify-center py-6">
                  <span className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">Add slot {compareList.length + i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Order Alert */}
      {liveAlert && (
        <div className="fixed bottom-24 left-4 z-50 flex items-center gap-3 bg-card border border-border rounded-2xl p-3 shadow-2xl max-w-xs animate-in slide-in-from-left-4">
          <img src={liveAlert.img} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
          <div className="text-[10px]">
            <p className="font-black text-foreground line-clamp-1">{liveAlert.name}</p>
            <p className="text-muted-foreground">Purchased in {liveAlert.city}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
        </div>
      )}
    </div>
  )
}
