import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const closedDates = await db.booking.findMany({
      where: { tenantId: session.user.tenantId, status: 'closed' },
      select: { id: true, bookingDate: true, notes: true },
      orderBy: { bookingDate: 'asc' }
    })

    return NextResponse.json(closedDates.map(d => ({
      id: d.id,
      date: d.bookingDate,
      reason: d.notes
    })))
  } catch (error) {
    console.error('Error fetching closed dates:', error)
    return NextResponse.json({ error: 'Error fetching closed dates' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { date, reason } = body

    const closedDate = await db.booking.create({
      data: {
        tenantId: session.user.tenantId,
        customerId: 'system',
        serviceId: 'system',
        staffId: 'system',
        bookingDate: date,
        startTime: '00:00',
        endTime: '23:59',
        status: 'closed',
        notes: reason
      }
    })

    return NextResponse.json(closedDate)
  } catch (error) {
    console.error('Error creating closed date:', error)
    return NextResponse.json({ error: 'Error creating closed date' }, { status: 500 })
  }
}
