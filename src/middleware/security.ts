/**
 * Security Headers Middleware
 * CSP, HSTS, X-Frame-Options ve diğer güvenlik header'ları
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// CSP Directive'ları
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Next.js için gerekli
    "'unsafe-eval'",   // Next.js için gerekli
    'https://*.vercel-scripts.com',
    'https://*.sentry.io',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // CSS-in-JS için
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.vercel.app',
    'https://*.vercel-storage.com',
    'https://res.cloudinary.com',
    'https://images.unsplash.com',
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://*.vercel.app',
    'https://*.sentry.io',
    'https://api.resend.com',
    'https://*.iyzipay.com',
    'https://*.upstash.io',
  ],
  'frame-src': [
    "'self'",
    'https://*.iyzipay.com', // iyzico ödeme iframe
  ],
  'frame-ancestors': ["'none'"], // Clickjacking önleme
  'form-action': ["'self'"],
  'base-uri': ["'self'"],
  'manifest-src': ["'self'"],
}

// CSP nonce için (opsiyonel - daha güvenli)
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

/**
 * CSP header string oluştur
 */
export function buildCSPHeader(nonce?: string): string {
  const directives = { ...CSP_DIRECTIVES }

  // Nonce varsa script-src'e ekle
  if (nonce) {
    directives['script-src'] = [
      "'self'",
      `'nonce-${nonce}'`,
      'https://*.vercel-scripts.com',
      'https://*.sentry.io',
    ]
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/**
 * Security headers ekle
 */
export function addSecurityHeaders(
  response: NextResponse,
  options?: { nonce?: string }
): NextResponse {
  const CSP = buildCSPHeader(options?.nonce)

  // Security Headers
  response.headers.set('Content-Security-Policy', CSP)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')

  // HSTS - Production'da aktif
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Remove server fingerprinting
  response.headers.delete('X-Powered-By')

  return response
}

/**
 * API routes için security headers
 */
export function addApiSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // API'lerde CSP gerekmez ama ekleyelim (defense in depth)
  response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")

  return response
}

/**
 * CORS headers ekle
 */
export function addCorsHeaders(
  response: NextResponse,
  allowedOrigins: string[] = []
): NextResponse {
  const origin = allowedOrigins.length > 0
    ? allowedOrigins.join(', ')
    : process.env.NEXT_PUBLIC_APP_URL || '*'

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}

/**
 * Request security check
 */
export function checkSecurity(request: NextRequest): { valid: boolean; reason?: string } {
  // Method check
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  if (!validMethods.includes(request.method)) {
    return { valid: false, reason: 'Invalid HTTP method' }
  }

  // Content-Type bomb check (DOS protection)
  const contentLength = parseInt(request.headers.get('content-length') || '0')
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return { valid: false, reason: 'Request too large' }
  }

  // Host header validation (prevent host header injection)
  const host = request.headers.get('host')
  if (!host) {
    return { valid: false, reason: 'Missing host header' }
  }

  return { valid: true }
}
