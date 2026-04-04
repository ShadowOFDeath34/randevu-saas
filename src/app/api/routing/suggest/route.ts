import { auth } from '@/lib/auth'
import { suggestAlternativeSlots } from '@/lib/routing/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, branchId, date, startTime, endTime, customerId, daysToCheck } = body

    if (!serviceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const suggestions = await suggestAlternativeSlots(
      session.user.tenantId,
      {
        serviceId,
        branchId,
        date,
        startTime,
        endTime,
        customerId
      },
      daysToCheck || 7
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error suggesting slots:', error)
    return NextResponse.json(
      { error: 'Failed to suggest slots' },
      { status: 500 }
    )
  }
}
