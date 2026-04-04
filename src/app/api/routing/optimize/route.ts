import { auth } from '@/lib/auth'
import { optimizeDailySchedule } from '@/lib/routing/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner and admin can optimize schedules
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { branchId, date } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const optimization = await optimizeDailySchedule(
      session.user.tenantId,
      branchId,
      date
    )

    return NextResponse.json(optimization)
  } catch (error) {
    console.error('Error optimizing schedule:', error)
    return NextResponse.json(
      { error: 'Failed to optimize schedule' },
      { status: 500 }
    )
  }
}
