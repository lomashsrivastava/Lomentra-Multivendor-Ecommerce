import React, { useState } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface GeneratedDetails {
  name: string
  description: string
  category: string
  price: number
  tags: string[]
}

interface AIProductFormAssistantProps {
  onGenerate: (details: GeneratedDetails) => void
}

export default function AIProductFormAssistant({ onGenerate }: AIProductFormAssistantProps) {
  const { token } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate product details')
      }

      if (data.details) {
        onGenerate(data.details)
        setPrompt('')
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred during AI listing generation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-xl border border-slate-750 bg-slate-900/30 space-y-3 relative overflow-hidden">
      <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
        <Sparkles className="h-4 w-4" />
        <span>Lomentra AI Product Wizard</span>
      </div>

      <p className="text-[11px] text-slate-400 leading-normal">
        Type a rough description of the item you want to sell (e.g. "wireless headphones with long battery life, black") and Lomentra will auto-fill your listing forms!
      </p>

      {error && (
        <div className="flex items-start gap-1.5 p-2 rounded bg-red-950/20 border border-red-900/40 text-[11px] text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. noise-cancelling blue gaming headset with microphone..."
          className="flex-1 p-2 rounded border border-slate-700 bg-slate-950 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          disabled={loading}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 rounded font-bold bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-500 text-xs text-white flex items-center gap-1.5 transition cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Autofill Form</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
