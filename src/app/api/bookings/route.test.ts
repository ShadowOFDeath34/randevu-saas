import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/bookings/route'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    booking: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

describe('Bookings API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(auth as any).mockResolvedValueOnce(null)

    const request = new Request('http://localhost:3000/api/bookings')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('should return bookings when authenticated', async () => {
    const mockSession = {
      user: {
        tenantId: 'tenant-1',
      },
    }

    const mockBookings = [
      {
        id: '1',
        customerName: 'Test User',
        serviceName: 'Saç Kesimi',
        staffName: 'Mehmet',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'confirmed',
        price: 150,
      },
    ]

    ;(auth as any).mockResolvedValueOnce(mockSession)
    ;(db.booking.findMany as any).mockResolvedValueOnce(mockBookings)

    const request = new Request('http://localhost:3000/api/bookings')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockBookings)
  })
})
