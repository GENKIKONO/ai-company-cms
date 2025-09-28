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
  
  // Enhanced error filtering for client
  beforeSend(event, hint) {
    // Filter out hydration errors and other non-critical errors
    if (event.exception?.values?.[0]?.value?.includes('Hydration')) {
      return null;
    }
    
    // Filter out network errors from user's connection issues
    if (event.exception?.values?.[0]?.value?.includes('Network')) {
      return null;
    }
    
    // Filter out ResizeObserver errors (browser quirks)
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null;
    }
    
    // Filter out script loading errors (ad blockers, etc.)
    if (event.exception?.values?.[0]?.value?.includes('Loading chunk')) {
      return null;
    }
    
    // Add client context
    if (event.contexts) {
      event.contexts.browser = {
        name: navigator?.userAgent || 'unknown',
        viewport: {
          width: window?.innerWidth || 0,
          height: window?.innerHeight || 0,
        },
      };
    }
    
    return event;
  },
  
  // Custom tags and context
  initialScope: {
    tags: {
      component: 'client',
      runtime: 'browser',
    },
    contexts: {
      app: {
        name: 'luxucare-cms',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      },
    },
  },
  
  // Performance monitoring
  profilesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.05 : 0.2,
  
  // Enhanced integrations - using correct import paths
  integrations: [],
});