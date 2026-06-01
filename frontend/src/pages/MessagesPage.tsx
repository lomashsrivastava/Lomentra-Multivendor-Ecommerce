import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Check, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Message {
  id: string
  sender: 'user' | 'agent' | 'bot'
  text: string
  timestamp: string
}

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  unread: boolean
  messages: Message[]
}

export function MessagesPage() {
  const { user } = useAuth()
  const [activeChatId, setActiveChatId] = useState<string>('support')
  const [inputText, setInputText] = useState('')
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 'support',
      name: 'Lomentra Support Core',
      avatar: '🛸',
      lastMessage: 'Let me know if you need assistance with your payments.',
      unread: false,
      messages: [
        { id: '1', sender: 'agent', text: 'Welcome to Lomentra Helpdesk. How can I assist you today?', timestamp: '10:00 AM' },
        { id: '2', sender: 'user', text: 'I had a question about delivery times in Delhi.', timestamp: '10:02 AM' },
        { id: '3', sender: 'agent', text: 'Typically, express delivery to Delhi takes 24-48 business hours. Normal shipping is 3-4 days.', timestamp: '10:03 AM' },
      ],
    },
    {
      id: 'ai-concierge',
      name: 'Lomentra AI Assistant',
      avatar: '🤖',
      lastMessage: 'Ask me anything about products, pricing, or reviews!',
      unread: true,
      messages: [
        { id: '1', sender: 'bot', text: 'Hello! I am your AI product concierge. Ask me for recommendations or comparisons.', timestamp: '09:15 AM' },
      ],
    },
    {
      id: 'merchant-alpha',
      name: 'FutureTech Electronics (Vendor)',
      avatar: '⚡',
      lastMessage: 'Yes, that item comes with a 2-year warranty.',
      unread: false,
      messages: [
        { id: '1', sender: 'agent', text: 'Hi! Thanks for checking out our store products.', timestamp: 'Yesterday' },
        { id: '2', sender: 'user', text: 'Does the premium laptop have local service centers?', timestamp: 'Yesterday' },
        { id: '3', sender: 'agent', text: 'Yes, we have 45 certified centers across India.', timestamp: 'Yesterday' },
      ],
    },
  ])

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat.messages, typing])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    // Update messages
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMessage: inputText,
            messages: [...c.messages, newMessage],
          }
        }
        return c
      })
    )

    setInputText('')

    // Simulate Agent response
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      const agentReplies: Record<string, string[]> = {
        support: [
          'Understood. I have logged that in our support database.',
          'Your support ticket has been highlighted. An agent is reviewing the logs.',
          'Is there anything else I can help you with regarding your account details?',
        ],
        'ai-concierge': [
          'Excellent query! According to our specs database, that laptop features an OLED display with 100% DCI-P3 coverage.',
          'I recommend looking at our best seller section for high-rated options.',
          'Would you like me to add similar options to your shopping cart?',
        ],
        'merchant-alpha': [
          'We appreciate your business. Let me check the warehouse stock for you.',
          'Yes, we can offer customized packing if requested.',
          'We ship all electronics inside sealed bubble pouches for maximum protection.',
        ],
      }

      const replies = agentReplies[activeChatId] || ['Thanks for your message!']
      const randomReply = replies[Math.floor(Math.random() * replies.length)]

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: activeChatId === 'ai-concierge' ? 'bot' : 'agent',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            return {
              ...c,
              lastMessage: randomReply,
              messages: [...c.messages, responseMessage],
            }
          }
          return c
        })
      )
    }, 1500)
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Authentication Required</h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            Please sign in to read your inbox messages or launch support channels.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-16 h-[76vh] flex flex-col">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Inbox & Support</h1>
            <p className="text-xs text-muted-foreground">
              Talk directly with vendor merchants or contact customer support.
            </p>
          </div>
        </div>
      </div>

      {/* Main chat window split container */}
      <div className="flex-1 flex rounded-3xl border border-border bg-card overflow-hidden shadow-2xl min-h-0">
        {/* Sidebar chats list */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border bg-muted/5 font-extrabold text-xs text-muted-foreground tracking-widest uppercase">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {chats.map((c) => {
              const isActive = c.id === activeChatId
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveChatId(c.id)
                    c.unread = false
                  }}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors relative ${
                    isActive ? 'bg-primary/5' : 'hover:bg-muted/10'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                  <span className="text-2xl h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
                    {c.avatar}
                  </span>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-extrabold text-foreground truncate">{c.name}</h4>
                      {c.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate leading-snug">{c.lastMessage}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Messaging Box */}
        <div className="flex-1 flex flex-col bg-muted/5 min-w-0">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl h-9 w-9 rounded-full bg-muted/30 flex items-center justify-center">
                {activeChat.avatar}
              </span>
              <div>
                <h3 className="text-xs font-extrabold text-foreground">{activeChat.name}</h3>
                <span className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Online
                </span>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {activeChat.messages.map((m) => {
              const isUser = m.sender === 'user'
              const isBot = m.sender === 'bot'

              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!isUser && (
                    <span className="text-lg h-7 w-7 rounded-full bg-muted/30 flex items-center justify-center">
                      {isBot ? '🤖' : '👤'}
                    </span>
                  )}
                  <div className="max-w-[70%] space-y-1">
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-br-none shadow-md shadow-primary/10'
                          : 'bg-card border border-border rounded-bl-none text-foreground shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    <div
                      className={`text-[8px] text-muted-foreground px-1 flex items-center gap-1 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{m.timestamp}</span>
                      {isUser && <Check className="h-2.5 w-2.5 text-primary" />}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Typing status indicator */}
            {typing && (
              <div className="flex justify-start items-center gap-2">
                <span className="text-lg h-7 w-7 rounded-full bg-muted/30 flex items-center justify-center">
                  💬
                </span>
                <div className="bg-card border border-border p-3 rounded-2xl rounded-bl-none flex items-center gap-1 text-muted-foreground text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat text input footer */}
          <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border flex gap-3 shrink-0">
            <input
              type="text"
              placeholder="Type your message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-muted/40 border border-border rounded-xl px-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-9 w-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
