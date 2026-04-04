import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, PUT } from '@/app/api/services/[id]/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    service: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    booking: {
      findFirst: vi.fn(),
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

const params = Promise.resolve({ id: 'service-1' })

describe('services/[id]/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/services/service-1', {
          method: 'PUT',
          body: JSON.stringify({}),
        }),
        { params }
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 when zod validation fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await PUT(
        new Request('http://localhost/api/services/service-1', {
          method: 'PUT',
          body: JSON.stringify({
            name: '',
            durationMinutes: 2,
          }),
        }),
        { params }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.service.findFirst).not.toHaveBeenCalled()
    })

    it('returns 404 when the service is missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/services/service-1', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Color',
            durationMinutes: 45,
          }),
        }),
        { params }
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Service not found' })
    })

    it('updates the service when it exists', async () => {
      const updatedService = {
        id: 'service-1',
        name: 'Color',
        durationMinutes: 45,
        price: 500,
      }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce({ id: 'service-1' })
      mocks.db.service.update.mockResolvedValueOnce(updatedService)

      const response = await PUT(
        new Request('http://localhost/api/services/service-1', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Color',
            durationMinutes: 45,
            price: 500,
          }),
        }),
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(updatedService)
      expect(mocks.db.service.update).toHaveBeenCalledWith({
        where: { id: 'service-1' },
        data: {
          name: 'Color',
          durationMinutes: 45,
          price: 500,
          currency: 'TRY',
          isActive: true,
        },
      })
    })

    it('returns 500 when update fails unexpectedly', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce({ id: 'service-1' })
      mocks.db.service.update.mockRejectedValueOnce(new Error('update failed'))

      const response = await PUT(
        new Request('http://localhost/api/services/service-1', {
          method: 'PUT',
          body: JSON.stringify({
            name: 'Color',
            durationMinutes: 45,
          }),
        }),
        { params }
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error updating service' })
    })
  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await DELETE(
        new Request('http://localhost/api/services/service-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(401)
    })

    it('returns 404 when the service does not exist', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce(null)

      const response = await DELETE(
        new Request('http://localhost/api/services/service-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Service not found' })
    })

    it('returns 400 when there are active bookings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce({ id: 'service-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce({ id: 'booking-1' })

      const response = await DELETE(
        new Request('http://localhost/api/services/service-1', { method: 'DELETE' }),
        { params }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.service.delete).not.toHaveBeenCalled()
    })

    it('deletes the service when there are no active bookings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce({ id: 'service-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce(null)
      mocks.db.service.delete.mockResolvedValueOnce({ id: 'service-1' })

      const response = await DELETE(
        new Request('http://localhost/api/services/service-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.service.delete).toHaveBeenCalledWith({ where: { id: 'service-1' } })
    })

    it('returns 500 when delete fails unexpectedly', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.service.findFirst.mockResolvedValueOnce({ id: 'service-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce(null)
      mocks.db.service.delete.mockRejectedValueOnce(new Error('delete failed'))

      const response = await DELETE(
        new Request('http://localhost/api/services/service-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error deleting service' })
    })
  })
})
