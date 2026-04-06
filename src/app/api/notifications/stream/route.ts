import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

// In-memory store for active connections
const clients = new Map<string, ReadableStreamDefaultController>()

// Helper to send message to a specific client
export function sendToClient(userId: string, data: unknown) {
  const controller = clients.get(userId)
  if (controller) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    try {
      controller.enqueue(new TextEncoder().encode(message))
    } catch {
      // Client disconnected
      clients.delete(userId)
    }
  }
}

// Broadcast to all clients (or filter by tenant)
export function broadcastNotification(tenantId: string, notification: unknown) {
  // Get all users for this tenant
  db.user.findMany({
    where: { tenantId },
    select: { id: true }
  }).then(users => {
    users.forEach(user => {
      sendToClient(user.id, { type: 'new', notification })
    })
  })
}

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = session.user.id

  const stream = new ReadableStream({
    start(controller) {
      // Store client connection
      clients.set(userId, controller)

      // Send initial notifications
      db.notificationLog.findMany({
        where: {
          booking: {
            tenantId: session.user.tenantId
          }
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
        include: {
          booking: {
            select: {
              customer: {
                select: { fullName: true }
              }
            }
          }
        }
      }).then(logs => {
        const notifications = logs.map(log => ({
          id: log.id,
          title: getNotificationTitle(log.channel),
          message: log.payload || '',
          type: log.status === 'failed' ? 'error' : 'info' as const,
          read: log.status === 'delivered',
          createdAt: log.sentAt.toISOString(),
        }))

        const message = `data: ${JSON.stringify({ type: 'initial', notifications })}\n\n`
        controller.enqueue(new TextEncoder().encode(message))
      })

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(':heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
          clients.delete(userId)
        }
      }, 30000)

      // Close connection gracefully before Vercel's 300s timeout (290s = ~4.8 minutes)
      // Client will auto-reconnect
      const connectionTimeout = setTimeout(() => {
        try {
          controller.enqueue(new TextEncoder().encode('event: close\ndata: Connection timeout, please reconnect\n\n'))
          controller.close()
        } catch {
          // Connection already closed
        }
        clearInterval(heartbeat)
        clearTimeout(connectionTimeout)
        clients.delete(userId)
      }, 290000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clearTimeout(connectionTimeout)
        clients.delete(userId)
      })
    },
    cancel() {
      clients.delete(userId)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function getNotificationTitle(channel: string): string {
  switch (channel) {
    case 'email':
      return 'E-posta Bildirimi'
    case 'sms':
      return 'SMS Bildirimi'
    case 'whatsapp':
      return 'WhatsApp Bildirimi'
    case 'push':
      return 'Push Bildirim'
    default:
      return 'Sistem Bildirimi'
  }
}
