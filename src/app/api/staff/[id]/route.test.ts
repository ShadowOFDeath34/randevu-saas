import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, PUT } from '@/app/api/staff/[id]/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    staff: {
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    staffService: {
      deleteMany: vi.fn(),
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

const params = Promise.resolve({ id: 'staff-1' })

describe('staff/[id]/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/staff/staff-1', {
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
        new Request('http://localhost/api/staff/staff-1', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: '',
          }),
        }),
        { params }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.staff.findFirst).not.toHaveBeenCalled()
    })

    it('returns 404 when staff is missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/staff/staff-1', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: 'Updated Name',
          }),
        }),
        { params }
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Staff not found' })
    })

    it('replaces staff services and updates the staff record', async () => {
      const updatedStaff = {
        id: 'staff-1',
        fullName: 'Updated Name',
        services: [{ serviceId: 'service-3' }],
      }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1' })
      mocks.db.staffService.deleteMany.mockResolvedValueOnce({ count: 2 })
      mocks.db.staff.update.mockResolvedValueOnce(updatedStaff)

      const response = await PUT(
        new Request('http://localhost/api/staff/staff-1', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: 'Updated Name',
            serviceIds: ['service-3'],
          }),
        }),
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(updatedStaff)
      expect(mocks.db.staffService.deleteMany).toHaveBeenCalledWith({
        where: { staffId: 'staff-1' },
      })
      expect(mocks.db.staff.update).toHaveBeenCalledWith({
        where: { id: 'staff-1' },
        data: {
          fullName: 'Updated Name',
          isActive: true,
          services: {
            create: [{ serviceId: 'service-3', tenantId: 'tenant-1' }],
          },
        },
        include: { services: true },
      })
    })

    it('returns 500 when update fails unexpectedly', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1' })
      mocks.db.staffService.deleteMany.mockResolvedValueOnce({ count: 0 })
      mocks.db.staff.update.mockRejectedValueOnce(new Error('update failed'))

      const response = await PUT(
        new Request('http://localhost/api/staff/staff-1', {
          method: 'PUT',
          body: JSON.stringify({
            fullName: 'Updated Name',
          }),
        }),
        { params }
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error updating staff' })
    })
  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await DELETE(
        new Request('http://localhost/api/staff/staff-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(401)
    })

    it('returns 404 when staff is missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce(null)

      const response = await DELETE(
        new Request('http://localhost/api/staff/staff-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Staff not found' })
    })

    it('returns 400 when the staff member has active bookings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce({ id: 'booking-1' })

      const response = await DELETE(
        new Request('http://localhost/api/staff/staff-1', { method: 'DELETE' }),
        { params }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.staff.delete).not.toHaveBeenCalled()
    })

    it('deletes the staff member when there are no active bookings', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce(null)
      mocks.db.staff.delete.mockResolvedValueOnce({ id: 'staff-1' })

      const response = await DELETE(
        new Request('http://localhost/api/staff/staff-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true })
      expect(mocks.db.staff.delete).toHaveBeenCalledWith({ where: { id: 'staff-1' } })
    })

    it('returns 500 when delete fails unexpectedly', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findFirst.mockResolvedValueOnce({ id: 'staff-1' })
      mocks.db.booking.findFirst.mockResolvedValueOnce(null)
      mocks.db.staff.delete.mockRejectedValueOnce(new Error('delete failed'))

      const response = await DELETE(
        new Request('http://localhost/api/staff/staff-1', { method: 'DELETE' }),
        { params }
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error deleting staff' })
    })
  })
})
