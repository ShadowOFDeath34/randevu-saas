import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/services/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    service: {
      findMany: vi.fn(),
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

describe('services/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns services for the authenticated tenant', async () => {
      const services = [
        {
          id: 'service-1',
          name: 'Haircut',
          durationMinutes: 30,
          price: 250,
          tenantId: 'tenant-1',
        },
      ]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findMany.mockResolvedValueOnce(services)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(services)
      expect(mocks.db.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { name: 'asc' },
      })
    })

    it('returns 500 when the database call fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findMany.mockRejectedValueOnce(new Error('db failed'))

      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error fetching services' })
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/services', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns 400 when zod validation fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/services', {
          method: 'POST',
          body: JSON.stringify({
            name: '',
            durationMinutes: 1,
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.service.create).not.toHaveBeenCalled()
    })

    it('creates a service with schema defaults', async () => {
      const createdService = {
        id: 'service-2',
        name: 'Beard Trim',
        durationMinutes: 20,
        price: 150,
        currency: 'TRY',
        isActive: true,
        tenantId: 'tenant-1',
      }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.create.mockResolvedValueOnce(createdService)

      const response = await POST(
        new Request('http://localhost/api/services', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Beard Trim',
            durationMinutes: 20,
            price: 150,
          }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(createdService)
      expect(mocks.db.service.create).toHaveBeenCalledWith({
        data: {
          name: 'Beard Trim',
          durationMinutes: 20,
          price: 150,
          currency: 'TRY',
          isActive: true,
          tenantId: 'tenant-1',
        },
      })
    })

    it('returns 500 when create fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.create.mockRejectedValueOnce(new Error('create failed'))

      const response = await POST(
        new Request('http://localhost/api/services', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Consultation',
            durationMinutes: 30,
          }),
        })
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error creating service' })
    })
  })
})
