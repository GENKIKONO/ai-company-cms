import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Tracing (reduced for edge)
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.05 : 0.5,
  
  // Debug mode
  debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  
  // Only run in production or staging
  enabled: ['production', 'staging'].includes(process.env.NEXT_PUBLIC_APP_ENV || ''),
  
  // Set release and environment
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'edge',
    },
  },
});