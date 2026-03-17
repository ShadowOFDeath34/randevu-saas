import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hours = await db.businessHour.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return NextResponse.json(hours)
  } catch (error) {
    console.error('Error fetching hours:', error)
    return NextResponse.json({ error: 'Error fetching hours' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    for (const hour of body) {
      await db.businessHour.upsert({
        where: {
          tenantId_dayOfWeek: {
            tenantId: session.user.tenantId,
            dayOfWeek: hour.dayOfWeek
          }
        },
        update: {
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed
        },
        create: {
          tenantId: session.user.tenantId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed
        }
      })
    }

    const hours = await db.businessHour.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { dayOfWeek: 'asc' }
    })

    return NextResponse.json(hours)
  } catch (error) {
    console.error('Error updating hours:', error)
    return NextResponse.json({ error: 'Error updating hours' }, { status: 500 })
  }
}
