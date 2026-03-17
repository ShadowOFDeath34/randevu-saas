/**
 * Rate Limiting Module - Redis Edition
 * API endpoint'leri için rate limiting
 * Vercel Edge Runtime uyumlu
 *
 * Redis (Upstash) entegrasyonu ile production-ready
 * Fallback: Memory-based store (development/local)
 */

import { Redis } from '@upstash/redis'
import { db } from '@/lib/db'

// Redis client - lazy initialization
let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[RateLimit] Redis not configured, using memory store')
    return null
  }

  redis = new Redis({
    url,
    token
  })

  return redis
}

export interface RateLimitConfig {
  windowMs: number // Zaman penceresi (ms)
  maxRequests: number // Maksimum istek sayisi
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

export interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

// Memory store - fallback için
const rateLimitStore = new Map<string, RateLimitEntry>()

// Periyodik temizleme (memory leak onleme) - sadece memory modda
if (typeof global !== 'undefined' && !getRedisClient()) {
  setInterval(() => {
    cleanupOldRecords()
  }, 5 * 60 * 1000) // 5 dakikada bir
}

// Varsayilan config'ler
export const defaultConfigs = {
  // Auth endpoint'leri için - agresif limit
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 15 dakika, 5 deneme

  // Public API için - orta limit
  public: { windowMs: 60 * 1000, maxRequests: 10 }, // 1 dakika, 10 istek

  // Portal için - orta limit
  portal: { windowMs: 60 * 1000, maxRequests: 10 }, // 1 dakika, 10 istek

  // Booking API için - yuksek limit
  booking: { windowMs: 60 * 1000, maxRequests: 5 }, // 1 dakika, 5 istek

  // Genel API için - yuksek limit
  api: { windowMs: 60 * 1000, maxRequests: 60 }, // 1 dakika, 60 istek

  // AI Chat için - yuksek limit (kullanici dostu)
  ai: { windowMs: 60 * 1000, maxRequests: 20 }, // 1 dakika, 20 istek
}

/**
 * Rate limit kontrolu - Redis veya Memory bazli
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowKey = Math.floor(now / config.windowMs)
  const key = `ratelimit:${identifier}:${windowKey}`

  const redisClient = getRedisClient()

  try {
    if (redisClient) {
      // Redis-based rate limiting
      return await checkRedisRateLimit(redisClient, key, config, now)
    } else {
      // Memory-based rate limiting (fallback)
      return checkMemoryRateLimit(key, config, now)
    }
  } catch (error) {
    console.error('[RateLimit] Error:', error)
    // Hata durumunda izin ver (fail open)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: 1,
      resetTime: now + config.windowMs
    }
  }
}

/**
 * Redis-based rate limiting
 */
async function checkRedisRateLimit(
  redisClient: Redis,
  key: string,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitResult> {
  const resetTime = now + config.windowMs

  // INCR komutu ile atomik artır
  const current = await redisClient.incr(key)

  // İlk istek ise TTL ayarla
  if (current === 1) {
    await redisClient.expire(key, Math.ceil(config.windowMs / 1000))
  }

  const remaining = config.maxRequests - current

  return {
    success: current <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, remaining),
    resetTime
  }
}

/**
 * Memory-based rate limiting (fallback)
 */
function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  const record = rateLimitStore.get(key)
  const resetTime = now + config.windowMs

  if (!record || now > record.resetTime) {
    // Yeni pencere baslat
    const newRecord: RateLimitEntry = {
      count: 1,
      resetTime,
      firstRequest: now
    }
    rateLimitStore.set(key, newRecord)

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: record.resetTime
    }
  }

  record.count++
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * IP bazli rate limit kontrolu
 */
export async function checkIPRateLimit(
  req: Request,
  config: RateLimitConfig = defaultConfigs.api
): Promise<RateLimitResult> {
  const ip = getClientIP(req)
  return checkRateLimit(`ip:${ip}`, config)
}

/**
 * User bazli rate limit kontrolu
 */
export async function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig = defaultConfigs.api
): Promise<RateLimitResult> {
  return checkRateLimit(`user:${userId}`, config)
}

/**
 * Telefon bazli rate limit kontrolu (SMS gonderim için)
 */
export async function checkPhoneRateLimit(
  phone: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 3 }
): Promise<RateLimitResult> {
  return checkRateLimit(`phone:${phone.replace(/\D/g, '')}`, config)
}

/**
 * E-posta bazli rate limit kontrolu
 */
export async function checkEmailRateLimit(
  email: string,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 3 }
): Promise<RateLimitResult> {
  return checkRateLimit(`email:${email.toLowerCase()}`, config)
}

/**
 * Client IP adresini al
 */
export function getClientIP(req: Request): string {
  // Vercel'de X-Forwarded-For header'i kullanilir
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  // Fallback
  return req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Eski kayitlari temizle (memory store için)
 */
function cleanupOldRecords(): void {
  const now = Date.now()
  let cleaned = 0
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }
  if (cleaned > 0) {
    console.log(`[RateLimit] Cleanup: ${cleaned} eski kayit silindi`)
  }
}

/**
 * Rate limit headers olustur
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': result.resetTime.toString()
  }
}

/**
 * Rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      error: 'Cok fazla istek. Lutfen daha sonra tekrar deneyin.',
      retryAfter,
      limit: result.limit,
      remaining: result.remaining
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...getRateLimitHeaders(result)
      }
    }
  )
}

/**
 * Rate limit status kontrolu (read-only, sayac artirmaz)
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowKey = Math.floor(now / config.windowMs)
  const key = `ratelimit:${identifier}:${windowKey}`

  const redisClient = getRedisClient()

  try {
    if (redisClient) {
      const current = await redisClient.get<number>(key) || 0
      const resetTime = now + config.windowMs

      return {
        success: current < config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - current),
        resetTime
      }
    } else {
      // Memory-based
      const record = rateLimitStore.get(key)

      if (!record || now > record.resetTime) {
        return {
          success: true,
          limit: config.maxRequests,
          remaining: config.maxRequests,
          resetTime: now + config.windowMs
        }
      }

      return {
        success: record.count < config.maxRequests,
        limit: config.maxRequests,
        remaining: Math.max(0, config.maxRequests - record.count),
        resetTime: record.resetTime
      }
    }
  } catch (error) {
    console.error('[RateLimit] Status check error:', error)
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    }
  }
}
