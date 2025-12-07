import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 0.05 : 0.2,
  
  // Debug mode
  debug: process.env.NEXT_PUBLIC_APP_ENV === 'development',
  
  // Only run in production or staging
  enabled: ['production', 'staging'].includes(process.env.NEXT_PUBLIC_APP_ENV || ''),
  
  // Set release and environment
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
  environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  
  // Enhanced error filtering for server
  beforeSend(event, hint) {
    // Filter out database connection timeouts (user connection issues)
    if (event.exception?.values?.[0]?.value?.includes('connection timeout')) {
      return null;
    }
    
    // Filter out CORS preflight errors
    if (event.exception?.values?.[0]?.value?.includes('CORS')) {
      return null;
    }
    
    // Add server context
    if (event.contexts) {
      event.contexts.server = {
        runtime: 'nodejs',
        version: process.version,
      };
    }
    
    return event;
  },
  
  // Custom tags
  initialScope: {
    tags: {
      component: 'server',
      runtime: 'nodejs',
    },
    contexts: {
      app: {
        name: 'ai-company-cms',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      },
    },
  },
  
  // Enhanced integrations for Node.js
  integrations: [],
});