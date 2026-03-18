import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tenantId = searchParams.get('tenantId')

    const skip = (page - 1) * limit

    const where: Prisma.BookingWhereInput = {
      deletedAt: { not: null }
    }

    if (tenantId) {
      where.tenantId = tenantId
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          tenant: { select: { name: true, slug: true } },
          customer: true,
          service: true,
          staff: true
        },
        orderBy: { deletedAt: 'desc' },
        skip,
        take: limit
      }),
      db.booking.count({ where })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching deleted bookings:', error)
    return NextResponse.json(
      { error: 'Error fetching deleted bookings' },
      { status: 500 }
    )
  }
}
