import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
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

describe('audit-logs/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs')
      )

      expect(response.status).toBe(401)
    })

    it('returns paginated audit logs', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([
          {
            id: 'log-1',
            tenantId: 'tenant-1',
            actorUserId: 'user-1',
            action: 'API_KEY_CREATED',
            entityType: 'ApiKey',
            entityId: 'key-1',
            metadataJson: '{"name": "Production Key"}',
            createdAt: new Date('2026-04-05T10:00:00Z'),
            user: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
          {
            id: 'log-2',
            tenantId: 'tenant-1',
            actorUserId: 'user-2',
            action: 'WEBHOOK_DELETED',
            entityType: 'Webhook',
            entityId: 'wh-1',
            metadataJson: null,
            createdAt: new Date('2026-04-05T09:00:00Z'),
            user: {
              id: 'user-2',
              name: 'Jane Doe',
              email: 'jane@example.com',
            },
          },
        ])
        .mockResolvedValueOnce([
          { action: 'API_KEY_CREATED' },
          { action: 'WEBHOOK_DELETED' },
          { action: 'BOOKING_UPDATED' },
        ])
        .mockResolvedValueOnce([
          { entityType: 'ApiKey' },
          { entityType: 'Webhook' },
          { entityType: 'Booking' },
        ])
      mocks.db.auditLog.count.mockResolvedValueOnce(25)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs?page=1&limit=10')
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.logs).toHaveLength(2)
      expect(data.logs[0].action).toBe('API_KEY_CREATED')
      expect(data.logs[0].metadata).toEqual({ name: 'Production Key' })
      expect(data.logs[1].metadata).toBeNull()
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      })
    })

    it('uses default pagination when not specified', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(new Request('http://localhost/api/settings/audit-logs'))

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      )
    })

    it('filters by action type', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request('http://localhost/api/settings/audit-logs?action=API_KEY_CREATED')
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            action: 'API_KEY_CREATED',
          }),
        })
      )
    })

    it('filters by entity type', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request('http://localhost/api/settings/audit-logs?entityType=Webhook')
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            entityType: 'Webhook',
          }),
        })
      )
    })

    it('filters by user ID', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request('http://localhost/api/settings/audit-logs?userId=user-123')
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            actorUserId: 'user-123',
          }),
        })
      )
    })

    it('filters by date range', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request(
          'http://localhost/api/settings/audit-logs?startDate=2026-04-01&endDate=2026-04-05'
        )
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            createdAt: {
              gte: new Date('2026-04-01'),
              lte: new Date('2026-04-05'),
            },
          }),
        })
      )
    })

    it('filters by start date only', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request('http://localhost/api/settings/audit-logs?startDate=2026-04-01')
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date('2026-04-01'),
            }),
          }),
        })
      )
    })

    it('filters by end date only', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      await GET(
        new Request('http://localhost/api/settings/audit-logs?endDate=2026-04-05')
      )

      expect(mocks.db.auditLog.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: new Date('2026-04-05'),
            }),
          }),
        })
      )
    })

    it('returns available filter options', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { action: 'API_KEY_CREATED' },
          { action: 'API_KEY_REVOKED' },
        ])
        .mockResolvedValueOnce([
          { entityType: 'ApiKey' },
          { entityType: 'Webhook' },
        ])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs')
      )
      const data = await response.json()

      expect(data.filters.actions).toEqual(['API_KEY_CREATED', 'API_KEY_REVOKED'])
      expect(data.filters.entityTypes).toEqual(['ApiKey', 'Webhook'])
    })

    it('filters out null values from filter options', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { action: 'API_KEY_CREATED' },
          { action: null },
        ])
        .mockResolvedValueOnce([
          { entityType: 'ApiKey' },
          { entityType: null },
        ])
      mocks.db.auditLog.count.mockResolvedValueOnce(0)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs')
      )
      const data = await response.json()

      expect(data.filters.actions).toEqual(['API_KEY_CREATED'])
      expect(data.filters.entityTypes).toEqual(['ApiKey'])
    })

    it('includes user information in logs', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([
          {
            id: 'log-1',
            tenantId: 'tenant-1',
            actorUserId: 'user-1',
            action: 'BOOKING_CREATED',
            entityType: 'Booking',
            entityId: 'booking-1',
            metadataJson: null,
            createdAt: new Date(),
            user: {
              id: 'user-1',
              name: 'Test User',
              email: 'test@example.com',
            },
          },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(1)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs')
      )
      const data = await response.json()

      expect(data.logs[0].user).toEqual({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      })
    })

    it('returns 500 when database query fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany.mockRejectedValueOnce(new Error('DB error'))

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs')
      )

      expect(response.status).toBe(500)
    })

    it('calculates correct total pages', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.auditLog.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
      mocks.db.auditLog.count.mockResolvedValueOnce(100)

      const response = await GET(
        new Request('http://localhost/api/settings/audit-logs?page=2&limit=25')
      )
      const data = await response.json()

      expect(data.pagination).toEqual({
        page: 2,
        limit: 25,
        total: 100,
        totalPages: 4,
      })
    })
  })
})
