import { useState, useEffect } from 'react'
import { Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface AIReviewSummaryProps {
  productId: string
  reviewCount: number
}

interface SummaryData {
  pros: string[]
  cons: string[]
  sentiment: number
  summary: string
}

export default function AIReviewSummary({ productId, reviewCount }: AIReviewSummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    if (reviewCount === 0) return
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch('/api/ai/review-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate review summary')
      }

      const data = await res.json()
      setSummary(data.summary)
    } catch (err) {
      console.error(err)
      setError('Could not compile AI feedback analysis at this time.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId && reviewCount > 0) {
      fetchSummary()
    } else {
      setSummary(null)
    }
  }, [productId, reviewCount])

  if (reviewCount === 0) {
    return (
      <div className="p-4 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 text-center text-slate-400">
        <Sparkles className="h-5 w-5 mx-auto mb-2 text-indigo-400 animate-pulse" />
        <p className="text-sm font-medium">No customer reviews yet. Purchase this item to leave the first review!</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm text-slate-300 font-medium">Synthesizing review sentiments with Lomentra AI...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl border border-red-900/50 bg-red-950/20 text-red-400 text-sm text-center">
        <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-400" />
        <p>{error}</p>
        <button
          onClick={fetchSummary}
          className="mt-2 text-xs text-indigo-400 font-semibold hover:underline"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!summary) return null

  // Determine sentiment color
  const getSentimentColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500 text-emerald-400'
    if (score >= 50) return 'bg-amber-500 text-amber-400'
    return 'bg-rose-500 text-rose-400'
  }

  const sentimentColorClass = getSentimentColor(summary.sentiment)

  return (
    <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Lomentra AI Review summary
          </h4>
          <p className="text-xs text-slate-400">Synthesized insights from verified buyers</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-5 leading-relaxed italic border-l-2 border-indigo-500/40 pl-3">
        "{summary.summary}"
      </p>

      {/* Sentiment meter */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs font-semibold mb-1">
          <span className="text-slate-400">Buyer Sentiment</span>
          <span className={`${sentimentColorClass.split(' ')[1]}`}>
            {summary.sentiment}% Positive
          </span>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${sentimentColorClass.split(' ')[0]}`}
            style={{ width: `${summary.sentiment}%` }}
          />
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Pros</span>
          </div>
          <ul className="space-y-1.5">
            {summary.pros.map((pro, index) => (
              <li key={index} className="text-xs text-slate-300 flex items-start gap-1">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Cons</span>
          </div>
          <ul className="space-y-1.5">
            {summary.cons.map((con, index) => (
              <li key={index} className="text-xs text-slate-300 flex items-start gap-1">
                <span className="text-rose-500 mt-0.5">•</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
