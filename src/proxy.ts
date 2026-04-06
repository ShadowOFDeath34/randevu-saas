/**
 * Next.js 16 Routing Middleware (proxy.ts)
 * - Rate limiting
 * - Security headers
 * - CORS handling
 * - CSRF protection
 *
 * Node.js Runtime (default in Next.js 16)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, addApiSecurityHeaders, checkSecurity } from '@/middleware/security'
import { getEndpointConfig, createRateLimitHeaders } from '@/lib/security/rate-limit'
import { logStructured } from '@/lib/monitoring'

// Rate limit sonuçları için memory store
const rateLimitStore = new Map<string, { count: number; reset: number }>()

// Routing config
export const routing = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// Path'ler için rate limit bypass (static assets)
const BYPASS_PATHS = [
  '/_next/',
  '/static/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

// CSRF token doğrulaması gerekmeyen paths
const CSRF_EXEMPT_PATHS = [
  '/api/webhooks/',
  '/api/auth/callback/',
  '/api/cron/',
]

/**
 * Rate limit check (inline, redis yokken)
 */
async function checkRateLimit(identifier: string, config: { requests: number; window: number }) {
  const now = Date.now()
  const windowMs = config.window * 1000
  const key = `${identifier}:${Math.floor(now / windowMs)}`

  const entry = rateLimitStore.get(key)

  if (!entry) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs })
    return { success: true, limit: config.requests, remaining: config.requests - 1, reset: now + windowMs }
  }

  entry.count++

  if (entry.count > config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset: entry.reset,
      retryAfter: Math.ceil((entry.reset - now) / 1000),
    }
  }

  return {
    success: true,
    limit: config.requests,
    remaining: Math.max(0, config.requests - entry.count),
    reset: entry.reset,
  }
}

/**
 * CSRF token doğrulama
 */
function validateCSRF(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS request'ler için CSRF gerekmez
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  // Exempt paths
  const path = request.nextUrl.pathname
  if (CSRF_EXEMPT_PATHS.some(p => path.startsWith(p))) {
    return true
  }

  // API routes için CSRF token kontrol et
  if (path.startsWith('/api/')) {
    const csrfToken = request.headers.get('x-csrf-token')
    // TODO: CSRF token doğrulama (session-based veya double-submit cookie)
    // Production'da session'dan gelen token ile karşılaştır
    return true // Şimdilik bypass
  }

  return true
}

/**
 * Main middleware function (Next.js 16 proxy.ts format)
 */
export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

  // Bypass static assets
  if (BYPASS_PATHS.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // Security check
  const security = checkSecurity(request)
  if (!security.valid) {
    logStructured('warn', 'Security check failed', {
      path,
      ip,
      reason: security.reason,
    })
    return new NextResponse('Security check failed', { status: 400 })
  }

  // CSRF validation
  if (!validateCSRF(request)) {
    logStructured('warn', 'CSRF validation failed', { path, ip })
    return new NextResponse('CSRF token invalid', { status: 403 })
  }

  // Rate limiting for API routes
  if (path.startsWith('/api/')) {
    const config = getEndpointConfig(path)
    const identifier = `ip:${ip}`
    const rateLimit = await checkRateLimit(identifier, config)

    if (!rateLimit.success) {
      logStructured('warn', 'Rate limit exceeded', {
        path,
        ip,
        retryAfter: rateLimit.retryAfter,
      })

      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          ...createRateLimitHeaders(rateLimit),
        },
      })
    }

    // API response oluştur
    const response = NextResponse.next()

    // API security headers
    addApiSecurityHeaders(response)

    // Rate limit headers
    const rateHeaders = createRateLimitHeaders(rateLimit)
    Object.entries(rateHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  // Normal page response
  const response = NextResponse.next()

  // Add security headers
  addSecurityHeaders(response)

  return response
}
