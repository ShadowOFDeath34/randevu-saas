import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PUT } from './route'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: {
    dynamicPricingConfig: {
      update: vi.fn(),
    },
  },
  getOrCreatePricingConfig: vi.fn(),
  setupDefaultPricingRules: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}))

vi.mock('@/lib/db', () => ({
  db: mocks.db,
}))

vi.mock('@/lib/pricing/service', () => ({
  getOrCreatePricingConfig: mocks.getOrCreatePricingConfig,
  setupDefaultPricingRules: mocks.setupDefaultPricingRules,
}))

const session = {
  user: {
    id: 'user-1',
    tenantId: 'tenant-1',
  },
}

describe('pricing/config/route.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await GET()

      expect(response.status).toBe(401)
    })

    it('returns pricing config', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.getOrCreatePricingConfig.mockResolvedValueOnce({
        id: 'config-1',
        tenantId: 'tenant-1',
        isEnabled: true,
        minAdjustmentPercent: -30,
        maxAdjustmentPercent: 50,
        useAiOptimization: true,
        autoSurgePricing: true,
        autoOffPeakDiscount: true,
        peakHoursStart: '17:00',
        peakHoursEnd: '20:00',
        highDemandThreshold: 80,
        lowDemandThreshold: 30,
        lastMinuteHours: 24,
        advanceBookingDays: 7,
      })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isEnabled).toBe(true)
      expect(data.minAdjustmentPercent).toBe(-30)
      expect(data.maxAdjustmentPercent).toBe(50)
      expect(mocks.getOrCreatePricingConfig).toHaveBeenCalledWith('tenant-1')
    })

    it('returns 500 when service fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.getOrCreatePricingConfig.mockRejectedValueOnce(new Error('Service error'))

      const response = await GET()

      expect(response.status).toBe(500)
    })
  })

  describe('PUT', () => {
    it('returns 401 when unauthenticated', async () => {
      mocks.auth.mockResolvedValueOnce(null)

      const response = await PUT(
        new Request('http://localhost/api/pricing/config', {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: true }),
        })
      )

      expect(response.status).toBe(401)
    })

    it('updates pricing config', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.dynamicPricingConfig.update.mockResolvedValueOnce({
        id: 'config-1',
        tenantId: 'tenant-1',
        isEnabled: true,
        minAdjustmentPercent: -20,
        maxAdjustmentPercent: 40,
        useAiOptimization: false,
        autoSurgePricing: true,
        autoOffPeakDiscount: false,
        peakHoursStart: '18:00',
        peakHoursEnd: '21:00',
        highDemandThreshold: 75,
        lowDemandThreshold: 25,
        lastMinuteHours: 12,
        advanceBookingDays: 14,
      })

      const response = await PUT(
        new Request('http://localhost/api/pricing/config', {
          method: 'PUT',
          body: JSON.stringify({
            isEnabled: true,
            minAdjustmentPercent: -20,
            maxAdjustmentPercent: 40,
            useAiOptimization: false,
            autoSurgePricing: true,
            autoOffPeakDiscount: false,
            peakHoursStart: '18:00',
            peakHoursEnd: '21:00',
            highDemandThreshold: 75,
            lowDemandThreshold: 25,
            lastMinuteHours: 12,
            advanceBookingDays: 14,
          }),
        })
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isEnabled).toBe(true)
      expect(data.minAdjustmentPercent).toBe(-20)
      expect(data.peakHoursStart).toBe('18:00')
    })

    it('creates default rules when enabling', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.dynamicPricingConfig.update.mockResolvedValueOnce({
        id: 'config-1',
        isEnabled: true,
      })
      mocks.setupDefaultPricingRules.mockResolvedValueOnce(undefined)

      await PUT(
        new Request('http://localhost/api/pricing/config', {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: true }),
        })
      )

      expect(mocks.setupDefaultPricingRules).toHaveBeenCalledWith('tenant-1')
    })

    it('does not create rules when disabling', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.dynamicPricingConfig.update.mockResolvedValueOnce({
        id: 'config-1',
        isEnabled: false,
      })

      await PUT(
        new Request('http://localhost/api/pricing/config', {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: false }),
        })
      )

      expect(mocks.setupDefaultPricingRules).not.toHaveBeenCalled()
    })

    it('returns 500 when update fails', async () => {
      mocks.auth.mockResolvedValueOnce(session)
      mocks.db.dynamicPricingConfig.update.mockRejectedValueOnce(new Error('Update failed'))

      const response = await PUT(
        new Request('http://localhost/api/pricing/config', {
          method: 'PUT',
          body: JSON.stringify({ isEnabled: true }),
        })
      )

      expect(response.status).toBe(500)
    })
  })
})
