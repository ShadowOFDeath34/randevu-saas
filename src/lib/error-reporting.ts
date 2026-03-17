/**
 * Error Reporting Utility
 * Sentry entegrasyonu için merkezi hata raporlama
 */

import * as Sentry from '@sentry/nextjs'

interface ErrorContext {
  userId?: string
  tenantId?: string
  [key: string]: unknown
}

/**
 * Hata raporla - Sentry'e gönder
 */
export function reportError(
  error: Error | string,
  context?: ErrorContext
): void {
  const errorObj = error instanceof Error ? error : new Error(error)

  Sentry.withScope((scope) => {
    // Context bilgilerini ekle
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }

    // User bilgisi varsa ekle
    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }

    Sentry.captureException(errorObj)
  })
}

/**
 * Bilgi mesajı gönder
 */
export function reportMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  Sentry.withScope((scope) => {
    scope.setLevel(level)

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }

    Sentry.captureMessage(message)
  })
}

/**
 * API hatası raporla
 */
export function reportAPIError(
  endpoint: string,
  error: Error,
  req?: Request,
  context?: ErrorContext
): void {
  Sentry.withScope((scope) => {
    scope.setTag('endpoint', endpoint)
    scope.setTag('method', req?.method || 'UNKNOWN')

    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }

    Sentry.captureException(error)
  })
}

/**
 * Breadcrumb ekle (hata öncesi adımları kaydet)
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
  })
}
