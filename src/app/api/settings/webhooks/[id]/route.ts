import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET - Get webhook with delivery history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const webhook = await db.webhook.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      },
      include: {
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...webhook,
      events: JSON.parse(webhook.events),
      deliveries: webhook.deliveries.map(d => ({
        ...d,
        payload: undefined // Don't send payload in list view
      }))
    })
  } catch (error) {
    console.error('Error fetching webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update webhook
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const existing = await db.webhook.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const updateData: any = { ...data }
    if (data.events) {
      updateData.events = JSON.stringify(data.events)
    }

    const webhook = await db.webhook.update({
      where: { id },
      data: updateData
    })

    // Log update
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'WEBHOOK_UPDATED',
        entityType: 'Webhook',
        entityId: id,
        metadataJson: JSON.stringify({
          updatedFields: Object.keys(data)
        })
      }
    })

    return NextResponse.json({
      ...webhook,
      events: JSON.parse(webhook.events)
    })
  } catch (error) {
    console.error('Error updating webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete webhook
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.webhook.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await db.webhook.update({
      where: { id },
      data: { status: 'DISABLED' }
    })

    // Log deletion
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'WEBHOOK_DELETED',
        entityType: 'Webhook',
        entityId: id,
        metadataJson: JSON.stringify({
          name: existing.name
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
