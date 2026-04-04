import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/public/review-request
 * Token ile review request detaylarını getir
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 400 })
    }

    // Token decode et (base64 encoded bookingId)
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const bookingId = decoded

    if (!bookingId) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 })
    }

    // Review request'i bul
    const reviewRequest = await db.reviewRequest.findFirst({
      where: {
        bookingId,
        status: 'pending',
      },
      include: {
        booking: {
          select: {
            bookingDate: true,
            startTime: true,
            service: {
              select: {
                name: true,
              },
            },
            staff: {
              select: {
                fullName: true,
              },
            },
          },
        },
        customer: {
          select: {
            fullName: true,
          },
        },
        tenant: {
          select: {
            name: true,
            businessProfile: {
              select: {
                businessName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    })

    if (!reviewRequest) {
      return NextResponse.json(
        { error: 'Değerlendirme talebi bulunamadı veya zaten tamamlandı' },
        { status: 404 }
      )
    }

    // Randevu tamamlanmış mı kontrol et
    const bookingDateTime = new Date(`${reviewRequest.booking.bookingDate}T${reviewRequest.booking.startTime}`)
    if (bookingDateTime > new Date()) {
      return NextResponse.json(
        { error: 'Randevu henüz tamamlanmadı' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      reviewRequest: {
        id: reviewRequest.id,
        businessName: reviewRequest.tenant.businessProfile?.businessName || reviewRequest.tenant.name,
        logoUrl: reviewRequest.tenant.businessProfile?.logoUrl,
        customerName: reviewRequest.customer.fullName,
        serviceName: reviewRequest.booking.service.name,
        staffName: reviewRequest.booking.staff?.fullName,
        bookingDate: reviewRequest.booking.bookingDate,
        bookingTime: reviewRequest.booking.startTime,
      },
    })
  } catch (error) {
    console.error('Review request fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

/**
 * POST /api/public/review-request
 * Değerlendirme gönder
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, rating, comment } = body

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Token ve geçerli bir puan (1-5) gerekli' },
        { status: 400 }
      )
    }

    // Token decode et
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const bookingId = decoded

    if (!bookingId) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 400 })
    }

    // Review request'i bul ve güncelle
    const reviewRequest = await db.reviewRequest.findFirst({
      where: {
        bookingId,
        status: 'pending',
      },
    })

    if (!reviewRequest) {
      return NextResponse.json(
        { error: 'Değerlendirme talebi bulunamadı veya zaten tamamlandı' },
        { status: 404 }
      )
    }

    // Güncelle
    await db.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: {
        rating,
        comment: comment?.trim() || null,
        status: 'completed',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Değerlendirmeniz için teşekkür ederiz!',
    })
  } catch (error) {
    console.error('Review submission error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
