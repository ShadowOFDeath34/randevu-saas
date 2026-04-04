import { auth } from '@/lib/auth'
import { getStaffPerformanceSummary, getBonusReport } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const days = parseInt(searchParams.get('days') || '30')

    if (staffId) {
      // Individual staff summary
      const summary = await getStaffPerformanceSummary(
        staffId,
        session.user.tenantId,
        days
      )
      return NextResponse.json(summary)
    }

    // Dashboard stats - all staff summary
    const bonuses = await getBonusReport(session.user.tenantId)

    const stats = {
      totalBonuses: bonuses.length,
      totalPaid: bonuses
        .filter(b => b.status === 'PAID')
        .reduce((sum, b) => sum + Number((b as any).calculatedAmount), 0),
      totalPending: bonuses
        .filter(b => b.status === 'CALCULATED' || b.status === 'PENDING')
        .reduce((sum, b) => sum + Number((b as any).calculatedAmount), 0),
      recentBonuses: bonuses.slice(0, 5)
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching bonus stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonus stats' },
      { status: 500 }
    )
  }
}
