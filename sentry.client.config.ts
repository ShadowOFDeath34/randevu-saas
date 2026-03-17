import * as Sentry from '@sentry/nextjs'

// Sentry Client-side configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out errors that are not actionable
  beforeSend(event) {
    // Filter out known non-actionable errors
    const nonActionableErrors = [
      'ResizeObserver loop limit exceeded',
      'Network Error',
      'Failed to fetch',
      'AbortError',
    ]

    const errorMessage = event.exception?.values?.[0]?.value || ''

    if (nonActionableErrors.some(err => errorMessage.includes(err))) {
      return null
    }

    return event
  },

  // Environment tag
  environment: process.env.NODE_ENV || 'development',
})
