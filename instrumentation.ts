export async function register() {
  // Environment validation on startup
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startupEnvCheck } = await import('./src/lib/env');
    const envValid = startupEnvCheck();
    
    if (!envValid && process.env.NODE_ENV === 'production') {
      console.error('🚨 Application startup blocked due to critical environment variable issues');
      process.exit(1);
    }
    
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(err: unknown, request: { method: string; url: string }, info: { componentStack?: string }) {
  // Only import Sentry when needed
  const Sentry = await import('@sentry/nextjs');
  
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request_method: request.method,
        request_url: request.url,
        component_stack: info.componentStack,
      },
    },
    tags: {
      source: 'request_error',
    },
  });
}