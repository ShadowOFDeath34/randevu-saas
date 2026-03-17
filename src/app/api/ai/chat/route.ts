import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateAIResponse, detectLanguage } from '@/lib/ai-chat'

export async function POST(req: Request) {
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

    const lastBooking = await db.booking.findFirst({
      where: { tenantId: tenant.id, customerId },
      orderBy: { bookingDate: 'desc' },
      include: { service: true }
    })

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
