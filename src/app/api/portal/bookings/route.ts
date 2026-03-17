import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const customer = await db.customer.findFirst({
      where: { phone }
    })

    if (!customer) {
      return NextResponse.json([])
    }

    const bookings = await db.booking.findMany({
      where: {
        customerId: customer.id,
        deletedAt: null,
      },
      include: {
        service: true,
        staff: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' },
      ],
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Portal bookings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
