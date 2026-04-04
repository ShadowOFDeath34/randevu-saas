import { auth } from '@/lib/auth'
import { findBestStaff } from '@/lib/routing/service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { serviceId, branchId, date, startTime, endTime, customerId } = body

    if (!serviceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const candidates = await findBestStaff(
      session.user.tenantId,
      {
        serviceId,
        branchId,
        date,
        startTime,
        endTime,
        customerId
      }
    )

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Error finding staff:', error)
    return NextResponse.json(
      { error: 'Failed to find staff' },
      { status: 500 }
    )
  }
}
