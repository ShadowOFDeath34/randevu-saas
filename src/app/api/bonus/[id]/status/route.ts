import { auth } from '@/lib/auth'
import { updateBonusStatus } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner and admin can update bonus status
    if (!['owner', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, notes } = body

    if (!status || !['PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const bonus = await updateBonusStatus(
      id,
      status as 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED',
      notes
    )

    return NextResponse.json(bonus)
  } catch (error) {
    console.error('Error updating bonus status:', error)
    return NextResponse.json(
      { error: 'Failed to update bonus status' },
      { status: 500 }
    )
  }
}
