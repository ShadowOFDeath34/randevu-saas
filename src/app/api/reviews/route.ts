import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
// NotificationChannel kullanılmıyor

/**
 * GET /api/reviews
 * Tüm değerlendirme taleplerini getir
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reviews = await db.reviewRequest.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        customer: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        booking: {
          select: {
            bookingDate: true,
            startTime: true,
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    })

    // Stats hesapla
    const total = reviews.length
    const published = reviews.filter(r => r.isPublished).length
    const pending = reviews.filter(r => !r.isPublished && r.rating !== null).length
    const ratedReviews = reviews.filter(r => r.rating !== null)
    const averageRating = ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedReviews.length
      : 0

    return NextResponse.json({
      reviews,
      stats: {
        total,
        published,
        pending,
        averageRating: Math.round(averageRating * 10) / 10,
      },
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

/**
 * PUT /api/reviews
 * Değerlendirme yayınlama durumunu güncelle
 */
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, isPublished } = body

    if (!id || typeof isPublished !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Review'nin bu tenant'a ait olduğunu kontrol et
    const existingReview = await db.reviewRequest.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    const updated = await db.reviewRequest.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    })

    return NextResponse.json({
      success: true,
      review: updated,
    })
  } catch (error) {
    console.error('Review update error:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}
