import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAIResponse, detectLanguage } from '@/lib/ai-chat'
import { checkIPRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limiting: 20 requests per minute per IP
  const rateLimit = await checkIPRateLimit(req, defaultConfigs.ai)
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit)
  }
  try {
    const body = await req.json()
    const { message, tenantSlug, customerId } = body

    if (!message || !tenantSlug) {
      return NextResponse.json(
        { error: 'Mesaj ve tenantSlug gereklidir' },
        { status: 400 }
      )
    }

    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        businessProfile: true
      }
    })

    if (!tenant) {
      return NextResponse.json(
        { error: 'İşletme bulunamadı' },
        { status: 404 }
      )
    }

    let customerName: string | undefined
    
    if (customerId) {
      const customer = await db.customer.findFirst({
        where: { id: customerId, tenantId: tenant.id }
      })
      if (customer) {
        customerName = customer.fullName
      }
    }

    // lastBooking verisi şu anda kullanılmıyor, gelecekte kullanılacak
    // const lastBooking = await db.booking.findFirst({...

    const language = detectLanguage(message)

    const response = await generateAIResponse({
      message,
      tenantId: tenant.id,
      customerName,
      language
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('AI Chat error:', error)
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: 'Üzgünüm, şu anda yardımcı olamıyorum. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    )
  }
}
