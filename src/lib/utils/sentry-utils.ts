// Stub implementation to avoid Sentry imports in App Router
export interface SentryContext {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  userAgent?: string;
  route?: string;
  action?: string;
  [key: string]: any;
}

export interface SentryPerformanceMetric {
  name: string;
  value: number;
  unit: 'milliseconds' | 'seconds' | 'bytes' | 'count';
  tags?: Record<string, string>;
}

export class SentryUtils {
  static setUserContext(userId: string, organizationId?: string, email?: string) {
    // Stub - log to console instead
    console.debug('SentryUtils.setUserContext', { userId, organizationId, email });
  }

  static clearUserContext() {
    console.debug('SentryUtils.clearUserContext');
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: SentryContext) {
    console.debug('SentryUtils.captureMessage', { message, level, context });
  }

  static captureException(error: Error, context?: SentryContext) {
    console.error('SentryUtils.captureException', error, context);
  }

  static captureAPIError(error: Error, request: {
    method: string;
    url: string;
    statusCode?: number;
    userId?: string;
    organizationId?: string;
  }) {
    console.error('SentryUtils.captureAPIError', error, request);
  }

  static captureSSRError(error: Error, pageProps: {
    route: string;
    params?: Record<string, any>;
    userId?: string;
    organizationId?: string;
  }) {
    console.error('SentryUtils.captureSSRError', error, pageProps);
  }

  static trackPerformance(metric: SentryPerformanceMetric) {
    console.debug('SentryUtils.trackPerformance', metric);
  }

  static startTransaction(name: string, operation: string, context?: SentryContext) {
    console.debug('SentryUtils.startTransaction', { name, operation, context });
    return { name, operation, startTime: Date.now() };
  }

  static withTransaction<T>(
    name: string, 
    operation: string, 
    callback: (transaction: any) => Promise<T>,
    context?: SentryContext
  ): Promise<T> {
    const transaction = this.startTransaction(name, operation, context);
    
    return callback(transaction)
      .then(result => {
        console.debug('SentryUtils.withTransaction completed', { name, operation, duration: Date.now() - transaction.startTime });
        return result;
      })
      .catch(error => {
        this.captureException(error, context);
        console.debug('SentryUtils.withTransaction failed', { name, operation, duration: Date.now() - transaction.startTime });
        throw error;
      });
  }

  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    console.debug('SentryUtils.addBreadcrumb', { message, category, data });
  }

  static setTag(key: string, value: string) {
    console.debug('SentryUtils.setTag', { key, value });
  }

  static setContext(key: string, context: Record<string, any>) {
    console.debug('SentryUtils.setContext', { key, context });
  }

  static wrapAPIHandler<T extends any[]>(
    handler: (...args: T) => Promise<Response>,
    options?: {
      operationName?: string;
      extractContext?: (...args: T) => SentryContext;
    }
  ) {
    return async (...args: T): Promise<Response> => {
      const operationName = options?.operationName || 'api-handler';
      const context = options?.extractContext?.(...args);
      const startTime = Date.now();

      try {
        console.debug('SentryUtils.wrapAPIHandler start', { operationName, context });
        const result = await handler(...args);
        
        console.debug('SentryUtils.wrapAPIHandler success', {
          operationName,
          context,
          duration: Date.now() - startTime,
        });
        
        return result;
      } catch (error) {
        if (error instanceof Error) {
          this.captureException(error, {
            ...context,
            duration: Date.now() - startTime,
          });
        }
        throw error;
      }
    };
  }

  static trackWebhookEvent(eventType: string, success: boolean, context?: {
    eventId?: string;
    retryCount?: number;
    processingTime?: number;
  }) {
    console.debug('SentryUtils.trackWebhookEvent', { eventType, success, context });

    if (!success) {
      console.warn('SentryUtils.trackWebhookEvent failed', { eventType, context });
    }
  }
}

// Convenience exports
export const {
  setUserContext,
  clearUserContext,
  captureMessage,
  captureException,
  captureAPIError,
  captureSSRError,
  trackPerformance,
  startTransaction,
  withTransaction,
  addBreadcrumb,
  setTag,
  setContext,
  wrapAPIHandler,
  trackWebhookEvent,
} = SentryUtils;