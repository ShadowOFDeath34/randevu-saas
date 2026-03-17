import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update all pending/sent notifications to delivered
    await db.notificationLog.updateMany({
      where: {
        status: { in: ['pending', 'sent'] },
        booking: {
          tenantId: session.user.tenantId
        }
      },
      data: {
        status: 'delivered'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
