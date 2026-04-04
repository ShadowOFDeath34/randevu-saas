import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { calculateDynamicPrice, getAIRecommendedPrice } from '@/lib/pricing/service'

// POST - Dinamik fiyat hesapla
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { serviceId, staffId, bookingDate, startTime, customerId } = body

    if (!serviceId || !bookingDate || !startTime) {
      return NextResponse.json(
        { error: 'serviceId, bookingDate ve startTime gereklidir' },
        { status: 400 }
      )
    }

    // Dinamik fiyat hesapla
    const calculatedPrice = await calculateDynamicPrice({
      serviceId,
      staffId,
      bookingDate,
      startTime,
      customerId,
      tenantId: session.user.tenantId
    })

    // AI önerisi al
    let aiRecommendation = null
    try {
      aiRecommendation = await getAIRecommendedPrice(
        session.user.tenantId,
        serviceId,
        bookingDate,
        startTime
      )
    } catch (err) {
      console.error('AI recommendation error:', err)
    }

    return NextResponse.json({
      ...calculatedPrice,
      aiRecommendation
    })
  } catch (error) {
    console.error('Error calculating price:', error)
    return NextResponse.json({ error: 'Error calculating price' }, { status: 500 })
  }
}
