import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Session Replay
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of all sessions,
      // plus 100% of sessions with an error
      sessionSampleRate: 0.1,
      errorSampleRate: 1.0,
    }),
  ],
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release Health
  autoSessionTracking: true,
  
  // Debug
  debug: process.env.NODE_ENV === 'development',
  
  // Filtering
  beforeSend(event) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development' && event.exception) {
      return null;
    }
    return event;
  },
});