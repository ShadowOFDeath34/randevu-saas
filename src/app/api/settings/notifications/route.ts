import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = await db.notificationTemplate.findFirst({
      where: { tenantId: session.user.tenantId, type: 'settings' }
    })

    if (!template) {
      return NextResponse.json({
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: false,
        reminderHours: [24, 2],
        bookingConfirmation: true,
        bookingReminder: true,
        bookingCancellation: true,
        reviewRequest: true
      })
    }

    return NextResponse.json(JSON.parse(template.body))
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    await db.notificationTemplate.upsert({
      where: {
        tenantId_type_channel: {
          tenantId: session.user.tenantId,
          type: 'settings',
          channel: 'system'
        }
      },
      update: {
        body: JSON.stringify(body),
        isActive: true
      },
      create: {
        tenantId: session.user.tenantId,
        type: 'settings',
        channel: 'system',
        title: 'Notification Settings',
        body: JSON.stringify(body),
        isActive: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving notification settings:', error)
    return NextResponse.json({ error: 'Error saving settings' }, { status: 500 })
  }
}
