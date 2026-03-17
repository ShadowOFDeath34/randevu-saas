import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'

// Rate limiting için basit memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(phone: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 dakika
  const maxAttempts = 3 // 3 deneme

  const record = rateLimitStore.get(phone)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(phone, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false
  }

  record.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Telefon gerekli' }, { status: 400 })
    }

    // Telefon formatı kontrolü
    const phoneRegex = /^5\d{9}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Geçersiz telefon numarası' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\s/g, '')

    // Rate limiting kontrolü
    if (!checkRateLimit(cleanPhone)) {
      return NextResponse.json({
        error: 'Çok fazla deneme. Lütfen 1 dakika sonra tekrar deneyin.'
      }, { status: 429 })
    }

    const customer = await db.customer.findFirst({
      where: { phone: cleanPhone },
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

    // SMS gönder
    const message = `RandevuAI dogrulama kodunuz: ${code}. Bu kod 5 dakika gecerlidir.`
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
