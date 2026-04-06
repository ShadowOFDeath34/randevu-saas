import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Get bonus report
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      tenantId: session.user.tenantId
    }

    if (period) {
      where.period = period
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (status) {
      where.status = status
    }

    const bonuses = await db.staffBonus.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    // Format response
    const formattedBonuses = bonuses.map(bonus => ({
      id: bonus.id,
      staffId: bonus.staffId,
      staffName: bonus.staff.fullName,
      period: bonus.period,
      year: bonus.year,
      month: bonus.month,
      week: bonus.week,
      calculatedBonus: bonus.calculatedBonus,
      status: bonus.status,
      calculatedAt: bonus.createdAt.toISOString(),
      approvedAt: bonus.approvedAt?.toISOString() || null,
      paidAt: bonus.paidAt?.toISOString() || null,
      createdAt: bonus.createdAt.toISOString()
    }))

    return NextResponse.json(formattedBonuses)
  } catch (error) {
    console.error('Error fetching bonus report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
