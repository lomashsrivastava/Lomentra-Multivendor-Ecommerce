import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, Sparkles, Loader2, ShoppingCart, Eye } from 'lucide-react'

interface Product {
  _id: string
  name: string
  price: number
  category: string
  images: string[]
  stock: number
  description: string
}

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  products?: Product[]
}

interface ChatWidgetProps {
  onViewProduct: (product: any) => void
  onAddToCart: (product: any) => void
}

export default function ChatWidget({ onViewProduct, onAddToCart }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hi! I am Lomentra AI Shopping Assistant. Ask me to find products, recommend items, or answer your e-commerce questions!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userText = input.trim()
    const userMsgId = Date.now().toString()
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: userText }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to chat')
      }

      const reply = data.chat?.reply || "I'm having trouble thinking of a reply right now. Feel free to browse our categories!"
      const recommendedProducts = (data.chat?.products || []).map((p: any) => ({
        ...p,
        _id: p._id || p.id, // ensure ID compatibility
      }))

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: reply,
          products: recommendedProducts,
        },
      ])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'I apologize, my AI core is currently undergoing a brief refresh. Please ask me again shortly.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      <div
        className={`w-[360px] sm:w-[380px] h-[500px] flex flex-col rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden mb-4 transition-all duration-355 origin-bottom-right ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
        }`}
      >
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40 relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Lomentra AI Assist
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </h4>
              <p className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Powered by Lomentra
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/20">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-750 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {/* Recommended Products cards if present */}
              {msg.products && msg.products.length > 0 && (
                <div className="pl-4 border-l border-indigo-500/30 py-1 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Suggested products:
                  </p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1 max-w-full snap-x">
                    {msg.products.map((prod) => (
                      <div
                        key={prod._id}
                        className="flex-shrink-0 w-[180px] bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 space-y-1.5 snap-start hover:border-slate-750 transition"
                      >
                        <div className="h-20 w-full overflow-hidden rounded bg-slate-900 flex items-center justify-center relative">
                          {prod.images && prod.images.length > 0 ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Bot className="h-8 w-8 text-slate-700" />
                          )}
                          <span className="absolute top-1 right-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-400">
                            ${prod.price.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-[11px] font-bold text-slate-200 truncate">
                            {prod.name}
                          </h5>
                          <p className="text-[9px] text-slate-400 truncate">
                            {prod.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            onClick={() => onViewProduct(prod)}
                            className="flex items-center justify-center gap-1 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-[9px] font-semibold cursor-pointer"
                          >
                            <Eye className="h-2.5 w-2.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => onAddToCart(prod)}
                            disabled={prod.stock <= 0}
                            className="flex items-center justify-center gap-1 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-semibold cursor-pointer disabled:bg-slate-850 disabled:text-slate-650"
                          >
                            <ShoppingCart className="h-2.5 w-2.5" />
                            <span>Cart</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-slate-750 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                <span>AI is formulating suggestions...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/45 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, orders, recommendations..."
            className="flex-1 p-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-650 text-white flex items-center justify-center transition cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white shadow-2xl flex items-center justify-center relative cursor-pointer group transition-all duration-200 pointer-events-auto"
      >
        <MessageSquare className="h-6 w-6 group-hover:rotate-6 transition-transform duration-200" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
      </button>
    </div>
  )
}
