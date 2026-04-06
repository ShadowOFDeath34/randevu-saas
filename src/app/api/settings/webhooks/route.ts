import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const webhookEvents = [
  { key: 'BOOKING_CREATED', label: 'Randevu Oluşturuldu', category: 'Randevular' },
  { key: 'BOOKING_CONFIRMED', label: 'Randevu Onaylandı', category: 'Randevular' },
  { key: 'BOOKING_CANCELLED', label: 'Randevu İptal Edildi', category: 'Randevular' },
  { key: 'BOOKING_COMPLETED', label: 'Randevu Tamamlandı', category: 'Randevular' },
  { key: 'BOOKING_UPDATED', label: 'Randevu Güncellendi', category: 'Randevular' },
  { key: 'BOOKING_NO_SHOW', label: 'Gelmedi (No-Show)', category: 'Randevular' },
  { key: 'CUSTOMER_CREATED', label: 'Müşteri Oluşturuldu', category: 'Müşteriler' },
  { key: 'CUSTOMER_UPDATED', label: 'Müşteri Güncellendi', category: 'Müşteriler' },
  { key: 'PAYMENT_RECEIVED', label: 'Ödeme Alındı', category: 'Ödemeler' },
  { key: 'PAYMENT_FAILED', label: 'Ödeme Başarısız', category: 'Ödemeler' },
  { key: 'PAYMENT_REFUNDED', label: 'İade Yapıldı', category: 'Ödemeler' }
]

// GET - List webhooks
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhooks = await db.webhook.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: { not: 'DISABLED' }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            deliveries: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
              }
            }
          }
        }
      }
    })

    // Get delivery stats for each webhook
    const webhooksWithStats = await Promise.all(
      webhooks.map(async (webhook) => {
        const stats = await db.webhookDelivery.groupBy({
          by: ['status'],
          where: {
            webhookId: webhook.id,
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          },
          _count: {
            status: true
          }
        })

        const successCount = stats.find(s => s.status === 'DELIVERED')?._count.status || 0
        const failedCount = stats.find(s => s.status === 'FAILED')?._count.status || 0

        return {
          ...webhook,
          events: JSON.parse(webhook.events),
          stats: {
            success: successCount,
            failed: failedCount,
            total: successCount + failedCount
          }
        }
      })
    )

    return NextResponse.json({
      webhooks: webhooksWithStats,
      availableEvents: webhookEvents
    })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create webhook
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate URL
    try {
      new URL(data.url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      )
    }

    // Generate webhook secret
    const secret = randomBytes(32).toString('hex')

    const webhook = await db.webhook.create({
      data: {
        tenantId: session.user.tenantId,
        name: data.name,
        url: data.url,
        description: data.description,
        events: JSON.stringify(data.events),
        secret,
        maxRetries: data.maxRetries || 3,
        retryIntervalSec: data.retryIntervalSec || 60,
        createdBy: session.user.id
      }
    })

    // Log creation
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'WEBHOOK_CREATED',
        entityType: 'Webhook',
        entityId: webhook.id,
        metadataJson: JSON.stringify({
          name: data.name,
          events: data.events
        })
      }
    })

    return NextResponse.json({
      ...webhook,
      events: JSON.parse(webhook.events),
      secret // Show secret once
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
