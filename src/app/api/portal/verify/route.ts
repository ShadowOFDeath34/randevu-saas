import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production'
)

export async function POST(req: NextRequest) {
  try {
    const { code, phone } = await req.json()

    if (!code || !phone) {
      return NextResponse.json({ error: 'Kod ve telefon gerekli' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\s/g, '')

    // Veritabanından kodu kontrol et
    const verificationRecord = await db.verificationCode.findFirst({
      where: {
        phone: cleanPhone,
        code: code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!verificationRecord) {
      return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş kod' }, { status: 401 })
    }

    // Kodu kullanıldı olarak işaretle
    await db.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { used: true }
    })

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
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
    }

    // JWT token oluştur
    const token = await new SignJWT({
      customerId: customer.id,
      phone: customer.phone,
      type: 'portal'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const bookings = customer.bookings.map(b => ({
      id: b.id,
      date: b.bookingDate,
      time: b.startTime,
      status: b.status,
      service: {
        name: b.service.name,
        price: b.service.price,
        duration: b.service.durationMinutes
      },
      staff: {
        name: b.staff.fullName
      }
    }))

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone
      },
      bookings
    })
  } catch (error) {
    console.error('Portal verify error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
