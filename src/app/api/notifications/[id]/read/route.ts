import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Update notification status to delivered (read)
    await db.notificationLog.updateMany({
      where: {
        id,
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
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
