import { useState } from 'react'
import { Gift } from 'lucide-react'

export function SpinWheel() {
  const [showWheel, setShowWheel] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonCoupon, setWonCoupon] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)

  const spinWheel = () => {
    if (isSpinning) return
    setIsSpinning(true)
    setWonCoupon(null)
    const extraSpins = 5 + Math.floor(Math.random() * 5)
    const selectedIndex = Math.floor(Math.random() * 6)
    const targetDeg = extraSpins * 360 + selectedIndex * 60
    setRotation(targetDeg)
    
    setTimeout(() => {
      setIsSpinning(false)
      const coupons = ['LOMENTRA10', 'NEON20', 'FUTURE30', 'FREESHIP', 'SUPREME50', 'LOOT50']
      setWonCoupon(coupons[5 - selectedIndex])
    }, 4000)
  }

  return (
    <>
      {/* Floating Coupon Spin Button */}
      <button
        onClick={() => setShowWheel(true)}
        className="fixed bottom-40 right-4 z-40 h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center animate-float animate-pulse-slow cursor-pointer"
        title="Spin the Wheel to Win Coupons!"
      >
        <Gift className="h-5 w-5" />
      </button>

      {/* Spin-the-Wheel Coupon Modal */}
      {showWheel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => { setShowWheel(false); setWonCoupon(null) }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-sm font-bold w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition cursor-pointer"
            >
              ×
            </button>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-black border border-pink-500/20">LOMENTRA LUCKY SPIN</span>
              <h3 className="text-xl font-black text-foreground mt-2">Spin & Get Discount Code!</h3>
              <p className="text-xs text-muted-foreground">Test your luck to win coupons up to 50% off!</p>
            </div>

            {/* SVG Segment Wheel */}
            <div className="relative w-64 h-64 mx-auto my-4 rounded-full border-4 border-primary shadow-2xl overflow-hidden bg-card">
              {/* Wheel Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-500 drop-shadow-md" />

              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              >
                {/* Segments */}
                <path d="M100,100 L100,0 A100,100 0 0,1 186.6,50 Z" fill="#7c3aed" />
                <path d="M100,100 L186.6,50 A100,100 0 0,1 186.6,150 Z" fill="#ec4899" />
                <path d="M100,100 L186.6,150 A100,100 0 0,1 100,200 Z" fill="#f43f5e" />
                <path d="M100,100 L100,200 A100,100 0 0,1 13.4,150 Z" fill="#3b82f6" />
                <path d="M100,100 L13.4,150 A100,100 0 0,1 13.4,50 Z" fill="#06b6d4" />
                <path d="M100,100 L13.4,50 A100,100 0 0,1 100,0 Z" fill="#10b981" />

                {/* Text Labels */}
                <text x="125" y="45" fill="#fff" fontSize="8" fontWeight="bold" transform="rotate(30, 125, 45)">10% OFF</text>
                <text x="155" y="105" fill="#fff" fontSize="8" fontWeight="bold" transform="rotate(90, 155, 105)">20% OFF</text>
                <text x="125" y="155" fill="#fff" fontSize="8" fontWeight="bold" transform="rotate(150, 125, 155)">30% OFF</text>
                <text x="65" y="165" fill="#fff" fontSize="7" fontWeight="bold" transform="rotate(210, 65, 165)">FREE SHIP</text>
                <text x="35" y="105" fill="#fff" fontSize="8" fontWeight="bold" transform="rotate(270, 35, 105)">50% OFF</text>
                <text x="65" y="45" fill="#fff" fontSize="8" fontWeight="bold" transform="rotate(330, 65, 45)">50% OFF</text>
              </svg>

              {/* Center Peg button */}
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white dark:bg-zinc-800 text-foreground text-xs font-black rounded-full border-4 border-primary flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-85 z-30 cursor-pointer"
              >
                {isSpinning ? '...' : 'SPIN'}
              </button>
            </div>

            {/* Results display */}
            {wonCoupon && (
              <div className="space-y-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl animate-in zoom-in-95 duration-300">
                <p className="text-[10px] text-primary font-black uppercase">🎉 Congratulations! You won:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-card border border-dashed border-primary text-sm font-black text-foreground rounded-lg tracking-wider">
                    {wonCoupon}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(wonCoupon)
                      alert(`Copied discount code: ${wonCoupon}`)
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg hover:bg-primary/90 transition cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground">Use this code at checkout for special savings.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
