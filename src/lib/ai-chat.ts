import { z } from 'zod'

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

const businessHours = {
  tr: {
    greeting: ['Merhaba', 'İyi günler', 'Size nasıl yardımcı olabilirim?'],
    services: ['Hizmetlerimizi görüntülemek ister misiniz?', 'Sunduğumuz hizmetlerden bahsetmek ister misiniz?'],
    booking: ['Randevu oluşturmak ister misiniz?', 'Hangi hizmeti almak istersiniz?'],
    calendar: ['Uygun saatleri gösterelim mi?', 'Hangi tarihi tercih edersiniz?'],
    closing: ['Başka bir konuda yardımcı olabilir miyim?', 'Başka sorunuz var mı?']
  },
  en: {
    greeting: ['Hello', 'Good day', 'How can I help you today?'],
    services: ['Would you like to see our services?', 'Would you like to hear about our services?'],
    booking: ['Would you like to book an appointment?', 'Which service would you like?'],
    calendar: ['Shall we show available times?', 'Which date would you prefer?'],
    closing: ['Can I help you with anything else?', 'Do you have any other questions?']
  }
}

export async function generateAIResponse(request: AIChatRequest): Promise<AIChatResponse> {
  const { message, customerName, language = 'tr' } = request
  
  const lowerMessage = message.toLowerCase()
  const lang = language as 'tr' | 'en'
  
  let response = ''
  let suggestions: string[] = []
  let action: AIChatResponse['action'] | undefined

  if (lowerMessage.includes('merhaba') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    const greetings = businessHours[lang].greeting
    response = `${customerName ? `${customerName}, ` : ''}${greetings[Math.floor(Math.random() * greetings.length)]}`
    suggestions = ['Randevu almak istiyorum', 'Hizmetlerinizi görmek istiyorum', 'Çalışma saatleriniz']
  }
  else if (lowerMessage.includes('randevu') || lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
    response = businessHours[lang].booking[Math.floor(Math.random() * businessHours[lang].booking.length)]
    suggestions = ['Saç kesimi', 'Sakal tıraşı', 'Cilt bakımı']
    action = { type: 'show_services' }
  }
  else if (lowerMessage.includes('hizmet') || lowerMessage.includes('service') || lowerMessage.includes('fiyat')) {
    response = 'Hizmetlerimiz hakkında detaylı bilgi almak ister misiniz? Aşağıdaki hizmetlerimizden birini seçebilirsiniz.'
    suggestions = ['Saç kesimi ne kadar?', 'Sakal tıraşı fiyatı', 'Cilt bakımı']
    action = { type: 'show_services' }
  }
  else if (lowerMessage.includes('saat') || lowerMessage.includes('time') || lowerMessage.includes('çalışma')) {
    response = 'Hafta içi 09:00-18:00, Cumartesi 10:00-16:00 arasında hizmet vermekteyiz. Pazar günleri kapalıyız.'
    suggestions = ['Yarın randevu almak istiyorum', 'Cumartesiye randevu']
  }
  else if (lowerMessage.includes('iletişim') || lowerMessage.includes('contact') || lowerMessage.includes('telefon')) {
    response = 'Bize telefon, e-posta veya WhatsApp üzerinden ulaşabilirsiniz. Müşteri hizmetlerimiz size yardımcı olmaktan mutluluk duyar.'
    suggestions = ['Telefon numaranızı öğrenmek istiyorum', 'E-posta adresiniz']
  }
  else if (lowerMessage.includes('teşekkür') || lowerMessage.includes('thanks') || lowerMessage.includes('thank')) {
    response = 'Rica ederim! Size yardımcı olabildiğim için mutluyum. Başka bir konuda yardımcı olabilir miyim?'
    suggestions = ['Randevu almak istiyorum', 'Hayır, teşekkürler']
  }
  else if (lowerMessage.includes('iptal') || lowerMessage.includes('cancel')) {
    response = 'Randevunuzu iptal etmek mi istiyorsunuz? Lütfen randevu kodunuzu veya telefon numaranızı paylaşın, size yardımcı olayım.'
    suggestions = ['Randevu kodum var', 'Telefon numaram ile']
  }
  else if (lowerMessage.includes('değiştir') || lowerMessage.includes('change') || lowerMessage.includes('ertele')) {
    response = 'Randevunuzu değiştirmek veya ertelemek için size yardımcı olabilirim. Mevcut randevu bilgilerinizi paylaşır mısınız?'
    suggestions = ['Randevu kodum ile', 'Telefon numaram ile']
  }
  else {
    response = businessHours[lang].closing[Math.floor(Math.random() * businessHours[lang].closing.length)]
    suggestions = ['Randevu almak istiyorum', 'Hizmetlerinizi görmek istiyorum', 'İletişim bilgileri']
  }

  return {
    message: response,
    suggestions,
    action
  }
}

export function detectLanguage(text: string): 'tr' | 'en' {
  const turkishWords = ['merhaba', 'randevu', 'hizmet', 'saat', 'teşekkür', 'istiyorum', 'ne kadar', 'nasıl', 'evet', 'hayır']
  const englishWords = ['hello', 'appointment', 'service', 'time', 'thanks', 'want', 'how much', 'how', 'yes', 'no']
  
  const lowerText = text.toLowerCase()
  let turkishCount = 0
  let englishCount = 0
  
  turkishWords.forEach(word => {
    if (lowerText.includes(word)) turkishCount++
  })
  
  englishWords.forEach(word => {
    if (lowerText.includes(word)) englishCount++
  })
  
  return turkishCount >= englishCount ? 'tr' : 'en'
}
