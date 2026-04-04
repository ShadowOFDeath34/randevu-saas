import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE as deleteNotification } from '@/app/api/notifications/[id]/route'
import { POST as markNotificationRead } from '@/app/api/notifications/[id]/read/route'
import { POST as markAllNotificationsRead } from '@/app/api/notifications/read-all/route'
import {
  GET as streamNotifications,
  broadcastNotification,
  sendToClient,
} from '@/app/api/notifications/stream/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    notificationLog: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/db', () => ({
  db: mocks.db,
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

const params = Promise.resolve({ id: 'notification-1' })

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const result = await reader.read()
  return new TextDecoder().decode(result.value)
}

describe('notifications action routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('notifications/[id]/route.ts DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await deleteNotification(
        new Request('http://localhost/api/notifications/notification-1', {
          method: 'DELETE',
        }) as never,
        { params }
      )

      expect(response.status).toBe(401)
    })

    it('marks a notification as failed for soft delete', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockResolvedValueOnce({ count: 1 })

      const response = await deleteNotification(
        new Request('http://localhost/api/notifications/notification-1', {
          method: 'DELETE',
        }) as never,
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.notificationLog.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          booking: {
            tenantId: 'tenant-1',
          },
        },
        data: {
          status: 'failed',
        },
      })
    })

    it('returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockRejectedValueOnce(new Error('delete failed'))

      const response = await deleteNotification(
        new Request('http://localhost/api/notifications/notification-1', {
          method: 'DELETE',
        }) as never,
        { params }
      )

      expect(response.status).toBe(500)
    })
  })

  describe('notifications/[id]/read/route.ts POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await markNotificationRead(
        new Request('http://localhost/api/notifications/notification-1/read', {
          method: 'POST',
        }) as never,
        { params }
      )

      expect(response.status).toBe(401)
    })

    it('marks a notification as delivered', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockResolvedValueOnce({ count: 1 })

      const response = await markNotificationRead(
        new Request('http://localhost/api/notifications/notification-1/read', {
          method: 'POST',
        }) as never,
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.notificationLog.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          booking: {
            tenantId: 'tenant-1',
          },
        },
        data: {
          status: 'delivered',
        },
      })
    })

    it('returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockRejectedValueOnce(new Error('read failed'))

      const response = await markNotificationRead(
        new Request('http://localhost/api/notifications/notification-1/read', {
          method: 'POST',
        }) as never,
        { params }
      )

      expect(response.status).toBe(500)
    })
  })

  describe('notifications/read-all/route.ts POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await markAllNotificationsRead()

      expect(response.status).toBe(401)
    })

    it('marks pending and sent notifications as delivered', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockResolvedValueOnce({ count: 4 })

      const response = await markAllNotificationsRead()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.notificationLog.updateMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['pending', 'sent'] },
          booking: {
            tenantId: 'tenant-1',
          },
        },
        data: {
          status: 'delivered',
        },
      })
    })

    it('returns 500 on failure', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.notificationLog.updateMany.mockRejectedValueOnce(new Error('bulk failed'))

      const response = await markAllNotificationsRead()

      expect(response.status).toBe(500)
    })
  })
})

describe('notifications/stream/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 401 when unauthenticated', async () => {
    mocks.auth.mockResolvedValueOnce(null)

    const response = await streamNotifications(
      new Request('http://localhost/api/notifications/stream') as never
    )

    expect(response.status).toBe(401)
    expect(await response.text()).toBe('Unauthorized')
  })

  it('streams initial notifications with mapped titles', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.notificationLog.findMany.mockResolvedValueOnce([
      {
        id: 'log-1',
        channel: 'email',
        status: 'delivered',
        payload: 'Email payload',
        sentAt: new Date('2026-04-04T10:00:00.000Z'),
      },
      {
        id: 'log-2',
        channel: 'sms',
        status: 'pending',
        payload: 'SMS payload',
        sentAt: new Date('2026-04-04T11:00:00.000Z'),
      },
      {
        id: 'log-3',
        channel: 'whatsapp',
        status: 'failed',
        payload: 'WA payload',
        sentAt: new Date('2026-04-04T12:00:00.000Z'),
      },
      {
        id: 'log-4',
        channel: 'push',
        status: 'sent',
        payload: 'Push payload',
        sentAt: new Date('2026-04-04T13:00:00.000Z'),
      },
      {
        id: 'log-5',
        channel: 'other',
        status: 'sent',
        payload: 'Other payload',
        sentAt: new Date('2026-04-04T14:00:00.000Z'),
      },
    ])

    const response = await streamNotifications(
      new Request('http://localhost/api/notifications/stream') as never
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')

    const reader = response.body!.getReader()
    const chunk = await readChunk(reader)
    const payload = JSON.parse(chunk.replace(/^data:\s*/, '').trim())

    expect(payload.type).toBe('initial')
    expect(payload.notifications).toEqual([
      expect.objectContaining({
        id: 'log-1',
        title: 'E-posta Bildirimi',
        read: true,
        type: 'info',
      }),
      expect.objectContaining({
        id: 'log-2',
        title: 'SMS Bildirimi',
        read: false,
        type: 'info',
      }),
      expect.objectContaining({
        id: 'log-3',
        title: 'WhatsApp Bildirimi',
        type: 'error',
      }),
      expect.objectContaining({
        id: 'log-4',
        title: 'Push Bildirim',
      }),
      expect.objectContaining({
        id: 'log-5',
        title: 'Sistem Bildirimi',
      }),
    ])

    await reader.cancel()
  })

  it('pushes targeted notifications and heartbeat messages', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.notificationLog.findMany.mockResolvedValueOnce([])

    const response = await streamNotifications(
      new Request('http://localhost/api/notifications/stream') as never
    )

    const reader = response.body!.getReader()
    await readChunk(reader)

    sendToClient('user-1', { type: 'custom', id: 'n-1' })
    const pushChunk = await readChunk(reader)
    expect(pushChunk).toContain('"type":"custom"')
    expect(pushChunk).toContain('"id":"n-1"')

    const heartbeatPromise = reader.read()
    await vi.advanceTimersByTimeAsync(30000)
    const heartbeat = new TextDecoder().decode((await heartbeatPromise).value)

    expect(heartbeat).toBe(':heartbeat\n\n')

    await reader.cancel()
  })

  it('broadcasts notifications to all tenant users', async () => {
    mocks.auth.mockResolvedValueOnce(session)
    mocks.db.notificationLog.findMany.mockResolvedValueOnce([])
    mocks.db.user.findMany.mockResolvedValueOnce([{ id: 'user-1' }])

    const response = await streamNotifications(
      new Request('http://localhost/api/notifications/stream') as never
    )

    const reader = response.body!.getReader()
    await readChunk(reader)

    broadcastNotification('tenant-1', { id: 'n-2' })
    const broadcastChunk = await readChunk(reader)

    expect(mocks.db.user.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      select: { id: true },
    })
    expect(broadcastChunk).toContain('"type":"new"')
    expect(broadcastChunk).toContain('"id":"n-2"')

    await reader.cancel()
  })
})
