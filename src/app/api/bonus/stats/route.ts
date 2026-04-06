import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Get bonus statistics
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalStats, paidStats, pendingStats] = await Promise.all([
      db.staffBonus.count({
        where: { tenantId: session.user.tenantId }
      }),
      db.staffBonus.aggregate({
        where: {
          tenantId: session.user.tenantId,
          status: 'PAID'
        },
        _sum: {
          calculatedBonus: true
        }
      }),
      db.staffBonus.aggregate({
        where: {
          tenantId: session.user.tenantId,
          status: { in: ['PENDING', 'CALCULATED', 'APPROVED'] }
        },
        _sum: {
          calculatedBonus: true
        }
      })
    ])

    return NextResponse.json({
      totalBonuses: totalStats,
      totalPaid: paidStats._sum.calculatedBonus || 0,
      totalPending: pendingStats._sum.calculatedBonus || 0
    })
  } catch (error) {
    console.error('Error fetching bonus stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
