import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/services/route'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    service: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/validations', () => ({
  serviceSchema: {
    parse: vi.fn((data) => data),
  },
}))

describe('Services API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as unknown as { mockResolvedValueOnce: (value: null) => void }).mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('should return services when authenticated', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const mockServices = [
        {
          id: '1',
          name: 'Saç Kesimi',
          duration: 30,
          price: 150,
          tenantId: 'tenant-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Sakal Traşı',
          duration: 15,
          price: 75,
          tenantId: 'tenant-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.service.findMany as unknown as { mockResolvedValueOnce: (value: typeof mockServices) => void }).mockResolvedValueOnce(mockServices)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockServices)
      expect(db.service.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { name: 'asc' },
      })
    })

    it('should return 500 on database error', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.service.findMany as unknown as { mockRejectedValueOnce: (error: Error) => void }).mockRejectedValueOnce(new Error('DB Error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as unknown as { mockResolvedValueOnce: (value: null) => void }).mockResolvedValueOnce(null)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should create service successfully', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const serviceData = {
        name: 'Yeni Hizmet',
        duration: 45,
        price: 200,
      }

      const mockCreatedService = {
        id: '3',
        ...serviceData,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.service.create as unknown as { mockResolvedValueOnce: (value: typeof mockCreatedService) => void }).mockResolvedValueOnce(mockCreatedService)

      const request = new Request('http://localhost:3000/api/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedService)
    })
  })
})
