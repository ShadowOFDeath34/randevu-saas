import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '@/app/api/customers/route'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    customer: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

describe('Customers API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as unknown as { mockResolvedValueOnce: (value: null) => void }).mockResolvedValueOnce(null)

      const request = new Request('http://localhost:3000/api/customers')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return customers with booking counts when authenticated', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const mockCustomers = [
        {
          id: '1',
          fullName: 'Ahmet Yılmaz',
          phone: '5551234567',
          email: 'ahmet@example.com',
          tenantId: 'tenant-1',
          _count: { bookings: 5 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          fullName: 'Mehmet Demir',
          phone: '5559876543',
          email: null,
          tenantId: 'tenant-1',
          _count: { bookings: 2 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.customer.findMany as unknown as { mockResolvedValueOnce: (value: typeof mockCustomers) => void }).mockResolvedValueOnce(mockCustomers)

      const request = new Request('http://localhost:3000/api/customers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockCustomers)
      expect(data.pagination).toBeDefined()
      expect(db.customer.findMany).toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should return 401 when not authenticated', async () => {
      ;(auth as unknown as { mockResolvedValueOnce: (value: null) => void }).mockResolvedValueOnce(null)

      const request = new Request('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 when customer with phone already exists', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const existingCustomer = {
        id: '1',
        fullName: 'Mevcut Müşteri',
        phone: '5551234567',
        tenantId: 'tenant-1',
      }

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.customer.findFirst as unknown as { mockResolvedValueOnce: (value: typeof existingCustomer) => void }).mockResolvedValueOnce(existingCustomer)

      const request = new Request('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: 'Yeni Müşteri',
          phone: '5551234567',
        }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Bu telefon numarası ile kayıtlı müşteri var')
    })

    it('should create customer successfully', async () => {
      const mockSession = {
        user: {
          tenantId: 'tenant-1',
        },
      }

      const customerData = {
        fullName: 'Yeni Müşteri',
        phone: '5559998888',
        email: 'yeni@example.com',
        notes: 'Özel not',
      }

      const mockCreatedCustomer = {
        id: '3',
        ...customerData,
        tenantId: 'tenant-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      ;(auth as unknown as { mockResolvedValueOnce: (value: typeof mockSession) => void }).mockResolvedValueOnce(mockSession)
      ;(db.customer.findFirst as unknown as { mockResolvedValueOnce: (value: null) => void }).mockResolvedValueOnce(null)
      ;(db.customer.create as unknown as { mockResolvedValueOnce: (value: typeof mockCreatedCustomer) => void }).mockResolvedValueOnce(mockCreatedCustomer)

      const request = new Request('http://localhost:3000/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCreatedCustomer)
    })
  })
})
