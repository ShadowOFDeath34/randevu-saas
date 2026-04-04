import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/payments/route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  createSubscriptionCheckout: vi.fn(),
  isPaymentSuccess: vi.fn(),
  db: {
    tenant: {
      findUnique: vi.fn(),
    },
    subscription: {
      create: vi.fn(),
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

vi.mock('@/lib/payment/iyzico', () => ({
  createSubscriptionCheckout: mocks.createSubscriptionCheckout,
  isPaymentSuccess: mocks.isPaymentSuccess,
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

describe('payments/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      )

      expect(response.status).toBe(401)
    })

    it('returns 400 when required fields are missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({ planId: 'basic' }),
        })
      )

      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({
        error: 'Plan ID and customer info required',
      })
    })

    it('returns 404 when tenant is missing', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.tenant.findUnique.mockResolvedValueOnce(null)

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            planId: 'basic',
            customerInfo: { name: 'Ada' },
          }),
        })
      )

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'Tenant not found' })
    })

    it('returns 400 when payment initialization fails', async () => {
      const paymentResult = { status: 'failure' }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-1' })
      mocks.createSubscriptionCheckout.mockResolvedValueOnce(paymentResult)
      mocks.isPaymentSuccess.mockReturnValueOnce(false)

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            planId: 'basic',
            customerInfo: {
              name: 'Ada',
              surname: 'Lovelace',
              email: 'ada@example.com',
              phone: '5551112233',
              identityNumber: '12345678901',
              city: 'Istanbul',
              address: 'Test Street',
            },
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Payment initialization failed',
        details: paymentResult,
      })
      expect(mocks.db.subscription.create).not.toHaveBeenCalled()
    })

    it('creates checkout and a pending subscription when initialization succeeds', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-1' })
      mocks.createSubscriptionCheckout.mockResolvedValueOnce({
        status: 'success',
        token: 'token-1',
        paymentPageUrl: 'https://pay.example.com',
        checkoutFormContent: '<form />',
      })
      mocks.isPaymentSuccess.mockReturnValueOnce(true)
      mocks.db.subscription.create.mockResolvedValueOnce({ id: 'sub-1' })

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            planId: 'pro',
            customerInfo: {
              name: 'Ada',
              surname: 'Lovelace',
              email: 'ada@example.com',
              phone: '5551112233',
              identityNumber: '12345678901',
              city: 'Istanbul',
              country: 'Turkey',
              address: 'Test Street',
            },
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        checkoutFormContent: '<form />',
        token: 'token-1',
        paymentPageUrl: 'https://pay.example.com',
      })
      expect(mocks.createSubscriptionCheckout).toHaveBeenCalledWith({
        planId: 'pro',
        tenantId: 'tenant-1',
        customer: {
          name: 'Ada',
          surname: 'Lovelace',
          email: 'ada@example.com',
          phoneNumber: '5551112233',
          identityNumber: '12345678901',
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Test Street',
        },
      })
      expect(mocks.db.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          planId: 'pro',
          status: 'pending',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      })
    })

    it('returns 500 when payment creation throws', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.tenant.findUnique.mockResolvedValueOnce({ id: 'tenant-1' })
      mocks.createSubscriptionCheckout.mockRejectedValueOnce(new Error('gateway down'))

      const response = await POST(
        new Request('http://localhost/api/payments', {
          method: 'POST',
          body: JSON.stringify({
            planId: 'basic',
            customerInfo: { name: 'Ada' },
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Failed to create payment',
        message: 'gateway down',
      })
    })
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns 404 when no subscription exists', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.subscription.findFirst.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: 'No subscription found' })
    })

    it('returns the latest subscription status', async () => {
      const subscription = {
        status: 'active',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-02-01T00:00:00.000Z'),
      }

      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.subscription.findFirst.mockResolvedValueOnce(subscription)

      const response = await GET()

      expect(response.status).toBe(200)
      // Dates are serialized to strings in JSON response
      expect(await response.json()).toEqual({
        status: 'active',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-02-01T00:00:00.000Z',
      })
      expect(mocks.db.subscription.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { startDate: 'desc' },
      })
    })

    it('returns 500 when subscription lookup fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.subscription.findFirst.mockRejectedValueOnce(new Error('lookup failed'))

      const response = await GET()

      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Failed to get status' })
    })
  })
})
