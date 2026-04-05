import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  // Get tenant slug from user's tenant
  let tenantSlug = 'demo'
  if (session.user.tenantId) {
    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true }
    })
    if (tenant) {
      tenantSlug = tenant.slug
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Asistan</h1>
              <p className="text-muted-foreground">24/7 size yardımcı olmaya hazır</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
            <AIChatFull tenantSlug={tenantSlug} customerId={session.user.id} />
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Randevu Alın</h3>
            <p className="text-xs text-muted-foreground">Hızlıca randevu oluşturun</p>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Hizmet Bilgisi</h3>
            <p className="text-xs text-muted-foreground">Tüm hizmetler hakkında bilgi</p>
          </div>

          <div className="bg-white p-4 rounded-xl border text-center">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 9v4m0 0H9m3 0h3" />
              </svg>
            </div>
            <h3 className="font-medium text-sm">Destek</h3>
            <p className="text-xs text-muted-foreground">Sorularınıza anında yanıt</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full-page chat component (same widget, different layout)
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, Sparkles, Loader2, User } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  action?: {
    type: string
    data?: Record<string, unknown>
  }
}

interface AIChatFullProps {
  tenantSlug: string
  customerId?: string
}

function AIChatFull({ tenantSlug, customerId }: AIChatFullProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Merhaba! Ben AI asistanınız. Size randevu alma, hizmetlerimiz hakkında bilgi verme ve sorularınızı yanıtlama konusunda yardımcı olabilirim. Nasıl yardımcı olabilirim?',
      timestamp: new Date(),
      suggestions: ['Randevu almak istiyorum', 'Hizmetlerinizi görmek istiyorum', 'Çalışma saatleriniz nedir?']
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          tenantSlug,
          customerId
        })
      })

      if (response.ok) {
        const data = await response.json()

        setTimeout(() => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.message,
            timestamp: new Date(),
            suggestions: data.suggestions,
            action: data.action
          }
          setMessages(prev => [...prev, assistantMessage])
          setIsTyping(false)
          setIsLoading(false)
        }, 800)
      } else {
        throw new Error('API error')
      }
    } catch (error) {
      setIsTyping(false)
      setIsLoading(false)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-4" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="animate-in slide-in-from-bottom-2">
              <div
                className={`flex gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  message.role === 'assistant'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-5 py-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground mt-1 ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    {message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className={`flex flex-wrap gap-2 mt-3 ${
                      message.role === 'user' ? 'justify-end' : ''
                    }`}
                    >
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-sm px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors text-gray-600"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center"
              >
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 border-t bg-white">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı yazın... (örn: Randevu almak istiyorum)"
              className="h-12 pr-4"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 px-6"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                <span>Gönder</span>
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          <Sparkles className="w-3 h-3 inline mr-1" />
          AI destekli sohbet • Bilgileriniz güvende ve şifrelenmiştir
        </p>
      </form>
    </>
  )
}
