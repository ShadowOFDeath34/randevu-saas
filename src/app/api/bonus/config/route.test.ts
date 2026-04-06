import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    bonusConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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

describe('bonus/config/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns bonus config when exists', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.findUnique.mockResolvedValueOnce({
        id: 'config-1',
        tenantId: 'tenant-1',
        isEnabled: true,
        defaultPeriod: 'MONTHLY',
        calculationDay: 1,
        baseBonusPercentage: 5,
        minBookingCount: 50,
        minCustomerRating: 4.0,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: 'config-1',
        isEnabled: true,
        defaultPeriod: 'MONTHLY',
        calculationDay: 1,
        baseBonusPercentage: 5,
        minBookingCount: 50,
        minCustomerRating: 4.0,
      })
    })

    it('returns null when config does not exist', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.findUnique.mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeNull()
    })

    it('returns 500 when database query fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.findUnique.mockRejectedValueOnce(new Error('DB error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ isEnabled: true }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('creates new bonus config with defaults', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.upsert.mockResolvedValueOnce({
        id: 'config-1',
        tenantId: 'tenant-1',
        isEnabled: true,
        defaultPeriod: 'MONTHLY',
        calculationDay: 1,
        baseBonusPercentage: 5,
        minBookingCount: 50,
        minCustomerRating: 4.0,
      })

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isEnabled).toBe(true)
      expect(data.defaultPeriod).toBe('MONTHLY')
      expect(data.calculationDay).toBe(1)
      expect(data.baseBonusPercentage).toBe(5)
      expect(data.minBookingCount).toBe(50)
      expect(data.minCustomerRating).toBe(4.0)
    })

    it('updates existing bonus config', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.upsert.mockResolvedValueOnce({
        id: 'config-1',
        tenantId: 'tenant-1',
        isEnabled: true,
        defaultPeriod: 'WEEKLY',
        calculationDay: 5,
        baseBonusPercentage: 10,
        minBookingCount: 30,
        minCustomerRating: 4.5,
      })

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({
            isEnabled: true,
            defaultPeriod: 'WEEKLY',
            calculationDay: 5,
            baseBonusPercentage: 10,
            minBookingCount: 30,
            minCustomerRating: 4.5,
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.defaultPeriod).toBe('WEEKLY')
      expect(data.calculationDay).toBe(5)
      expect(data.baseBonusPercentage).toBe(10)
    })

    it('accepts QUARTERLY period option', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.upsert.mockResolvedValueOnce({
        id: 'config-1',
        isEnabled: true,
        defaultPeriod: 'QUARTERLY',
        calculationDay: 15,
        baseBonusPercentage: 5,
        minBookingCount: 50,
        minCustomerRating: 4.0,
      })

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ defaultPeriod: 'QUARTERLY' }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.defaultPeriod).toBe('QUARTERLY')
    })

    it('validates calculationDay range', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ calculationDay: 32 }),
        })
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('validates baseBonusPercentage range', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ baseBonusPercentage: 150 }),
        })
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('validates minCustomerRating range', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ minCustomerRating: 6 }),
        })
      )

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('returns 500 when upsert fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.bonusConfig.upsert.mockRejectedValueOnce(new Error('Upsert failed'))

      const response = await POST(
        new Request('http://localhost/api/bonus/config', {
          method: 'POST',
          body: JSON.stringify({ isEnabled: true }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
