import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/bookings/route'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendSMS } from '@/lib/sms'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { smsTemplateService } from '@/lib/sms/template-service'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    service: {
      findFirst: vi.fn(),
    },
    customer: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/sms', () => ({
  sendSMS: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendBookingConfirmationEmail: vi.fn(),
}))

vi.mock('@/lib/sms/template-service', () => ({
  smsTemplateService: {
    formatBookingConfirmation: vi.fn(),
  },
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

describe('bookings/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(sendSMS).mockResolvedValue({ success: true } as any)
    vi.mocked(sendBookingConfirmationEmail).mockResolvedValue({ success: true } as any)
    vi.mocked(smsTemplateService.formatBookingConfirmation).mockResolvedValue(null)
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)

      const response = await GET(new Request('http://localhost/api/bookings'))

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns paginated bookings with default params', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          bookingDate: '2026-01-15',
          startTime: '10:00',
          endTime: '11:00',
          status: 'confirmed',
          notes: null,
          confirmationCode: 'ABC123',
          createdAt: '2026-01-01T00:00:00Z',
          customer: { id: 'cust-1', fullName: 'John Doe', phone: '5551112233', email: null },
          service: { id: 'svc-1', name: 'Haircut', durationMinutes: 60, price: 50 },
          staff: { id: 'staff-1', fullName: 'Jane Smith', avatarUrl: null },
        },
      ]

      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.booking.findMany).mockResolvedValueOnce(mockBookings as any)
      vi.mocked(db.booking.count).mockResolvedValueOnce(1)

      const response = await GET(new Request('http://localhost/api/bookings'))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockBookings)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
      expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-1' },
        skip: 0,
        take: 20,
      }))
    })

    it('filters bookings by status', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.booking.findMany).mockResolvedValueOnce([] as any)
      vi.mocked(db.booking.count).mockResolvedValueOnce(0)

      await GET(new Request('http://localhost/api/bookings?filter=confirmed'))

      expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: 'tenant-1', status: 'confirmed' },
      }))
    })

    it('handles custom pagination params', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.booking.findMany).mockResolvedValueOnce([] as any)
      vi.mocked(db.booking.count).mockResolvedValueOnce(50)

      const response = await GET(new Request('http://localhost/api/bookings?page=2&limit=10'))
      const data = await response.json()

      expect(data.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      })
      expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 10,
        take: 10,
      }))
    })

    it('clamps limit to max 100', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.booking.findMany).mockResolvedValueOnce([] as any)
      vi.mocked(db.booking.count).mockResolvedValueOnce(0)

      await GET(new Request('http://localhost/api/bookings?limit=500'))

      expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 100,
      }))
    })

    it('returns 500 on database error', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.booking.findMany).mockRejectedValueOnce(new Error('DB error'))

      const response = await GET(new Request('http://localhost/api/bookings'))

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error fetching bookings' })
    })
  })

  describe('POST', () => {
    const validBookingBody = {
      customerId: 'cust-1',
      customerName: 'John Doe',
      customerPhone: '5551112233',
      customerEmail: 'john@example.com',
      customerNotes: 'VIP customer',
      serviceId: 'svc-1',
      staffId: 'staff-1',
      bookingDate: '2026-12-31',
      startTime: '10:00',
      notes: 'Please be on time',
    }

    const mockService = {
      id: 'svc-1',
      name: 'Haircut',
      durationMinutes: 60,
      price: 50,
      tenantId: 'tenant-1',
    }

    const mockStaff = {
      id: 'staff-1',
      fullName: 'Jane Smith',
      tenantId: 'tenant-1',
    }

    const mockCustomer = {
      id: 'cust-1',
      fullName: 'John Doe',
      phone: '5551112233',
      email: 'john@example.com',
      tenantId: 'tenant-1',
    }

    const mockCreatedBooking = {
      id: 'booking-123',
      tenantId: 'tenant-1',
      customerId: 'cust-1',
      serviceId: 'svc-1',
      staffId: 'staff-1',
      bookingDate: '2026-12-31',
      startTime: '10:00',
      endTime: '11:00',
      notes: 'Please be on time',
      status: 'pending',
      service: mockService,
      customer: mockCustomer,
      staff: mockStaff,
      tenant: { name: 'Test Business' },
    }

    it('returns 401 when unauthenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce(null as any)

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 404 when service not found', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst).mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Service not found' })
    })

    it('returns 404 when staff not found', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Staff not found' })
    })

    it('returns 400 for past dates', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)

      const pastDateBody = {
        ...validBookingBody,
        bookingDate: '2020-01-01',
      }

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(pastDateBody),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Geçmiş tarihe randevu alınamaz' })
    })

    it('creates booking and sends notifications', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)
      vi.mocked(db.$transaction).mockResolvedValueOnce(mockCreatedBooking as any)

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe('booking-123')

      // Verify SMS was sent
      expect(sendSMS).toHaveBeenCalled()
      // Verify email was sent
      expect(sendBookingConfirmationEmail).toHaveBeenCalled()
    })

    it('returns 500 on unexpected error', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst).mockRejectedValueOnce(new Error('Unexpected error'))

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Error creating booking' })
    })

    it('handles time slot conflict error', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)

      // Mock transaction throwing BU_SAAT_DOLU
      vi.mocked(db.$transaction).mockImplementationOnce(() => {
        const error = new Error('BU_SAAT_DOLU')
        throw error
      })

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'Bu saat dilimi maalesef az önce doldu.' })
    })

    it('creates new customer when no customerId or existing phone', async () => {
      const bodyWithoutCustomerId = {
        ...validBookingBody,
        customerId: undefined,
        customerPhone: '5559998888', // New phone number
      }

      const mockNewCustomer = {
        id: 'new-cust-1',
        fullName: 'John Doe',
        phone: '5559998888',
        email: 'john@example.com',
        tenantId: 'tenant-1',
      }

      const mockBookingWithNewCustomer = {
        ...mockCreatedBooking,
        customer: mockNewCustomer,
      }

      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)
      vi.mocked(db.customer.findFirst).mockResolvedValueOnce(null) // No existing customer
      vi.mocked(db.customer.create).mockResolvedValueOnce(mockNewCustomer as any)
      vi.mocked(db.$transaction).mockImplementationOnce(async (callback) => {
        const mockTx = {
          booking: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(mockBookingWithNewCustomer),
          },
          customer: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(mockNewCustomer),
          },
        }
        return callback(mockTx as any)
      })

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(bodyWithoutCustomerId),
        })
      )

      expect(response.status).toBe(200)
    })

    it('handles SMS sending failure gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)
      vi.mocked(db.$transaction).mockResolvedValueOnce(mockCreatedBooking as any)
      vi.mocked(sendSMS).mockRejectedValueOnce(new Error('SMS service down'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(200) // Booking still succeeds
      expect(consoleSpy).toHaveBeenCalledWith('SMS sending failed:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('handles email sending failure gracefully', async () => {
      vi.mocked(auth).mockResolvedValueOnce(session as any)
      vi.mocked(db.service.findFirst)
        .mockResolvedValueOnce(mockService as any)
        .mockResolvedValueOnce(mockStaff as any)
      vi.mocked(db.$transaction).mockResolvedValueOnce(mockCreatedBooking as any)
      vi.mocked(sendSMS).mockResolvedValueOnce({ success: true } as any)
      vi.mocked(sendBookingConfirmationEmail).mockRejectedValueOnce(new Error('Email service down'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const response = await POST(
        new Request('http://localhost/api/bookings', {
          method: 'POST',
          body: JSON.stringify(validBookingBody),
        })
      )

      expect(response.status).toBe(200) // Booking still succeeds
      expect(consoleSpy).toHaveBeenCalledWith('Email sending failed:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })
})
