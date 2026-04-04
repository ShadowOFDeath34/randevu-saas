import { auth } from '@/lib/auth'
import { getStaffBonusTargets, upsertBonusTarget } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID required' },
        { status: 400 }
      )
    }

    // Verify staff belongs to tenant
    const targets = await getStaffBonusTargets(staffId)
    return NextResponse.json(targets)
  } catch (error) {
    console.error('Error fetching bonus targets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonus targets' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner and admin can set targets
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.staffId || !body.metricType || body.targetValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const now = new Date()
    const target = await upsertBonusTarget({
      tenantId: session.user.tenantId,
      staffId: body.staffId,
      period: (body.period as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY') || 'MONTHLY',
      year: body.year || now.getFullYear(),
      month: body.month,
      week: body.week,
      quarter: body.quarter,
      targetBookingCount: body.targetBookingCount,
      targetRevenue: body.targetRevenue,
      targetCustomerRating: body.targetCustomerRating,
      targetUpsellRate: body.targetUpsellRate,
      calculationType: body.calculationType,
      baseAmount: body.baseAmount,
      percentageRate: body.percentageRate
    })

    return NextResponse.json(target)
  } catch (error) {
    console.error('Error creating bonus target:', error)
    return NextResponse.json(
      { error: 'Failed to create bonus target' },
      { status: 500 }
    )
  }
}
