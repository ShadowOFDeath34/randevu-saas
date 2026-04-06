/**
 * Rate Limiting Service
 * API endpoint'lerinde abuse önleme ve rate limiting
 *
 * Production için Redis önerilir, fallback olarak in-memory store kullanılır
 */

import { db } from '@/lib/db'
import { logStructured } from '@/lib/monitoring'

export interface RateLimitConfig {
  requests: number // Maksimum istek sayısı
  window: number // Zaman penceresi (saniye)
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
  retryAfter?: number // Saniye
}

// Default rate limit: 100 requests per minute
const DEFAULT_CONFIG: RateLimitConfig = {
  requests: 100,
  window: 60,
}

// In-memory store (Redis olmadan çalışır)
const memoryStore = new Map<string, { count: number; reset: number }>()

/**
 * Generate rate limit key
 */
function generateKey(identifier: string, prefix: string = 'rl'): string {
  return `${prefix}:${identifier}`
}

/**
 * Clean expired entries from memory store
 */
function cleanExpired(): void {
  const now = Date.now()
  for (const [key, value] of memoryStore) {
    if (value.reset < now) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Check rate limit for an identifier
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const key = generateKey(identifier)
  const now = Date.now()
  const windowMs = config.window * 1000

  // Clean expired entries periodically (every 100 requests)
  if (memoryStore.size % 100 === 0) {
    cleanExpired()
  }

  let entry = memoryStore.get(key)

  if (!entry || entry.reset < now) {
    // New window
    entry = {
      count: 1,
      reset: now + windowMs,
    }
    memoryStore.set(key, entry)

    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: entry.reset,
    }
  }

  // Increment counter
  entry.count++

  const remaining = Math.max(0, config.requests - entry.count)
  const success = entry.count <= config.requests

  if (!success) {
    logStructured('warn', 'Rate limit exceeded', {
      identifier: identifier.substring(0, 10) + '...',
      count: entry.count,
      limit: config.requests,
    })
  }

  return {
    success,
    limit: config.requests,
    remaining,
    reset: entry.reset,
    retryAfter: success ? undefined : Math.ceil((entry.reset - now) / 1000),
  }
}

/**
 * Rate limit by IP address
 */
export async function checkIPRateLimit(
  ip: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(`ip:${ip}`, config)
}

/**
 * Rate limit by user ID
 */
export async function checkUserRateLimit(
  userId: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, config)
}

/**
 * Rate limit for specific endpoints
 */
export const ENDPOINT_LIMITS: Record<string, RateLimitConfig> = {
  // Auth endpoints: strict limits
  '/api/auth/login': { requests: 5, window: 300 }, // 5 per 5 minutes
  '/api/auth/register': { requests: 3, window: 3600 }, // 3 per hour
  '/api/auth/forgot-password': { requests: 3, window: 3600 },

  // SMS sending: strict limits due to cost
  '/api/sms/send': { requests: 10, window: 60 }, // 10 per minute
  '/api/sms/bulk': { requests: 1, window: 60 }, // 1 per minute

  // Email sending
  '/api/email/send': { requests: 20, window: 60 },

  // Booking creation
  '/api/bookings': { requests: 30, window: 60 },

  // Payment endpoints
  '/api/payment': { requests: 10, window: 60 },
  '/api/subscription/checkout': { requests: 5, window: 300 },

  // API keys
  '/api/api-keys': { requests: 20, window: 60 },

  // Webhooks
  '/api/webhooks/iyzico': { requests: 100, window: 60 },
}

/**
 * Get rate limit config for endpoint
 */
export function getEndpointConfig(path: string): RateLimitConfig {
  // Exact match
  if (ENDPOINT_LIMITS[path]) {
    return ENDPOINT_LIMITS[path]
  }

  // Pattern match
  for (const [pattern, config] of Object.entries(ENDPOINT_LIMITS)) {
    if (path.startsWith(pattern.replace('*', ''))) {
      return config
    }
  }

  return DEFAULT_CONFIG
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  }
}

/**
 * Rate limit middleware wrapper for API routes
 */
export async function withRateLimit<T>(
  identifier: string,
  fn: () => Promise<T>,
  config?: RateLimitConfig
): Promise<{ result: T; headers: Record<string, string>; limited: boolean }> {
  const rateLimit = await checkRateLimit(identifier, config)
  const headers = createRateLimitHeaders(rateLimit)

  if (!rateLimit.success) {
    return {
      result: null as T,
      headers,
      limited: true,
    }
  }

  const result = await fn()
  return { result, headers, limited: false }
}

/**
 * Get current rate limit status for monitoring
 */
export function getRateLimitStats(): {
  totalKeys: number
  memorySize: number
  topIdentifiers: { key: string; count: number }[]
} {
  const entries = Array.from(memoryStore.entries())
  const sorted = entries
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([key, value]) => ({ key: key.split(':')[0] + ':***', count: value.count }))

  return {
    totalKeys: memoryStore.size,
    memorySize: JSON.stringify(memoryStore).length,
    topIdentifiers: sorted,
  }
}
