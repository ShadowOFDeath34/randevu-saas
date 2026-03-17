import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/staff/route'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    staff: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/validations', () => ({
  staffSchema: {
    parse: vi.fn((data) => data),
  },
}))

describe('Staff API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as any).mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return staff with services when authenticated', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const mockStaff = [
        {
          id: '1',
          fullName: 'Mehmet Yılmaz',
          phone: '5551234567',
          email: 'mehmet@example.com',
          tenantId: 'tenant-1',
          services: [
            { id: '1', serviceId: 'svc-1', staffId: '1', tenantId: 'tenant-1' },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      ;(auth as any).mockResolvedValueOnce(mockSession)
      ;(db.staff.findMany as any).mockResolvedValueOnce(mockStaff)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStaff)
      expect(db.staff.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: { services: true },
        orderBy: { fullName: 'asc' },
      })
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as any).mockResolvedValueOnce(null)

      const request = new Request('http://localhost:3000/api/staff', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create staff with services successfully', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const staffData = {
        fullName: 'Ahmet Demir',
        phone: '5559876543',
        email: 'ahmet@example.com',
        serviceIds: ['svc-1', 'svc-2'],
      }

      const mockCreatedStaff = {
        id: '2',
        fullName: staffData.fullName,
        phone: staffData.phone,
        email: staffData.email,
        tenantId: 'tenant-1',
        services: [
          { id: '1', serviceId: 'svc-1', staffId: '2', tenantId: 'tenant-1' },
          { id: '2', serviceId: 'svc-2', staffId: '2', tenantId: 'tenant-1' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(auth as any).mockResolvedValueOnce(mockSession)
      ;(db.staff.create as any).mockResolvedValueOnce(mockCreatedStaff)

      const request = new Request('http://localhost:3000/api/staff', {
        method: 'POST',
        body: JSON.stringify(staffData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedStaff)
    })
  })
})
