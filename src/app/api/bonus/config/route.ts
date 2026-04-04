import { auth } from '@/lib/auth'
import { getPerformanceConfig, upsertPerformanceConfig } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getPerformanceConfig(session.user.tenantId)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching bonus config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonus config' },
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

    // Only owner and admin can update config
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.defaultPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const config = await upsertPerformanceConfig({
      tenantId: session.user.tenantId,
      isEnabled: body.isEnabled ?? true,
      defaultPeriod: body.defaultPeriod as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
      calculationDay: body.calculationDay ?? 1,
      baseBonusPercentage: body.baseBonusPercentage ?? 5,
      minBookingCount: body.minBookingCount ?? 50,
      minCustomerRating: body.minCustomerRating ?? 4.0
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating bonus config:', error)
    return NextResponse.json(
      { error: 'Failed to update bonus config' },
      { status: 500 }
    )
  }
}
