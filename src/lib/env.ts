import { z } from 'zod'

/**
 * Environment Variable Validasyon
 *
 * Bu modül tüm environment variable'ları validasyon yapar.
 * Eksik veya hatalı değişken olduğunda uygulama başlamadan hata verir.
 *
 * Kullanım:
 *   import { env } from '@/lib/env'
 *   const dbUrl = env.DATABASE_URL
 */

// Zorunlu environment variable'lar
const requiredEnvVars = {
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // iyzico (en az sandbox değerleri olmalı)
  IYZIPAY_API_KEY: z.string().min(1, 'IYZIPAY_API_KEY is required'),
  IYZIPAY_SECRET_KEY: z.string().min(1, 'IYZIPAY_SECRET_KEY is required'),
  IYZIPAY_BASE_URL: z.string().url('IYZIPAY_BASE_URL must be a valid URL'),
} as const

// Opsiyonel environment variable'lar (varsa validasyon yap)
const optionalEnvVars = {
  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_').optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email').optional(),
  EMAIL_REPLY_TO: z.string().email('EMAIL_REPLY_TO must be a valid email').optional(),

  // SMS
  NETGSM_USERCODE: z.string().optional(),
  NETGSM_PASSWORD: z.string().optional(),
  NETGSM_MSGHEADER: z.string().max(11, 'NETGSM_MSGHEADER max 11 characters').optional(),

  // WhatsApp
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC', 'TWILIO_ACCOUNT_SID must start with AC').optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_NUMBER: z.string().startsWith('whatsapp:', 'TWILIO_WHATSAPP_NUMBER must start with whatsapp:').optional(),

  // Redis (Production için zorunlu)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL must be a valid URL').optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('NEXT_PUBLIC_SENTRY_DSN must be a valid URL').optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // AI
  GOOGLE_AI_API_KEY: z.string().startsWith('AIza', 'GOOGLE_AI_API_KEY must start with AIza').optional(),

  // Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().startsWith('G-').optional(),

  // Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Test
  TEST_USER_EMAIL: z.string().email().optional(),
  TEST_USER_PASSWORD: z.string().min(8).optional(),

  // Advanced
  PRISMA_ACCELERATE_URL: z.string().startsWith('prisma://').optional(),
  RATE_LIMIT_ENABLED: z.enum(['true', 'false']).optional(),
  RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().regex(/^\d+$/).optional(),
  NEXT_PUBLIC_ENABLE_AI_FEATURES: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.enum(['true', 'false']).optional(),
  CACHE_TTL: z.string().regex(/^\d+$/).optional(),

  // Security
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  CSP_NONCE_SECRET: z.string().optional(),

  // Cron Jobs
  CRON_SECRET: z.string().optional(),
  CRON_API_KEY: z.string().optional(),
} as const

// Tüm env schema'sını birleştir
const envSchema = z.object({
  ...requiredEnvVars,
  ...optionalEnvVars,
})

// Type inference
type Env = z.infer<typeof envSchema>

/**
 * Environment variable'ları validasyon yap
 * Bu fonksiyon server-side'da çağrılmalı (client'ta kullanılamaz)
 */
function validateEnv(): Env {
  // Server-side only
  if (typeof window !== 'undefined') {
    throw new Error('Environment validation can only be done server-side')
  }

  // Process.env'yi al
  const env = process.env

  // Validasyon yap
  const result = envSchema.safeParse(env)

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
    )

    console.error('❌ Environment variable errors:')
    console.error(errors.join('\n'))

    throw new Error(
      `Invalid environment variables:\n${errors.join('\n')}\n\n` +
      `Please check your .env file or environment configuration.`
    )
  }

  return result.data
}

// Lazy initialization (ilk erişimde validasyon yapılır)
let validatedEnv: Env | null = null

export function getEnv(): Env {
  if (!validatedEnv) {
    validatedEnv = validateEnv()
  }
  return validatedEnv
}

// Export typed env (bu şekilde kullanım: env.DATABASE_URL)
export const env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env]
  },
})

/**
 * Environment değişkeninin production'da olup olmadığını kontrol et
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Environment değişkeninin development'ta olup olmadığını kontrol et
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Feature flag kontrolü
 */
export function isFeatureEnabled(flag: 'ai' | 'analytics' | 'rateLimit'): boolean {
  const flags = {
    ai: process.env.NEXT_PUBLIC_ENABLE_AI_FEATURES === 'true',
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    rateLimit: process.env.RATE_LIMIT_ENABLED === 'true',
  }
  return flags[flag] ?? false
}

/**
 * Redis'in yapılandırılıp yapılandırılmadığını kontrol et
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

/**
 * Email servisinin yapılandırılıp yapılandırılmadığını kontrol et
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * SMS servisinin yapılandırılıp yapılandırılmadığını kontrol et
 */
export function isSMSConfigured(): boolean {
  return !!(
    process.env.NETGSM_USERCODE &&
    process.env.NETGSM_PASSWORD
  )
}

/**
 * Sentry'nin yapılandırılıp yapılandırılmadığını kontrol et
 */
export function isSentryConfigured(): boolean {
  return !!process.env.SENTRY_DSN
}

/**
 * Google AI (Gemini) yapılandırılmış mı kontrol et
 */
export function isAIConfigured(): boolean {
  return !!process.env.GOOGLE_AI_API_KEY
}

/**
 * Tüm kritik servislerin durumunu kontrol et
 * Health check endpoint'leri için kullanılabilir
 */
export function getServiceHealth(): {
  database: boolean
  redis: boolean
  email: boolean
  sms: boolean
  sentry: boolean
  ai: boolean
} {
  return {
    database: !!process.env.DATABASE_URL,
    redis: isRedisConfigured(),
    email: isEmailConfigured(),
    sms: isSMSConfigured(),
    sentry: isSentryConfigured(),
    ai: isAIConfigured(),
  }
}
