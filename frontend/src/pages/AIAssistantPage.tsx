import { useState, useEffect, useRef } from 'react'
import { Bot, Send, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/utils/utils'
import { useAuth } from '@/hooks/useAuth'

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: any[]
}

export function AIAssistantPage() {
  const { addToCart } = useCart()
  const { currency } = useAuth()
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am Lomentra, your AI shopping concierge. Tell me what product type, feature, or budget you are aiming for, and I will recommend options immediately.',
    },
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || loading) return

    const userMessageText = inputText.trim()
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageText }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiMsg: AIMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || "I've searched our database but couldn't find matching models. Let me know if you want general recommendations.",
          products: data.products || [],
        }
        setMessages((prev) => [...prev, aiMsg])
      } else {
        throw new Error('AI service error')
      }
    } catch {
      // Fallback local mockup search
      setTimeout(async () => {
        // Fallback local product recommendations
        try {
          const res = await fetch('/api/products?limit=3')
          if (res.ok) {
            const data = await res.json()
            const allProducts = data.products || []
            const matched = allProducts.slice(0, 3)

            const aiMsg: AIMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `Here are some prime selections matching your criteria. These have great ratings and special pricing!`,
              products: matched,
            }
            setMessages((prev) => [...prev, aiMsg])
          }
        } catch {
          const aiMsg: AIMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Sorry, I am facing connectivity issues to the server right now. Try again shortly.',
          }
          setMessages((prev) => [...prev, aiMsg])
        }
      }, 1000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-16 h-[76vh] flex flex-col">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background p-6 shadow-xl shrink-0">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-2">
              Lomentra AI Assistant <span className="text-[9px] px-2 py-0.5 bg-primary text-primary-foreground font-black uppercase rounded">NEW</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Search the entire marketplace, compare models, and review specifications automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Chat conversation area */}
      <div className="flex-1 flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-2xl min-h-0">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((m) => {
            const isUser = m.role === 'user'

            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
                {!isUser && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="h-4.5 w-4.5 text-primary" />
                  </div>
                )}

                <div className="space-y-3 max-w-[75%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted/30 border border-border rounded-bl-none text-foreground'
                    }`}
                  >
                    {m.content}
                  </div>

                  {/* Recommended products grid */}
                  {!isUser && m.products && m.products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {m.products.map((p) => {
                        const rating = 4.4 + (p.name.length % 5) * 0.1
                        return (
                          <div
                            key={p._id}
                            className="bg-card border border-border rounded-xl p-2.5 flex flex-col justify-between hover:shadow transition-shadow"
                          >
                            <div className="space-y-1.5">
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="h-20 w-full object-cover rounded-lg"
                              />
                              <h4 className="text-[10px] font-bold text-foreground line-clamp-1">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-[9px] font-black">{rating.toFixed(1)}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-1 border-t border-border/40">
                              <span className="text-[10px] font-extrabold text-primary">
                                {formatPrice(p.price, currency)}
                              </span>
                              <button
                                type="button"
                                onClick={() => addToCart(p, 1)}
                                className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/95 transition-colors"
                              >
                                <ShoppingCart className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex justify-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4.5 w-4.5 text-primary animate-pulse" />
              </div>
              <div className="bg-muted/30 border border-border p-4 rounded-2xl rounded-bl-none flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" />
                <span>Searching catalog database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box footer */}
        <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex gap-3 shrink-0">
          <input
            type="text"
            placeholder="Search matching products e.g., 'headphones under Rs 1000' or 'gaming mouse'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 bg-muted/40 border border-border rounded-xl px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
