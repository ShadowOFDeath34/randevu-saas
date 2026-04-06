import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Mesaj gereklidir').max(500),
  tenantId: z.string(),
  customerId: z.string().optional(),
  context: z.object({
    customerName: z.string().optional(),
    lastBooking: z.object({
      service: z.string(),
      date: z.string(),
      time: z.string()
    }).optional()
  }).optional()
})

export type AIChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIChatRequest {
  message: string
  tenantId: string
  customerId?: string
  customerName?: string
  language?: string
}

export interface AIChatResponse {
  message: string
  suggestions?: string[]
  action?: {
    type: 'create_booking' | 'show_services' | 'show_calendar' | 'contact_support'
    data?: Record<string, unknown>
  }
}

const SYSTEM_PROMPT = `Sen bir randevu yönetim platformunun AI asistanısın.
Müşterilere randevu almalarında, hizmetler hakkında bilgi vermekte ve sorularını yanıtlamakta yardımcı ol.

Kurallar:
- Türkçe mesaja Türkçe, İngilizce mesaja İngilizce yanıt ver
- Kısa ve net ol (maksimum 2-3 cümle)
- Randevu, iptal, değiştirme konularında yönlendirici ol
- Fiyat/saat bilgisi yoksa "işletmeyle iletişime geçin" de
- SADECE JSON formatında yanıt ver:
  {"message": "yanıt metni", "suggestions": ["buton1", "buton2"], "action": {"type": "show_services"} veya null}
- action type seçenekleri: show_services, show_calendar, create_booking, contact_support
- suggestions maksimum 3 adet kısa buton metni`

function getFallbackResponse(message: string): AIChatResponse {
  const lower = message.toLowerCase()
  if (lower.includes('randevu') || lower.includes('appointment')) {
    return {
      message: 'Randevu almak için hizmetlerimizi inceleyebilirsiniz.',
      suggestions: ['Hizmetleri gör', 'Takvimi gör'],
      action: { type: 'show_services' }
    }
  }
  return {
    message: 'Size nasıl yardımcı olabilirim?',
    suggestions: ['Randevu almak istiyorum', 'Hizmetler', 'İletişim'],
  }
}

export async function generateAIResponse(request: AIChatRequest): Promise<AIChatResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return getFallbackResponse(request.message)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const contextLine = request.customerName ? `Müşteri adı: ${request.customerName}\n` : ''
    const prompt = `${contextLine}Mesaj: ${request.message}`

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: prompt }
    ])

    const text = result.response.text().trim()

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          message: parsed.message || text,
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
          action: parsed.action || undefined
        }
      }
    } catch {
      // JSON parse başarısız — ham metni döndür
    }

    return { message: text }
  } catch (error) {
    console.error('Gemini AI error:', error)
    return getFallbackResponse(request.message)
  }
}

export function detectLanguage(text: string): 'tr' | 'en' {
  const turkishChars = /[çğışöüÇĞİŞÖÜ]/
  const turkishWords = ['merhaba', 'randevu', 'hizmet', 'teşekkür', 'istiyorum', 'evet', 'hayır', 'nasıl']
  const lower = text.toLowerCase()
  if (turkishChars.test(text)) return 'tr'
  if (turkishWords.some(w => lower.includes(w))) return 'tr'
  return 'en'
}
