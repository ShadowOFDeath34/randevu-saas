/**
 * Rate Limiting Tests
 */

import {
  checkRateLimit,
  checkIPRateLimit,
  checkUserRateLimit,
  getEndpointConfig,
  createRateLimitHeaders,
  getRateLimitStats,
  ENDPOINT_LIMITS,
} from '@/lib/security/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset rate limit stats
    const stats = getRateLimitStats()
    expect(stats).toBeDefined()
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', async () => {
      const result = await checkRateLimit('test-id', { requests: 5, window: 60 })

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(result.reset).toBeGreaterThan(Date.now())
    })

    it('should track multiple requests', async () => {
      const identifier = 'test-multiple'
      const config = { requests: 3, window: 60 }

      // First request
      let result = await checkRateLimit(identifier, config)
      expect(result.remaining).toBe(2)

      // Second request
      result = await checkRateLimit(identifier, config)
      expect(result.remaining).toBe(1)

      // Third request
      result = await checkRateLimit(identifier, config)
      expect(result.remaining).toBe(0)
    })

    it('should block requests over limit', async () => {
      const identifier = 'test-block'
      const config = { requests: 2, window: 60 }

      // First two requests
      await checkRateLimit(identifier, config)
      await checkRateLimit(identifier, config)

      // Third request should be blocked
      const result = await checkRateLimit(identifier, config)
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should use default config when not provided', async () => {
      const result = await checkRateLimit('test-default')

      expect(result.limit).toBe(100) // Default limit
      expect(result.success).toBe(true)
    })
  })

  describe('checkIPRateLimit', () => {
    it('should rate limit by IP', async () => {
      const result = await checkIPRateLimit('192.168.1.1')

      expect(result.success).toBe(true)
      expect(result.limit).toBeDefined()
    })
  })

  describe('checkUserRateLimit', () => {
    it('should rate limit by user ID', async () => {
      const result = await checkUserRateLimit('user-123')

      expect(result.success).toBe(true)
      expect(result.limit).toBeDefined()
    })
  })

  describe('getEndpointConfig', () => {
    it('should return config for known endpoints', () => {
      const config = getEndpointConfig('/api/auth/login')

      expect(config).toEqual(ENDPOINT_LIMITS['/api/auth/login'])
    })

    it('should return default config for unknown endpoints', () => {
      const config = getEndpointConfig('/api/unknown')

      expect(config.requests).toBe(100)
      expect(config.window).toBe(60)
    })

    it('should match endpoints with pattern', () => {
      const config = getEndpointConfig('/api/sms/send/verify')

      expect(config.requests).toBe(10)
      expect(config.window).toBe(60)
    })
  })

  describe('createRateLimitHeaders', () => {
    it('should create rate limit headers', () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000,
      }

      const headers = createRateLimitHeaders(result)

      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('50')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
    })

    it('should include Retry-After when rate limited', () => {
      const result = {
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
      }

      const headers = createRateLimitHeaders(result)

      expect(headers['Retry-After']).toBe('60')
    })
  })

  describe('getRateLimitStats', () => {
    it('should return rate limit statistics', () => {
      const stats = getRateLimitStats()

      expect(stats).toHaveProperty('totalKeys')
      expect(stats).toHaveProperty('memorySize')
      expect(stats).toHaveProperty('topIdentifiers')
    })
  })
})
