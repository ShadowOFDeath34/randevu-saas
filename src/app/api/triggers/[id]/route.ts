import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/triggers/[id] - Get single trigger
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const { id } = await params

    const trigger = await db.campaignTrigger.findFirst({
      where: { id, tenantId },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 50,
          select: {
            id: true,
            status: true,
            payload: true,
            errorMessage: true,
            executedAt: true,
            customerId: true,
            bookingId: true
          }
        }
      }
    })

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    return NextResponse.json(trigger)
  } catch (error) {
    console.error('Error fetching trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/triggers/[id] - Update trigger
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const { id } = await params
    const body = await req.json()

    const existing = await db.campaignTrigger.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    const {
      name,
      description,
      triggerType,
      action,
      templateId,
      conditions,
      delayMinutes,
      status
    } = body

    const trigger = await db.campaignTrigger.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(triggerType && { triggerType }),
        ...(action && { action }),
        ...(templateId !== undefined && { templateId }),
        ...(conditions && { conditions: JSON.stringify(conditions) }),
        ...(delayMinutes !== undefined && { delayMinutes }),
        ...(status && { status }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(trigger)
  } catch (error) {
    console.error('Error updating trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/triggers/[id] - Delete trigger
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const { id } = await params

    const existing = await db.campaignTrigger.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    await db.campaignTrigger.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/triggers/[id]/execute - Manually execute trigger
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const { id } = await params

    const trigger = await db.campaignTrigger.findFirst({
      where: { id, tenantId }
    })

    if (!trigger) {
      return NextResponse.json({ error: 'Trigger not found' }, { status: 404 })
    }

    // Import and execute trigger service
    const { executeTrigger } = await import('@/lib/triggers/executor')
    const result = await executeTrigger(trigger, { manual: true })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
