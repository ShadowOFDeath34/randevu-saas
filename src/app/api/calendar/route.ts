import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const staffId = searchParams.get('staffId')

    if (!start || !end) {
      return NextResponse.json({ error: 'Tarih aralığı gereklidir' }, { status: 400 })
    }

    const where: Prisma.BookingWhereInput = {
      tenantId: session.user.tenantId,
      bookingDate: {
        gte: start,
        lte: end
      }
    }

    if (staffId) {
      where.staffId = staffId
    }

    const bookings = await db.booking.findMany({
      where,
      include: {
        service: true,
        customer: true,
        staff: true
      },
      orderBy: [{ bookingDate: 'asc' }, { startTime: 'asc' }]
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching calendar:', error)
    return NextResponse.json({ error: 'Error fetching calendar' }, { status: 500 })
  }
}
