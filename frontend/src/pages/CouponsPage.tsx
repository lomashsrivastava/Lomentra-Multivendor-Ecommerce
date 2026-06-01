import { useState, useEffect, useRef } from 'react'
import { Award, Gift, RefreshCw, Sparkles, Ticket, CheckCircle, Copy, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const wheelSegments = [
  { value: 5, label: '5% OFF' },
  { value: 10, label: '10% OFF' },
  { value: 15, label: '15% OFF' },
  { value: 20, label: '20% OFF' },
  { value: 30, label: '30% OFF' },
  { value: 35, label: '35% OFF' },
  { value: 40, label: '40% OFF' },
  { value: 45, label: '45% OFF' },
  { value: 50, label: '50% OFF' },
  { value: 55, label: '55% OFF' },
  { value: 60, label: '60% OFF' },
  { value: 65, label: '65% OFF' },
  { value: 70, label: '70% OFF' },
  { value: 75, label: '75% OFF' },
  { value: 80, label: '80% OFF' },
  { value: 85, label: '85% OFF' },
  { value: 90, label: '90% OFF' },
  { value: 100, label: '100% OFF' }
]

const lomentraColors = [
  '#7c3aed', '#6366f1', '#a855f7', '#ec4899', '#3b82f6',
  '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'
]

const appleColors = [
  '#0f172a', '#1e293b', '#06b6d4', '#0891b2', '#0f172a',
  '#1e293b', '#06b6d4', '#0891b2', '#0f172a'
]


interface WonCoupon {
  code: string
  storeName: string
  discountText: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  wonAt: string
}

export function CouponsPage() {
  const [wonCoupons, setWonCoupons] = useState<WonCoupon[]>([])
  const [activeGame, setActiveGame] = useState<'lomentra' | 'apple' | 'nike' | 'sony'>('lomentra')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  
  // Lomentra & Apple Wheel states
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState<string | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [wonText, setWonText] = useState<string | null>(null)

  // Nike Scratch Card states
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isScratching, setIsScratching] = useState(false)
  const [scratchedPercent, setScratchedPercent] = useState(0)
  const [scratchRevealed, setScratchRevealed] = useState(false)

  // Sony Box states
  const [boxState, setBoxState] = useState<'idle' | 'shaking' | 'opened'>('idle')

  // Load won coupons from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('won_coupons')
    if (saved) {
      try {
        setWonCoupons(JSON.parse(saved))
      } catch {
        setWonCoupons([])
      }
    }
  }, [])

  // Save won coupon helper
  const addWonCoupon = (code: string, storeName: string, discountText: string, type: 'percentage' | 'fixed', val: number) => {
    const exists = wonCoupons.some(c => c.code === code)
    if (exists) return // already won

    const newCoupon: WonCoupon = {
      code,
      storeName,
      discountText,
      discountType: type,
      discountValue: val,
      wonAt: new Date().toLocaleDateString()
    }
    const updated = [newCoupon, ...wonCoupons]
    setWonCoupons(updated)
    localStorage.setItem('won_coupons', JSON.stringify(updated))
  }

  // Lomentra wheel spin handler
  const handleLomentraSpin = () => {
    if (spinning) return
    setSpinning(true)
    setSpinResult(null)
    setWonText(null)
    
    const segmentCount = wheelSegments.length
    const chosenSegment = 8 // Land on 50% OFF
    const targetRotation = 360 * 5 + (360 - (chosenSegment * (360 / segmentCount)) - (360 / segmentCount / 2))
    
    setWheelRotation(targetRotation)
    const wonSeg = wheelSegments[chosenSegment]

    setTimeout(() => {
      setSpinning(false)
      const code = `LOM${wonSeg.value}`
      setSpinResult(code)
      setWonText(`${wonSeg.value}% Off`)
      addWonCoupon(code, 'Lomentra Official', `${wonSeg.value}% Off (All Items)`, 'percentage', wonSeg.value)
    }, 4000)
  }

  // Apple wheel spin handler
  const handleAppleSpin = () => {
    if (spinning) return
    setSpinning(true)
    setSpinResult(null)
    setWonText(null)

    const segmentCount = wheelSegments.length
    const chosenSegment = 10 // Land on 60% OFF
    const targetRotation = 360 * 5 + (360 - (chosenSegment * (360 / segmentCount)) - (360 / segmentCount / 2))

    setWheelRotation(targetRotation)
    const wonSeg = wheelSegments[chosenSegment]

    setTimeout(() => {
      setSpinning(false)
      const code = `APP${wonSeg.value}`
      setSpinResult(code)
      setWonText(`${wonSeg.value}% Off`)
      addWonCoupon(code, 'Apple Store', `${wonSeg.value}% Off on Electronics`, 'percentage', wonSeg.value)
    }, 4000)
  }

  // Nike Scratch Card Canvas Initialization
  useEffect(() => {
    if (activeGame !== 'nike' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and draw silver/gray scratch overlay
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Create modern gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#475569')
    gradient.addColorStop(0.5, '#64748b')
    gradient.addColorStop(1, '#334155')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add textured noise to make it look like a scratch card
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`
      ctx.fillRect(x, y, 1.5, 1.5)
    }

    // Scratch card text guidelines
    ctx.font = '900 12px sans-serif'
    ctx.fillStyle = '#f1f5f9'
    ctx.textAlign = 'center'
    ctx.fillText('NIKE CYBER RUN', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = 'bold 8px sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('DRAG/SWIPE TO SCRATCH', canvas.width / 2, canvas.height / 2 + 10)

    setScratchedPercent(0)
    setScratchRevealed(false)
  }, [activeGame])

  // Canvas scratching logic
  const handleScratchMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (scratchRevealed || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 16, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratched percentage
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imgData.data
    let transparentCount = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentCount++
      }
    }
    const percent = Math.round((transparentCount / (pixels.length / 4)) * 100)
    setScratchedPercent(percent)

    if (percent > 45) {
      setScratchRevealed(true)
      addWonCoupon('NKE20', 'Nike Store', '20% Off Fashion & Apparel', 'percentage', 20)
    }
  }

  // Sony Box Open Handler
  const handleSonyBoxOpen = () => {
    if (boxState !== 'idle') return
    setBoxState('shaking')

    setTimeout(() => {
      setBoxState('opened')
      addWonCoupon('SNY15', 'Sony Store', '15% Off Acoustics & Sound', 'percentage', 15)
    }, 1500)
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-violet-600/5 via-indigo-600/5 to-background p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-primary flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-primary" /> Lomentra Rewards
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Interactive Coupon Hub</h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Play brand mini-games to win exclusive merchant vouchers. Won coupons are stored instantly and applied directly during checkout.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Mini-Games */}
        <div className="lg:col-span-2 space-y-6">
          {/* Game Selection Tabs */}
          <div className="flex gap-1.5 border-b border-border/60 pb-3 overflow-x-auto scrollbar-none">
            {[
              { id: 'lomentra', label: 'Lomentra Wheel', icon: Sparkles, color: 'text-violet-500' },
              { id: 'apple', label: 'Apple Cyber Wheel', icon: RefreshCw, color: 'text-cyan-500' },
              { id: 'nike', label: 'Nike Scratcher', icon: Ticket, color: 'text-rose-500' },
              { id: 'sony', label: 'Sony Mystery Box', icon: Gift, color: 'text-amber-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveGame(tab.id as any)
                  setSpinResult(null)
                  setWheelRotation(0)
                  setBoxState('idle')
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeGame === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-card border border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${activeGame === tab.id ? 'text-white' : tab.color}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Game Render Zone */}
          <div className="min-h-[420px] rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* LOMENTRA SPIN WHEEL */}
            {activeGame === 'lomentra' && (
              <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Pointer */}
                  <div className="absolute top-0 z-20 -mt-3.5 transform -translate-x-1/2 left-1/2 text-2xl filter drop-shadow-md">
                    👇
                  </div>
                  
                  {/* Wheel container */}
                  <div
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                    }}
                    className="w-full h-full rounded-full border-4 border-violet-500/20 shadow-xl overflow-hidden relative"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {wheelSegments.map((seg, i) => {
                        const N = wheelSegments.length
                        const startAngle = (i / N) * 360 - 90
                        const endAngle = ((i + 1) / N) * 360 - 90
                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180
                        
                        const x1 = 50 + 50 * Math.cos(startRad)
                        const y1 = 50 + 50 * Math.sin(startRad)
                        const x2 = 50 + 50 * Math.cos(endRad)
                        const y2 = 50 + 50 * Math.sin(endRad)
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`
                        const color = lomentraColors[i % lomentraColors.length]
                        
                        const midAngle = startAngle + (360 / N) / 2
                        const textAngle = midAngle + 90
                        
                        return (
                          <g key={i}>
                            <path d={pathData} fill={color} />
                            <text
                              x="50"
                              y="12"
                              fill="#ffffff"
                              fontSize="2.2"
                              fontWeight="900"
                              textAnchor="middle"
                              transform={`rotate(${textAngle} 50 50)`}
                            >
                              {seg.label}
                            </text>
                          </g>
                        )
                      })}
                    </svg>

                    {/* SVG overlay line dividers */}
                    <div className="absolute inset-0 rounded-full border border-violet-500/10 pointer-events-none" />
                  </div>
                  
                  {/* Spin Center button */}
                  <button
                    onClick={handleLomentraSpin}
                    disabled={spinning}
                    className="absolute z-10 w-16 h-16 rounded-full bg-white text-slate-900 border-4 border-violet-500 flex items-center justify-center font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-80"
                  >
                    {spinning ? 'SPINNING' : 'SPIN'}
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-foreground">Lomentra Official Store Wheel</h3>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    Spin the wheel to win a discount coupon code from 5% to 100% OFF valid on all items!
                  </p>
                </div>

                {spinResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center w-full space-y-2"
                  >
                    <p className="text-xs font-black text-emerald-500">🎉 Congratulations! You won {wonText || '50% Off'}!</p>
                    <div className="flex gap-2 justify-center items-center">
                      <code className="px-3 py-1 bg-muted rounded-lg font-bold text-xs border border-border">{spinResult}</code>
                      <button onClick={() => handleCopyCode(spinResult)} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition">
                        {copiedCode === spinResult ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* APPLE CYBER NEON WHEEL */}
            {activeGame === 'apple' && (
              <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Neon Pointer */}
                  <div className="absolute top-0 z-20 -mt-3.5 transform -translate-x-1/2 left-1/2 text-2xl filter drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                    💎
                  </div>

                  {/* Tech Wheel */}
                  <div
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: spinning ? 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none'
                    }}
                    className="w-full h-full rounded-full border-4 border-cyan-500/30 shadow-2xl overflow-hidden relative"
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {wheelSegments.map((seg, i) => {
                        const N = wheelSegments.length
                        const startAngle = (i / N) * 360 - 90
                        const endAngle = ((i + 1) / N) * 360 - 90
                        const startRad = (startAngle * Math.PI) / 180
                        const endRad = (endAngle * Math.PI) / 180
                        
                        const x1 = 50 + 50 * Math.cos(startRad)
                        const y1 = 50 + 50 * Math.sin(startRad)
                        const x2 = 50 + 50 * Math.cos(endRad)
                        const y2 = 50 + 50 * Math.sin(endRad)
                        
                        const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`
                        const color = appleColors[i % appleColors.length]
                        
                        const midAngle = startAngle + (360 / N) / 2
                        const textAngle = midAngle + 90
                        
                        const textColor = (i % 3 === 2) ? '#0f172a' : '#06b6d4'
                        
                        return (
                          <g key={i}>
                            <path d={pathData} fill={color} />
                            <text
                              x="50"
                              y="12"
                              fill={textColor}
                              fontSize="2.2"
                              fontWeight="900"
                              textAnchor="middle"
                              transform={`rotate(${textAngle} 50 50)`}
                            >
                              {seg.label}
                            </text>
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Spin Center button */}
                  <button
                    onClick={handleAppleSpin}
                    disabled={spinning}
                    className="absolute z-10 w-16 h-16 rounded-full bg-slate-900 text-cyan-400 border-4 border-cyan-500 flex items-center justify-center font-black text-xs shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-80"
                  >
                    {spinning ? 'SPINNING' : 'SPIN'}
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-foreground">Apple Cyber Tech Wheel</h3>
                  <p className="text-[11px] text-muted-foreground max-w-xs">
                    Spin the cyber-themed wheel to win a discount code from 5% to 100% OFF valid on premium Apple items.
                  </p>
                </div>

                {spinResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center w-full space-y-2"
                  >
                    <p className="text-xs font-black text-cyan-500">🎉 Congratulations! You won {wonText || '60% Off'}!</p>
                    <div className="flex gap-2 justify-center items-center">
                      <code className="px-3 py-1 bg-muted rounded-lg font-bold text-xs border border-border">{spinResult}</code>
                      <button onClick={() => handleCopyCode(spinResult)} className="p-1.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition">
                        {copiedCode === spinResult ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* NIKE SCRATCH TO WIN */}
            {activeGame === 'nike' && (
              <div className="flex flex-col items-center space-y-5 w-full max-w-xs">
                <div className="relative w-64 h-40 bg-slate-900 border-2 border-dashed border-rose-500/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-center items-center">
                  {/* Underlay won result */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center bg-gradient-to-tr from-slate-950 to-rose-950 p-4 space-y-3 z-0">
                    <span className="text-2xl">👟</span>
                    <h3 className="text-xs font-black text-rose-500 tracking-wider">NIKE ACTIVE WEAR</h3>
                    <p className="text-xs font-extrabold text-foreground">You Unlocked: 20% OFF</p>
                    <div className="flex gap-1.5 items-center">
                      <code className="px-2.5 py-1 bg-black/60 rounded-md font-mono text-xs text-slate-100 border border-slate-800">NKE20</code>
                      <button onClick={() => handleCopyCode('NKE20')} className="p-1 rounded bg-rose-500 text-white hover:bg-rose-600">
                        {copiedCode === 'NKE20' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Scratchable Canvas */}
                  {!scratchRevealed && (
                    <canvas
                      ref={canvasRef}
                      width={256}
                      height={160}
                      className="absolute inset-0 z-10 cursor-crosshair touch-none"
                      onMouseDown={() => setIsScratching(true)}
                      onMouseUp={() => setIsScratching(false)}
                      onMouseLeave={() => setIsScratching(false)}
                      onMouseMove={(e) => isScratching && handleScratchMove(e)}
                      onTouchStart={() => setIsScratching(true)}
                      onTouchEnd={() => setIsScratching(false)}
                      onTouchMove={(e) => isScratching && handleScratchMove(e)}
                    />
                  )}
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-sm font-black text-foreground">Nike Scratch & Win Card</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Click, hold, and scratch the silver surface to reveal a 20% discount coupon code on Nike Apparel.
                  </p>
                  {scratchedPercent > 0 && !scratchRevealed && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div className="bg-rose-500 h-full transition-all duration-150" style={{ width: `${Math.min(100, Math.round(scratchedPercent / 45 * 100))}%` }} />
                    </div>
                  )}
                  {scratchRevealed && (
                    <p className="text-xs font-black text-emerald-500 mt-2">✨ Card successfully scratched! Added to won shelf.</p>
                  )}
                </div>
              </div>
            )}

            {/* SONY MYSTERY BOX */}
            {activeGame === 'sony' && (
              <div className="flex flex-col items-center space-y-6 w-full max-w-xs">
                <div className="h-44 flex items-center justify-center relative">
                  <AnimatePresence mode="wait">
                    {boxState === 'opened' ? (
                      <motion.div
                        key="opened"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex flex-col items-center space-y-3"
                      >
                        <span className="text-6xl animate-bounce">🎁</span>
                        <div className="text-center space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs font-black text-amber-500">Unwrapped Sony Sound Coupon!</p>
                          <div className="flex gap-1.5 items-center justify-center">
                            <code className="px-2.5 py-1 bg-muted rounded-md font-mono text-xs text-foreground border border-border">SNY15</code>
                            <button onClick={() => handleCopyCode('SNY15')} className="p-1 rounded bg-amber-500 text-slate-950 hover:bg-amber-600 transition">
                              {copiedCode === 'SNY15' ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="closed"
                        onClick={handleSonyBoxOpen}
                        className={`text-7xl focus:outline-none transition-transform ${
                          boxState === 'shaking' ? 'animate-bounce' : 'hover:scale-105 active:scale-95'
                        }`}
                        animate={boxState === 'shaking' ? {
                          rotate: [-5, 5, -5, 5, 0],
                          transition: { repeat: Infinity, duration: 0.25 }
                        } : {}}
                      >
                        📦
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-foreground">Sony Mystery Acoustic Box</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Click the closed shipping crate to unwrap a mystery **15% discount coupon code** for Sony sound tech!
                  </p>
                  {boxState === 'idle' && (
                    <button
                      onClick={handleSonyBoxOpen}
                      className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-600 transition shadow shadow-amber-500/10"
                    >
                      Open Mystery Box
                    </button>
                  )}
                  {boxState === 'opened' && (
                    <button
                      onClick={() => setBoxState('idle')}
                      className="mt-3 px-4 py-2 rounded-xl border border-border text-foreground font-black text-xs hover:bg-accent transition"
                    >
                      Reset Game
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: All Won Coupons shelf */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <Award className="h-5 w-5 text-primary animate-pulse" />
              My Won Coupons ({wonCoupons.length})
            </h2>

            {wonCoupons.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-muted/10 border border-dashed border-border/80 rounded-2xl">
                <HelpCircle className="h-8 w-8 text-muted-foreground/60" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">No Won Coupons Yet</p>
                  <p className="text-[10px] text-muted-foreground max-w-[180px] mx-auto leading-relaxed">
                    Play the games on the left to win vouchers and unlock exclusive store discounts!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                {wonCoupons.map((coupon, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 p-4 space-y-2 hover:shadow-md transition-shadow group"
                  >
                    {/* Ticket Notches */}
                    <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-card border-r border-border" />
                    <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-card border-l border-border" />

                    <div className="flex justify-between items-start pl-2 pr-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-primary tracking-wider">{coupon.storeName}</span>
                        <h4 className="text-xs font-black text-foreground">{coupon.discountText}</h4>
                      </div>
                      <code className="text-xs font-mono font-black text-foreground bg-accent/40 px-2.5 py-1 rounded-lg border border-border">
                        {coupon.code}
                      </code>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-2 pl-2 pr-2 text-[9px]">
                      <span className="text-muted-foreground font-semibold">Won on {coupon.wonAt}</span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className={`flex items-center gap-1 font-black ${
                          copiedCode === coupon.code ? 'text-emerald-500' : 'text-primary hover:underline'
                        }`}
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3.5 space-y-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">💡 Checkout Integration</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                When you proceed to checkout, Lomentra will inspect your shopping cart and let you apply any of your won coupons with a single click in the checkout drawer!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
