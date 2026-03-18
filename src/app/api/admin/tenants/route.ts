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
    const filter = searchParams.get('filter') || 'all'

    const where: Prisma.TenantWhereInput = {}

    if (filter !== 'all') {
      where.status = filter
    }

    const tenants = await db.tenant.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            bookings: true,
            customers: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json({ error: 'Error fetching tenants' }, { status: 500 })
  }
}
