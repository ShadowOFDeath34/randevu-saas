import { auth } from '@/lib/auth'
import { findOptimalTimeSlots } from '@/lib/routing/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const branchId = searchParams.get('branchId')
    const date = searchParams.get('date')

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const slots = await findOptimalTimeSlots(
      session.user.tenantId,
      serviceId,
      branchId || '',
      date
    )

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Error finding slots:', error)
    return NextResponse.json(
      { error: 'Failed to find slots' },
      { status: 500 }
    )
  }
}
