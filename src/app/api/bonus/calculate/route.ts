import { auth } from '@/lib/auth'
import { calculateBonus, calculateAllStaffBonuses } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner and admin can calculate bonuses
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { staffId, period, referenceDate, calculateAll } = body

    if (calculateAll) {
      // Calculate for all staff
      const results = await calculateAllStaffBonuses(
        session.user.tenantId,
        period as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
        referenceDate ? new Date(referenceDate) : new Date()
      )
      return NextResponse.json({ success: true, results })
    }

    if (!staffId || !period) {
      return NextResponse.json(
        { error: 'Missing required fields: staffId, period' },
        { status: 400 }
      )
    }

    const result = await calculateBonus(
      staffId,
      session.user.tenantId,
      period as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
      referenceDate ? new Date(referenceDate) : new Date()
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error calculating bonus:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate bonus' },
      { status: 500 }
    )
  }
}
