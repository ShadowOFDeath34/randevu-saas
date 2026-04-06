import {
  checkRateLimit,
  checkIPRateLimit,
  checkUserRateLimit,
  getEndpointConfig,
  createRateLimitHeaders,
  ENDPOINT_LIMITS,
  withRateLimit,
  getRateLimitStats,
  type RateLimitConfig
} from './rate-limit'

describe('Rate Limit', () => {
  // Clean up store between tests
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow first request', async () => {
      const result = await checkRateLimit('test-user', { requests: 5, window: 60 })
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
      expect(result.limit).toBe(5)
    })

    it('should track multiple requests', async () => {
      const config: RateLimitConfig = { requests: 3, window: 60 }

      await checkRateLimit('user-1', config)
      const result2 = await checkRateLimit('user-1', config)
      expect(result2.remaining).toBe(1)

      await checkRateLimit('user-1', config)
      const result3 = await checkRateLimit('user-1', config)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests over limit', async () => {
      const config: RateLimitConfig = { requests: 2, window: 60 }

      await checkRateLimit('user-2', config)
      await checkRateLimit('user-2', config)
      const result = await checkRateLimit('user-2', config)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.retryAfter).toBeDefined()
    })

    it('should reset after window expires', async () => {
      const config: RateLimitConfig = { requests: 2, window: 60 }
      const now = Date.now()
      jest.setSystemTime(now)

      await checkRateLimit('user-3', config)
      await checkRateLimit('user-3', config)

      // Advance time past window
      jest.advanceTimersByTime(61 * 1000)

      const result = await checkRateLimit('user-3', config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should track different users separately', async () => {
      const config: RateLimitConfig = { requests: 5, window: 60 }

      await checkRateLimit('user-a', config)
      await checkRateLimit('user-a', config)

      const result = await checkRateLimit('user-b', config)
      expect(result.remaining).toBe(4)
    })
  })

  describe('checkIPRateLimit', () => {
    it('should create IP-based keys', async () => {
      const result = await checkIPRateLimit('192.168.1.1')
      expect(result.success).toBe(true)
      expect(result.limit).toBe(100) // Default limit
    })
  })

  describe('checkUserRateLimit', () => {
    it('should create user-based keys', async () => {
      const result = await checkUserRateLimit('user-123')
      expect(result.success).toBe(true)
      expect(result.limit).toBe(100)
    })
  })

  describe('getEndpointConfig', () => {
    it('should return specific config for auth endpoints', () => {
      const config = getEndpointConfig('/api/auth/login')
      expect(config).toEqual({ requests: 5, window: 300 })
    })

    it('should return specific config for SMS endpoints', () => {
      const config = getEndpointConfig('/api/sms/send')
      expect(config).toEqual({ requests: 10, window: 60 })
    })

    it('should return default config for unknown endpoints', () => {
      const config = getEndpointConfig('/api/unknown')
      expect(config).toEqual({ requests: 100, window: 60 })
    })

    it('should match pattern endpoints', () => {
      const config = getEndpointConfig('/api/payment/process')
      expect(config).toEqual({ requests: 10, window: 60 })
    })
  })

  describe('createRateLimitHeaders', () => {
    it('should create headers for successful result', () => {
      const result = {
        success: true,
        limit: 100,
        remaining: 50,
        reset: Date.now() + 60000
      }

      const headers = createRateLimitHeaders(result)
      expect(headers['X-RateLimit-Limit']).toBe('100')
      expect(headers['X-RateLimit-Remaining']).toBe('50')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
      expect(headers['Retry-After']).toBeUndefined()
    })

    it('should include Retry-After for blocked requests', () => {
      const result = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 300000,
        retryAfter: 300
      }

      const headers = createRateLimitHeaders(result)
      expect(headers['Retry-After']).toBe('300')
    })
  })

  describe('withRateLimit', () => {
    it('should execute function when not rate limited', async () => {
      const fn = jest.fn().mockResolvedValue('success')

      const { result, limited, headers } = await withRateLimit('test', fn, { requests: 5, window: 60 })

      expect(limited).toBe(false)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalled()
      expect(headers['X-RateLimit-Limit']).toBeDefined()
    })

    it('should not execute function when rate limited', async () => {
      const config: RateLimitConfig = { requests: 1, window: 60 }
      const fn = jest.fn().mockResolvedValue('success')

      // First call succeeds
      await withRateLimit('limited-test', fn, config)

      // Second call should be rate limited
      const { result, limited, headers } = await withRateLimit('limited-test', fn, config)

      expect(limited).toBe(true)
      expect(result).toBeNull()
      expect(headers['Retry-After']).toBeDefined()
    })
  })

  describe('getRateLimitStats', () => {
    it('should return stats', () => {
      const stats = getRateLimitStats()
      expect(stats).toHaveProperty('totalKeys')
      expect(stats).toHaveProperty('memorySize')
      expect(stats).toHaveProperty('topIdentifiers')
      expect(Array.isArray(stats.topIdentifiers)).toBe(true)
    })
  })

  describe('ENDPOINT_LIMITS', () => {
    it('should have auth endpoint limits', () => {
      expect(ENDPOINT_LIMITS['/api/auth/login']).toEqual({ requests: 5, window: 300 })
      expect(ENDPOINT_LIMITS['/api/auth/register']).toEqual({ requests: 3, window: 3600 })
    })

    it('should have SMS endpoint limits', () => {
      expect(ENDPOINT_LIMITS['/api/sms/send']).toEqual({ requests: 10, window: 60 })
      expect(ENDPOINT_LIMITS['/api/sms/bulk']).toEqual({ requests: 1, window: 60 })
    })

    it('should have payment endpoint limits', () => {
      expect(ENDPOINT_LIMITS['/api/payment']).toEqual({ requests: 10, window: 60 })
      expect(ENDPOINT_LIMITS['/api/subscription/checkout']).toEqual({ requests: 5, window: 300 })
    })
  })
})
