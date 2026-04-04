import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/triggers/webhook - Webhook for booking events
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { event, tenantId, data } = body

    if (!event || !tenantId) {
      return NextResponse.json({ error: 'Missing event or tenantId' }, { status: 400 })
    }

    // Map events to trigger types
    const eventToTrigger: Record<string, string> = {
      'booking.created': 'booking_confirmed',
      'booking.cancelled': 'booking_cancelled',
      'booking.no_show': 'booking_no_show',
      'booking.completed': 'booking_completed'
    }

    const triggerType = eventToTrigger[event]
    if (!triggerType) {
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    // Find active triggers for this event
    const triggers = await db.campaignTrigger.findMany({
      where: {
        tenantId,
        triggerType,
        status: 'active'
      }
    })

    const results = []
    for (const trigger of triggers) {
      // Execute with delay if specified
      if (trigger.delayMinutes > 0) {
        // Schedule for later
        setTimeout(async () => {
          const { executeTrigger } = await import('@/lib/triggers/executor')
          await executeTrigger(trigger, {
            bookingId: data?.bookingId,
            customerId: data?.customerId
          })
        }, trigger.delayMinutes * 60 * 1000)

        results.push({
          triggerId: trigger.id,
          status: 'scheduled',
          executeAt: new Date(Date.now() + trigger.delayMinutes * 60 * 1000)
        })
      } else {
        // Execute immediately
        const { executeTrigger } = await import('@/lib/triggers/executor')
        const result = await executeTrigger(trigger, {
          bookingId: data?.bookingId,
          customerId: data?.customerId
        })
        results.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      triggered: triggers.length,
      results
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
