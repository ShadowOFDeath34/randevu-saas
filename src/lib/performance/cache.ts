/**
 * Caching Layer
 * Memory cache (development) + Redis (production)
 * Multi-tier caching strategy
 */

import { logStructured } from '@/lib/monitoring'
import { isRedisConfigured } from '@/lib/env'

interface CacheEntry<T> {
  value: T
  expiresAt: number
  tags?: string[]
}

export interface CacheConfig {
  ttl: number // seconds
  tags?: string[]
  skipCache?: boolean
}

// In-memory cache store
const memoryCache = new Map<string, CacheEntry<unknown>>()

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  evictions: 0,
}

/**
 * Redis client (lazy initialization)
 */
let redisClient: any = null

async function getRedisClient() {
  if (!isRedisConfigured()) return null
  if (redisClient) return redisClient

  try {
    // Dynamic import for Redis
    const { Redis } = await import('@upstash/redis')
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    return redisClient
  } catch (error) {
    logStructured('error', 'Redis client initialization failed', {
      error: (error as Error).message,
    })
    return null
  }
}

/**
 * Generate cache key
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`
}

/**
 * Get from cache (memory or Redis)
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first (if available)
    const redis = await getRedisClient()
    if (redis) {
      const value = await redis.get(key)
      if (value) {
        stats.hits++
        return JSON.parse(value)
      }
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key)
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        stats.hits++
        return entry.value as T
      }
      // Expired
      memoryCache.delete(key)
      stats.evictions++
    }

    stats.misses++
    return null
  } catch (error) {
    logStructured('error', 'Cache get error', { key, error: (error as Error).message })
    return null
  }
}

/**
 * Set cache value
 */
export async function set<T>(
  key: string,
  value: T,
  config: CacheConfig
): Promise<void> {
  if (config.skipCache) return

  try {
    const expiresAt = Date.now() + config.ttl * 1000

    // Try Redis first
    const redis = await getRedisClient()
    if (redis) {
      await redis.set(key, JSON.stringify(value), { ex: config.ttl })

      // Set tags for invalidation
      if (config.tags?.length) {
        for (const tag of config.tags) {
          await redis.sadd(`tag:${tag}`, key)
        }
      }
      return
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expiresAt,
      tags: config.tags,
    })

    // Cleanup if cache is too large
    if (memoryCache.size > 1000) {
      cleanupExpired()
    }
  } catch (error) {
    logStructured('error', 'Cache set error', { key, error: (error as Error).message })
  }
}

/**
 * Delete from cache
 */
export async function del(key: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (redis) {
      await redis.del(key)
    }
    memoryCache.delete(key)
  } catch (error) {
    logStructured('error', 'Cache delete error', { key, error: (error as Error).message })
  }
}

/**
 * Invalidate by tag
 */
export async function invalidateTag(tag: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (redis) {
      const keys = await redis.smembers(`tag:${tag}`)
      if (keys.length) {
        await redis.del(...keys)
        await redis.del(`tag:${tag}`)
      }
    }

    // Memory cache cleanup by tag
    for (const [key, entry] of memoryCache) {
      if (entry.tags?.includes(tag)) {
        memoryCache.delete(key)
      }
    }

    logStructured('info', 'Cache invalidated by tag', { tag })
  } catch (error) {
    logStructured('error', 'Cache invalidate error', { tag, error: (error as Error).message })
  }
}

/**
 * Clear all cache
 */
export async function clear(): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (redis) {
      await redis.flushall()
    }
    memoryCache.clear()
    logStructured('info', 'Cache cleared')
  } catch (error) {
    logStructured('error', 'Cache clear error', { error: (error as Error).message })
  }
}

/**
 * Cleanup expired entries from memory cache
 */
function cleanupExpired(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    stats.evictions += cleaned
    logStructured('debug', 'Cache cleanup', { cleaned, remaining: memoryCache.size })
  }
}

/**
 * Cache wrapper for async functions
 */
export function withCache<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  config: CacheConfig
) {
  return async (...args: Args): Promise<T> => {
    if (config.skipCache) {
      return fn(...args)
    }

    const key = keyGenerator(...args)
    const cached = await get<T>(key)

    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    await set(key, result, config)
    return result
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  hits: number
  misses: number
  evictions: number
  hitRate: number
  memorySize: number
} {
  const total = stats.hits + stats.misses
  return {
    ...stats,
    hitRate: total > 0 ? Math.round((stats.hits / total) * 100) : 0,
    memorySize: memoryCache.size,
  }
}

/**
 * Common cache tags
 */
export const CacheTags = {
  TENANT: 'tenant',
  USER: 'user',
  BOOKING: 'booking',
  AVAILABILITY: 'availability',
  NOTIFICATION_SETTINGS: 'notification-settings',
  SUBSCRIPTION: 'subscription',
  ANALYTICS: 'analytics',
} as const

/**
 * Common TTL values (seconds)
 */
export const CacheTTL = {
  SHORT: 60,      // 1 minute
  MEDIUM: 300,    // 5 minutes
  LONG: 3600,     // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const
