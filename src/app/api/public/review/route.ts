import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash } from 'crypto'
import { addPoints, getOrCreateLoyaltyConfig } from '@/lib/loyalty/service'

// CRITICAL FIX: Secure review token oluşturma
function createReviewToken(bookingId: string, tenantId: string): string {
  const data = `${bookingId}:${tenantId}:${process.env.NEXTAUTH_SECRET?.slice(0, 16) || 'fallback-secret'}`
  const hash = createHash('sha256').update(data).digest('hex').slice(0, 16)
  return Buffer.from(`${bookingId}:${hash}`).toString('base64url')
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token') // CRITICAL: 'code' yerine 'token' kullan

    if (!token) {
      return NextResponse.json({ error: 'Token gereklidir' }, { status: 400 })
    }

    // CRITICAL FIX: Token doğrulama
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [bookingId] = decoded.split(':')

    if (!bookingId) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 })
    }

    // Booking'i tenant bilgisiyle birlikte getir
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: true,
        customer: true,
        tenant: {
          include: {
            businessProfile: true
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })
    }

    // CRITICAL FIX: Token hash doğrulaması
    const expectedData = `${bookingId}:${booking.tenantId}:${process.env.NEXTAUTH_SECRET?.slice(0, 16) || 'fallback-secret'}`
    const expectedHash = createHash('sha256').update(expectedData).digest('hex').slice(0, 16)
    const [, providedHash] = decoded.split(':')

    if (providedHash !== expectedHash) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Error fetching review' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, rating, comment } = body // CRITICAL: 'code' yerine 'token'

    if (!token || !rating) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })
    }

    // Token doğrula
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const [bookingId] = decoded.split(':')

    if (!bookingId) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 })
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { tenant: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Randevu bulunamadı' }, { status: 404 })
    }

    // CRITICAL FIX: Token hash doğrulaması
    const expectedData = `${bookingId}:${booking.tenantId}:${process.env.NEXTAUTH_SECRET?.slice(0, 16) || 'fallback-secret'}`
    const expectedHash = createHash('sha256').update(expectedData).digest('hex').slice(0, 16)
    const [, providedHash] = decoded.split(':')

    if (providedHash !== expectedHash) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
    }

    const existingRequest = await db.reviewRequest.findUnique({
      where: { bookingId: booking.id }
    })

    if (existingRequest) {
      if (existingRequest.status === 'completed') {
        return NextResponse.json({ error: 'Zaten değerlendirme yapılmış' }, { status: 400 })
      }

      await db.reviewRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'completed' }
      })
    }

    // ReviewRequest'i güncelle - rating ve comment ekle
    if (rating && existingRequest) {
      await db.reviewRequest.update({
        where: { id: existingRequest.id },
        data: {
          rating: parseInt(rating),
          comment: comment || null,
          status: 'completed',
          isPublished: false // Moderasyon için
        }
      })
    }

    // Loyalty puan ekle - değerlendirme yapıldığında
    if (booking.customerId) {
      try {
        const config = await getOrCreateLoyaltyConfig(booking.tenantId)
        await addPoints(
          booking.tenantId,
          booking.customerId,
          config.pointsPerReview,
          'EARNED_REVIEW',
          `Değerlendirme yapıldı: ${booking.serviceId}`,
          booking.id
        )
      } catch (loyaltyErr) {
        console.error('Loyalty review points error:', loyaltyErr)
        // Loyalty hatası review işlemini etkilemesin
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ error: 'Error submitting review' }, { status: 500 })
  }
}
