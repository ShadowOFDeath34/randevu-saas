import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    apiKey: {
      findMany: vi.fn(),
      create: vi.fn(),
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

describe('api-keys/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns list of API keys for tenant', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.findMany.mockResolvedValueOnce([
        {
          id: 'key-1',
          name: 'Production Key',
          description: 'For production use',
          keyPrefix: 'ak_live_abc',
          status: 'ACTIVE',
          expiresAt: null,
          lastUsedAt: new Date('2026-04-01'),
          rateLimitPerDay: 10000,
          usageCountTotal: 150,
          permissions: '[]',
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'key-2',
          name: 'Test Key',
          description: null,
          keyPrefix: 'ak_live_def',
          status: 'EXPIRED',
          expiresAt: new Date('2026-03-01'),
          lastUsedAt: null,
          rateLimitPerDay: 1000,
          usageCountTotal: 0,
          permissions: '["read"]',
          createdAt: new Date('2026-02-01'),
        },
      ])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.keys).toHaveLength(2)
      expect(data.keys[0].name).toBe('Production Key')
      expect(data.keys[1].status).toBe('EXPIRED')
      expect(mocks.db.apiKey.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          status: { not: 'REVOKED' },
        },
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      })
    })

    it('returns empty array when no API keys exist', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.findMany.mockResolvedValueOnce([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.keys).toEqual([])
    })

    it('returns 500 when database query fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.findMany.mockRejectedValueOnce(new Error('DB error'))

      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Internal server error' })
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test Key' }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('creates new API key with generated hash', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockResolvedValueOnce({
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'ak_live_',
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      const response = await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Key',
            description: 'Test description',
            permissions: ['read', 'write'],
            rateLimitPerMinute: 60,
            rateLimitPerHour: 1000,
            rateLimitPerDay: 10000,
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.apiKey.name).toBe('Test Key')
      expect(data.apiKey.key).toMatch(/^ak_live_[a-f0-9]{64}$/)
      expect(data.apiKey.key).toHaveLength(72) // 'ak_live_' (8) + 64 hex chars = 72
    })

    it('creates API key with expiration date', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockResolvedValueOnce({
        id: 'key-1',
        name: 'Expiring Key',
        keyPrefix: 'ak_live_',
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      const expiresAt = '2026-12-31'

      const response = await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Expiring Key',
            expiresAt,
          }),
        })
      )

      expect(response.status).toBe(201)
      expect(mocks.db.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: new Date(expiresAt),
          }),
        })
      )
    })

    it('creates API key with allowed IPs', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockResolvedValueOnce({
        id: 'key-1',
        name: 'IP Restricted Key',
        keyPrefix: 'ak_live_',
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      const response = await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({
            name: 'IP Restricted Key',
            allowedIps: ['192.168.1.1', '10.0.0.0/8'],
          }),
        })
      )

      expect(response.status).toBe(201)
      expect(mocks.db.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            allowedIps: JSON.stringify(['192.168.1.1', '10.0.0.0/8']),
          }),
        })
      )
    })

    it('uses default rate limits when not specified', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockResolvedValueOnce({
        id: 'key-1',
        name: 'Default Limits Key',
        keyPrefix: 'ak_live_',
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({ name: 'Default Limits Key' }),
        })
      )

      expect(mocks.db.apiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            rateLimitPerMinute: 60,
            rateLimitPerHour: 1000,
            rateLimitPerDay: 10000,
          }),
        })
      )
    })

    it('logs API key creation to audit log', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockResolvedValueOnce({
        id: 'key-1',
        name: 'Audit Test Key',
        keyPrefix: 'ak_live_',
      })
      mocks.db.auditLog.create.mockResolvedValueOnce({})

      await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Audit Test Key',
            permissions: ['read'],
          }),
        })
      )

      expect(mocks.db.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            actorUserId: 'user-1',
            action: 'API_KEY_CREATED',
            entityType: 'ApiKey',
            metadataJson: expect.stringContaining('Audit Test Key'),
          }),
        })
      )
    })

    it('returns 500 when database create fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.apiKey.create.mockRejectedValueOnce(new Error('Create failed'))

      const response = await POST(
        new Request('http://localhost/api/settings/api-keys', {
          method: 'POST',
          body: JSON.stringify({ name: 'Test Key' }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
