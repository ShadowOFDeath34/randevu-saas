import * as Sentry from '@sentry/nextjs'

// Sentry Server-side configuration
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Environment tag
  environment: process.env.NODE_ENV || 'development',

  // Server-side integrations
  integrations: [
    // Add any server-specific integrations here
  ],

  // Filter out errors that are not actionable
  beforeSend(event) {
    // Filter out known non-actionable errors
    const nonActionableErrors = [
      'ResizeObserver loop limit exceeded',
      'Network Error',
      'Failed to fetch',
      'AbortError',
      'ECONNREFUSED',
      'ETIMEDOUT',
    ]

    const errorMessage = event.exception?.values?.[0]?.value || ''

    if (nonActionableErrors.some(err => errorMessage.includes(err))) {
      return null
    }

    return event
  },
})
