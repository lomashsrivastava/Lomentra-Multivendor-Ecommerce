import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Star, ShieldAlert, Check, ShoppingCart, Loader2, Truck, MessageSquare, Heart, Share2, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import AIReviewSummary from './AIReviewSummary'
import { formatPrice } from '@/utils/utils'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'

interface Product {
  _id: string; name: string; description: string; price: number; category: string; stock: number; images: string[]
  storeId?: { name: string; slug: string }
}
interface Review { _id: string; rating: number; comment: string; userName: string; createdAt: string }
interface Props { product: Product; onClose: () => void; onAddToCart: (p: any) => void }

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB']
const COLOR_OPTIONS = [
  { name: 'Black', hex: '#1a1a2e' }, { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Blue', hex: '#4f46e5' }, { name: 'Gold', hex: '#d4a843' },
]

export default function ProductDetailModal({ product, onClose, onAddToCart }: Props) {
  const { currency } = useAuth()
  const { showToast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews' | 'specs' | 'shipping'>('desc')
  const [selectedImg, setSelectedImg] = useState(0)
  const [selectedStorage, setSelectedStorage] = useState('128GB')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0])
  const [qty, setQty] = useState(1)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [added, setAdded] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)

  const token = localStorage.getItem('token')
  const origPrice = product.price * 1.18
  const discPct = 18

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true)
    try {
      const r = await fetch(`/api/reviews?productId=${product._id}`)
      if (r.ok) { const d = await r.json(); setReviews(d.reviews || []) }
    } catch {} finally { setLoadingReviews(false) }
  }, [product._id])

  useEffect(() => { fetchReviews(); setSelectedImg(0); setQty(1); setReviewMsg(null) }, [fetchReviews])

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) onAddToCart(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setReviewMsg({ type: 'err', text: 'Please sign in to leave a review.' }); return }
    setSubmitting(true)
    try {
      const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId: product._id, rating, comment }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setReviewMsg({ type: 'ok', text: 'Review submitted! Thank you.' }); setComment(''); fetchReviews()
    } catch (err: any) { setReviewMsg({ type: 'err', text: err.message }) } finally { setSubmitting(false) }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/product/${product._id}`
    navigator.clipboard.writeText(url)
      .then(() => {
        showToast('success', 'Link Copied', 'Product link copied to clipboard!')
      })
      .catch((err) => {
        console.error('Failed to copy link:', err)
      })

    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: url
      }).catch(err => console.log('Native share failed or cancelled:', err))
    }
  }

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '4.7'
  const images = product.images.length ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400']

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-[95vw] md:w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-y-auto md:overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted/40 transition text-muted-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">{product.category}</span>
              <h2 className="text-base font-extrabold text-foreground mt-0.5 line-clamp-1">{product.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setWishlisted(p => !p)} className="p-2 rounded-xl hover:bg-muted/40 transition">
              <Heart className={`h-4 w-4 ${wishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </button>
            <button onClick={handleShare} className="p-2 rounded-xl hover:bg-muted/40 transition text-muted-foreground"><Share2 className="h-4 w-4" /></button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/40 transition text-muted-foreground"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-visible md:overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left: Image gallery */}
            <div className="p-6 space-y-3 border-b md:border-b-0 md:border-r border-border">
              <div className="aspect-square max-h-[250px] md:max-h-[320px] lg:max-h-[380px] w-full rounded-2xl border border-border bg-muted/10 overflow-hidden relative flex items-center justify-center bg-black/5">
                <img src={images[selectedImg]} alt={product.name} className="max-w-full max-h-full object-contain p-2" />
                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur px-3 py-1.5 rounded-xl border border-border text-sm font-black text-primary">
                  {formatPrice(product.price, currency)}
                </div>
                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">-{discPct}%</div>
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`h-14 w-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${selectedImg === i ? 'border-primary' : 'border-border'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-muted/20 border border-border">
                  <p className="text-xs font-black text-foreground">{avgRating}</p>
                  <p className="text-[9px] text-muted-foreground">{reviews.length} reviews</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/20 border border-border">
                  <p className={`text-xs font-black ${product.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{product.stock > 0 ? 'In Stock' : 'Sold Out'}</p>
                  <p className="text-[9px] text-muted-foreground">{product.stock} units</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/20 border border-border">
                  <p className="text-xs font-black text-foreground">{discPct}%</p>
                  <p className="text-[9px] text-muted-foreground">Savings</p>
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="p-6 space-y-5">
              {/* Title & Rating */}
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-foreground">{product.name}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}
                  </div>
                  <span className="text-xs font-bold text-foreground">{avgRating}</span>
                  <span className="text-[10px] text-muted-foreground">({reviews.length} reviews)</span>
                  <span className="text-[10px] font-bold text-emerald-500">{product.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <span className="text-2xl font-black text-foreground">{formatPrice(product.price, currency)}</span>
                <span className="text-base text-muted-foreground line-through">{formatPrice(origPrice, currency)}</span>
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-lg">-{discPct}%</span>
              </div>

              {/* Storage Options */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-foreground uppercase tracking-wide">Storage</label>
                <div className="flex flex-wrap gap-2">
                  {STORAGE_OPTIONS.slice(0, 4).map(s => (
                    <button key={s} onClick={() => setSelectedStorage(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${selectedStorage === s ? 'border-primary bg-primary text-primary-foreground shadow' : 'border-border bg-card text-foreground hover:border-primary/50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Options */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-foreground uppercase tracking-wide">Color: <span className="text-primary normal-case font-bold">{selectedColor.name}</span></label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.name} onClick={() => setSelectedColor(c)} title={c.name}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${selectedColor.name === c.name ? 'border-primary scale-110 shadow-lg' : 'border-border hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }} />
                  ))}
                </div>
              </div>

              {/* Qty + Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-bold text-muted-foreground">Qty:</label>
                  <div className="flex items-center gap-1 border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setQty(p => Math.max(1, p - 1))} className="px-3 py-1.5 text-sm font-bold hover:bg-muted/40 transition text-foreground">−</button>
                    <span className="px-3 py-1.5 text-sm font-black text-foreground border-x border-border">{qty}</span>
                    <button onClick={() => setQty(p => Math.min(product.stock, p + 1))} className="px-3 py-1.5 text-sm font-bold hover:bg-muted/40 transition text-foreground">+</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleAddToCart} disabled={product.stock === 0}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-sm transition shadow-lg ${added ? 'bg-emerald-500 text-white' : 'magical-btn-glow text-white'} disabled:opacity-40`}>
                    {added ? <><Check className="h-4 w-4" />Added!</> : <><ShoppingCart className="h-4 w-4" />Add to Cart</>}
                  </button>
                  <button disabled={product.stock === 0}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 border-primary text-primary hover:bg-primary/5 transition disabled:opacity-40">
                    Buy Now
                  </button>
                </div>
              </div>

              {/* Shipping info */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border text-xs">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Free delivery on orders over <span className="font-bold text-foreground">{formatPrice(500, currency)}</span></span>
              </div>

              {/* Store */}
              {product.storeId && (
                <p className="text-xs text-muted-foreground">Sold by: <span className="font-bold text-primary">{product.storeId.name}</span></p>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div className="border-t border-border">
            <div className="flex gap-0 border-b border-border px-6 overflow-x-auto scrollbar-none">
              {(['desc', 'reviews', 'specs', 'shipping'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'desc' ? 'Description' : tab === 'reviews' ? `Reviews (${reviews.length})` : tab === 'specs' ? 'Specifications' : 'Shipping & Returns'}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'desc' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Premium Build Quality', 'Fast Delivery', '1 Year Warranty', 'Easy Returns'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="md:col-span-3 space-y-3">
                    <AIReviewSummary productId={product._id} reviewCount={reviews.length} />
                    {loadingReviews ? (
                      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-xs">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />Loading...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">Be the first to review this product!</div>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {reviews.map(r => (
                          <div key={r._id} className="p-3 rounded-xl border border-border bg-muted/10 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-foreground">{r.userName}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}</div>
                            <p className="text-xs text-muted-foreground">{r.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                      <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wide">Write a Review</h4>
                      {!token ? (
                        <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600">
                          <ShieldAlert className="h-4 w-4 shrink-0" />Sign in to leave a review.
                        </div>
                      ) : (
                        <form onSubmit={submitReview} className="space-y-3">
                          {reviewMsg && <div className={`p-2 rounded-lg text-xs ${reviewMsg.type === 'ok' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>{reviewMsg.text}</div>}
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} type="button" onClick={() => setRating(s)}>
                                <Star className={`h-6 w-6 transition-colors ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                              </button>
                            ))}
                          </div>
                          <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} required placeholder="Share your experience..." className="w-full p-2.5 rounded-xl border border-border bg-muted/10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                          <button type="submit" disabled={submitting} className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-1">
                            {submitting ? <><Loader2 className="h-3 w-3 animate-spin" />Submitting...</> : 'Submit Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {[['Category', product.category], ['Stock', `${product.stock} units`], ['SKU', product._id.slice(-8).toUpperCase()], ['Warranty', '1 Year Manufacturer'], ['Return Policy', '30 Days Easy Returns'], ['Delivery', '2-5 Business Days']].map(([k, v]) => (
                    <div key={k} className="flex justify-between px-4 py-3 text-xs">
                      <span className="text-muted-foreground font-bold">{k}</span>
                      <span className="text-foreground font-semibold capitalize">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div><p className="font-bold text-foreground text-xs">Free Standard Shipping</p><p className="text-xs">On orders above {formatPrice(500, currency)}. Delivered in 3-7 business days.</p></div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border">
                    <MessageSquare className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div><p className="font-bold text-foreground text-xs">30-Day Returns</p><p className="text-xs">Not satisfied? Return within 30 days for a full refund.</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
