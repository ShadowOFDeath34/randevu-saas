import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addPoints, completeReferral, getOrCreateLoyaltyConfig } from '@/lib/loyalty/service'

// POST /api/loyalty/webhook - Webhook for booking events
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, tenantId, data } = body

    if (!event || !tenantId || !data?.bookingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const config = await getOrCreateLoyaltyConfig(tenantId)
    const booking = await db.booking.findUnique({
      where: { id: data.bookingId },
      include: { customer: true }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const customerId = booking.customerId
    const results: string[] = []

    switch (event) {
      case 'booking.created':
        // Award points for new booking
        await addPoints(
          tenantId,
          customerId,
          config.pointsPerBooking,
          'EARNED_BOOKING',
          'Randevu oluşturma bonusu',
          booking.id
        )
        results.push(`Awarded ${config.pointsPerBooking} points for booking`)
        break

      case 'booking.completed':
        // Award points for completed booking
        await addPoints(
          tenantId,
          customerId,
          config.pointsPerCompletion,
          'EARNED_COMPLETION',
          'Randevu tamamlama bonusu',
          booking.id
        )
        results.push(`Awarded ${config.pointsPerCompletion} points for completion`)

        // Check and complete referral if this is first booking
        await completeReferral(tenantId, customerId)
        results.push('Checked referral completion')
        break

      case 'review.submitted':
        // Award points for review
        await addPoints(
          tenantId,
          customerId,
          config.pointsPerReview,
          'EARNED_REVIEW',
          'Değerlendirme bonusu'
        )
        results.push(`Awarded ${config.pointsPerReview} points for review`)
        break
    }

    return NextResponse.json({
      success: true,
      event,
      customerId,
      results
    })
  } catch (error) {
    console.error('Loyalty webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
