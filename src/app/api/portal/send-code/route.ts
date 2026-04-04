import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import { smsTemplateService } from '@/lib/sms/template-service'
import { checkIPRateLimit, checkPhoneRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // 1. IP bazlı rate limiting (CRITICAL FIX)
    const ipRateLimit = await checkIPRateLimit(req, {
      windowMs: 15 * 60 * 1000,  // 15 dakika
      maxRequests: 10  // 10 deneme
    })

    if (!ipRateLimit.success) {
      return createRateLimitResponse(ipRateLimit)
    }

    const { phone, slug } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Telefon gerekli' }, { status: 400 })
    }

    // Telefon formatı kontrolü
    const phoneRegex = /^5\d{9}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Geçersiz telefon numarası' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\s/g, '')

    // 2. Telefon bazlı rate limiting (CRITICAL FIX)
    const phoneRateLimit = await checkPhoneRateLimit(cleanPhone, {
      windowMs: 15 * 60 * 1000,  // 15 dakika
      maxRequests: 3  // 3 deneme
    })

    if (!phoneRateLimit.success) {
      return NextResponse.json({
        error: 'Bu telefon numarası için çok fazla deneme. Lütfen 15 dakika sonra tekrar deneyin.'
      }, { status: 429 })
    }

    // CRITICAL FIX: Tenant slug ile birlikte ara
    let tenantId: string | undefined

    if (slug) {
      // Slug varsa tenant'ı bul
      const tenant = await db.tenant.findUnique({
        where: { slug }
      })
      if (!tenant) {
        return NextResponse.json({ error: 'İşletme bulunamadı' }, { status: 404 })
      }
      tenantId = tenant.id
    }

    const customer = await db.customer.findFirst({
      where: {
        phone: cleanPhone,
        ...(tenantId && { tenantId }) // Tenant isolation
      },
      include: {
        bookings: {
          where: {
            bookingDate: { gte: new Date().toISOString().split('T')[0] },
            deletedAt: null
          },
          include: {
            service: true,
            staff: true
          },
          orderBy: { bookingDate: 'asc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Bu telefon numarasıyla kayıtlı müşteri bulunamadı' }, { status: 404 })
    }

    // Rastgele 6 haneli kod üret
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Kodun geçerlilik süresi: 5 dakika
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Eski kodları temizle
    await db.verificationCode.deleteMany({
      where: { phone: cleanPhone }
    })

    // Yeni kodu kaydet
    await db.verificationCode.create({
      data: {
        phone: cleanPhone,
        code,
        expiresAt
      }
    })

    // SMS Template sisteminden özelleştirilmiş mesaj al
    const customerTenantId = customer.tenantId
    const templateMessage = await smsTemplateService.formatVerificationCode(
      customerTenantId,
      {
        code,
        businessName: 'RandevuAI', // Public endpoint için generic isim
      }
    )

    // SMS gönder
    const message = templateMessage || `RandevuAI dogrulama kodunuz: ${code}. Bu kod 5 dakika gecerlidir.`
    const smsResult = await sendSMS({
      phone: cleanPhone,
      message
    })

    if (!smsResult.success) {
      console.error('SMS gönderme hatası:', smsResult.error)
      // SMS gönderilemese bile kod üretildi, development için devam et
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Doğrulama kodu gönderildi',
      // Development ortamında kodu döndür
      ...(process.env.NODE_ENV !== 'production' && { code })
    })
  } catch (error) {
    console.error('Portal send-code error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
