import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Tracing
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture 100% of the transactions for performance monitoring
  debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  
  // Only run in production or staging
  enabled: ['production', 'staging'].includes(process.env.NEXT_PUBLIC_APP_ENV || ''),
  
  // Set release and environment
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // Filter out noisy errors
  beforeSend(event, hint) {
    // Filter out hydration errors and other non-critical errors
    if (event.exception?.values?.[0]?.value?.includes('Hydration')) {
      return null;
    }
    
    // Filter out network errors from user's connection issues
    if (event.exception?.values?.[0]?.value?.includes('Network')) {
      return null;
    }
    
    return event;
  },
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});