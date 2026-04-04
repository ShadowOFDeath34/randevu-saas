import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/staff/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    staff: {
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

describe('staff/route.ts', () => {
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

    it('returns staff with services for the tenant', async () => {
      const staff = [
        {
          id: 'staff-1',
          fullName: 'Jane Doe',
          tenantId: 'tenant-1',
          services: [{ serviceId: 'service-1' }],
        },
      ]

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findMany.mockResolvedValueOnce(staff)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(staff)
      expect(mocks.db.staff.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: {
          services: true,
        },
        orderBy: { fullName: 'asc' },
      })
    })

    it('returns 500 when staff lookup fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.findMany.mockRejectedValueOnce(new Error('lookup failed'))

      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error fetching staff' })
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/staff', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 when zod validation fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/staff', {
          method: 'POST',
          body: JSON.stringify({
            fullName: '',
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(typeof data.error).toBe('string')
      expect(mocks.db.staff.create).not.toHaveBeenCalled()
    })

    it('creates staff and related services', async () => {
      const createdStaff = {
        id: 'staff-1',
        fullName: 'Jane Doe',
        title: 'Senior Stylist',
        tenantId: 'tenant-1',
        services: [{ serviceId: 'service-1' }, { serviceId: 'service-2' }],
      }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.create.mockResolvedValueOnce(createdStaff)

      const response = await POST(
        new Request('http://localhost/api/staff', {
          method: 'POST',
          body: JSON.stringify({
            fullName: 'Jane Doe',
            title: 'Senior Stylist',
            serviceIds: ['service-1', 'service-2'],
          }),
        })
      )

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(createdStaff)
      expect(mocks.db.staff.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Jane Doe',
          title: 'Senior Stylist',
          isActive: true,
          tenantId: 'tenant-1',
          services: {
            create: [
              { serviceId: 'service-1', tenantId: 'tenant-1' },
              { serviceId: 'service-2', tenantId: 'tenant-1' },
            ],
          },
        },
        include: { services: true },
      })
    })

    it('creates staff without service relations when no serviceIds are provided', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.create.mockResolvedValueOnce({ id: 'staff-2' })

      await POST(
        new Request('http://localhost/api/staff', {
          method: 'POST',
          body: JSON.stringify({
            fullName: 'Solo Staff',
          }),
        })
      )

      expect(mocks.db.staff.create).toHaveBeenCalledWith({
        data: {
          fullName: 'Solo Staff',
          isActive: true,
          tenantId: 'tenant-1',
          services: undefined,
        },
        include: { services: true },
      })
    })

    it('returns 500 when create fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.staff.create.mockRejectedValueOnce(new Error('create failed'))

      const response = await POST(
        new Request('http://localhost/api/staff', {
          method: 'POST',
          body: JSON.stringify({
            fullName: 'Broken Staff',
          }),
        })
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error creating staff' })
    })
  })
})
