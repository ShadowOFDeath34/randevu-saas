import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/triggers - List triggers
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    const triggers = await db.campaignTrigger.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { logs: true }
        }
      }
    })

    return NextResponse.json(triggers)
  } catch (error) {
    console.error('Error fetching triggers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/triggers - Create trigger
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const body = await req.json()

    const {
      name,
      description,
      triggerType,
      action,
      templateId,
      conditions,
      delayMinutes = 0
    } = body

    // Validation
    if (!name || !triggerType || !action) {
      return NextResponse.json(
        { error: 'Name, triggerType, and action are required' },
        { status: 400 }
      )
    }

    const trigger = await db.campaignTrigger.create({
      data: {
        tenantId,
        name,
        description,
        triggerType,
        action,
        templateId,
        conditions: conditions ? JSON.stringify(conditions) : null,
        delayMinutes,
        status: 'active'
      }
    })

    return NextResponse.json(trigger, { status: 201 })
  } catch (error) {
    console.error('Error creating trigger:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
