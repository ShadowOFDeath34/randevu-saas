import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    webhook: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    webhookDelivery: {
      groupBy: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
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

describe('webhooks/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-05T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns list of webhooks with stats', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockResolvedValueOnce([
        {
          id: 'wh-1',
          name: 'Production Webhook',
          url: 'https://example.com/webhook',
          description: 'Production notifications',
          events: '["BOOKING_CREATED", "BOOKING_CONFIRMED"]',
          secret: 'secret123',
          status: 'ACTIVE',
          maxRetries: 3,
          retryIntervalSec: 60,
          createdAt: new Date('2026-01-01'),
          _count: { deliveries: 10 },
        },
      ])
      mocks.db.webhookDelivery.groupBy.mockResolvedValueOnce([
        { status: 'DELIVERED', _count: { status: 8 } },
        { status: 'FAILED', _count: { status: 2 } },
      ])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.webhooks).toHaveLength(1)
      expect(data.webhooks[0].name).toBe('Production Webhook')
      expect(data.webhooks[0].events).toEqual(['BOOKING_CREATED', 'BOOKING_CONFIRMED'])
      expect(data.webhooks[0].stats).toEqual({
        success: 8,
        failed: 2,
        total: 10,
      })
    })

    it('returns available events list', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockResolvedValueOnce([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.availableEvents).toHaveLength(11)
      expect(data.availableEvents[0]).toHaveProperty('key')
      expect(data.availableEvents[0]).toHaveProperty('label')
      expect(data.availableEvents[0]).toHaveProperty('category')
    })

    it('excludes disabled webhooks', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockResolvedValueOnce([])

      await GET()

      expect(mocks.db.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: 'tenant-1',
            status: { not: 'DISABLED' },
          },
        })
      )
    })

    it('returns empty stats when no deliveries exist', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockResolvedValueOnce([
        {
          id: 'wh-1',
          name: 'New Webhook',
          url: 'https://example.com/new',
          description: null,
          events: '[]',
          secret: 'secret',
          status: 'ACTIVE',
          maxRetries: 3,
          retryIntervalSec: 60,
          createdAt: new Date('2026-04-01'),
          _count: { deliveries: 0 },
        },
      ])
      mocks.db.webhookDelivery.groupBy.mockResolvedValueOnce([])

      const response = await GET()
      const data = await response.json()

      expect(data.webhooks[0].stats).toEqual({
        success: 0,
        failed: 0,
        total: 0,
      })
    })

    it('queries deliveries from last 24 hours', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockResolvedValueOnce([])

      await GET()

      expect(mocks.db.webhook.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: {
                deliveries: {
                  where: {
                    createdAt: {
                      gte: new Date('2026-04-04T12:00:00.000Z'), // 24 hours ago
                    },
                  },
                },
              },
            },
          },
        })
      )
    })

    it('returns 500 when database query fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.findMany.mockRejectedValueOnce(new Error('DB error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test', url: 'https://example.com', events: [] }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 for invalid URL', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Webhook',
            url: 'not-a-valid-url',
            events: ['BOOKING_CREATED'],
          }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Invalid webhook URL' })
    })

    it('creates webhook with generated secret', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.create.mockResolvedValueOnce({
        id: 'wh-1',
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        description: 'Test description',
        events: '["BOOKING_CREATED"]',
        secret: 'random-secret',
        maxRetries: 3,
        retryIntervalSec: 60,
        createdAt: new Date('2026-04-05'),
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      const response = await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Webhook',
            url: 'https://example.com/webhook',
            description: 'Test description',
            events: ['BOOKING_CREATED'],
            maxRetries: 5,
            retryIntervalSec: 120,
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe('Test Webhook')
      expect(data.events).toEqual(['BOOKING_CREATED'])
      expect(data.secret).toBeDefined()
      expect(data.secret).toHaveLength(64) // 32 bytes in hex
    })

    it('uses default retry settings when not specified', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.create.mockResolvedValueOnce({
        id: 'wh-1',
        name: 'Default Webhook',
        url: 'https://example.com',
        description: null,
        events: '[]',
        secret: 'secret',
        maxRetries: 3,
        retryIntervalSec: 60,
        createdAt: new Date(),
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Default Webhook',
            url: 'https://example.com',
            events: [],
          }),
        })
      )

      expect(mocks.db.webhook.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            maxRetries: 3,
            retryIntervalSec: 60,
          }),
        })
      )
    })

    it('logs webhook creation to audit log', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.create.mockResolvedValueOnce({
        id: 'wh-1',
        name: 'Audit Test Webhook',
        url: 'https://example.com',
        events: '["BOOKING_CREATED", "CUSTOMER_CREATED"]',
        secret: 'secret',
        maxRetries: 3,
        retryIntervalSec: 60,
        createdAt: new Date(),
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Audit Test Webhook',
            url: 'https://example.com',
            events: ['BOOKING_CREATED', 'CUSTOMER_CREATED'],
          }),
        })
      )

      expect(mocks.db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            actorUserId: 'user-1',
            action: 'WEBHOOK_CREATED',
            entityType: 'Webhook',
            metadataJson: expect.stringContaining('BOOKING_CREATED'),
          }),
        })
      )
    })

    it('returns 500 when database create fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.webhook.create.mockRejectedValueOnce(new Error('Create failed'))

      const response = await POST(
        new Request('http://localhost/api/settings/webhooks', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test',
            url: 'https://example.com',
            events: [],
          }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
