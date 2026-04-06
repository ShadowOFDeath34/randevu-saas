/**
 * Monitoring ve Error Tracking Utility
 * Sentry entegrasyonu, performance tracking ve logging
 */

import * as Sentry from '@sentry/nextjs'

// Performance metric tracking
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: string
  metadata?: Record<string, unknown>
}

const metrics: PerformanceMetric[] = []

/**
 * Track API endpoint performance
 */
export async function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    // Store metric
    metrics.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, success: true },
    })

    // Send to Sentry if slow
    if (duration > 1000) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow operation: ${name}`,
        data: { duration, ...metadata },
        level: 'warning',
      })
    }

    // Clean old metrics (keep last 100)
    if (metrics.length > 100) {
      metrics.shift()
    }

    return result
  } catch (error) {
    const duration = performance.now() - start

    metrics.push({
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, success: false, error: (error as Error).message },
    })

    // Report to Sentry
    Sentry.captureException(error, {
      tags: { operation: name },
      extra: { duration, ...metadata },
    })

    throw error
  }
}

/**
 * Get recent performance metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics]
}

/**
 * Get average response time for an operation
 */
export function getAverageResponseTime(name: string, limit = 10): number {
  const relevant = metrics
    .filter((m) => m.name === name)
    .slice(-limit)

  if (relevant.length === 0) return 0

  const sum = relevant.reduce((acc, m) => acc + m.duration, 0)
  return sum / relevant.length
}

/**
 * Log structured message for debugging
 */
export function logStructured(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  }

  // Console output
  const logFn = level === 'error' ? console.error :
    level === 'warn' ? console.warn :
    level === 'debug' ? console.debug :
    console.log

  logFn(JSON.stringify(logEntry))

  // Send errors to Sentry
  if (level === 'error') {
    Sentry.captureMessage(message, {
      level: 'error',
      extra: data,
    })
  }
}

/**
 * Track business event (booking, payment, etc.)
 */
export function trackBusinessEvent(
  eventName: string,
  properties: Record<string, unknown>
): void {
  logStructured('info', `Business event: ${eventName}`, properties)

  // Add to Sentry breadcrumbs
  Sentry.addBreadcrumb({
    category: 'business',
    message: eventName,
    data: properties,
  })
}

/**
 * Create API handler wrapper with monitoring
 */
export function withMonitoring<T extends (...args: unknown[]) => Promise<Response>>(
  name: string,
  handler: T
): T {
  return (async (...args: unknown[]) => {
    const start = performance.now()

    try {
      const response = await handler(...args)
      const duration = performance.now() - start

      // Log successful request
      logStructured('debug', `API Request: ${name}`, {
        duration,
        status: response.status,
      })

      return response
    } catch (error) {
      const duration = performance.now() - start

      // Log error
      logStructured('error', `API Error: ${name}`, {
        duration,
        error: (error as Error).message,
      })

      throw error
    }
  }) as T
}

/**
 * Track database query performance
 */
export async function trackQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  return trackPerformance(`db:${queryName}`, queryFn, { type: 'database' })
}

/**
 * Track external API call
 */
export async function trackExternalAPI<T>(
  apiName: string,
  callFn: () => Promise<T>,
  endpoint?: string
): Promise<T> {
  return trackPerformance(`api:${apiName}`, callFn, {
    type: 'external_api',
    endpoint,
  })
}
