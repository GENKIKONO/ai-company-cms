import * as Sentry from '@sentry/nextjs';

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
    Sentry.setUser({
      id: userId,
      email,
      organizationId,
    });
    
    Sentry.setTag('organization.id', organizationId || 'none');
  }

  static clearUserContext() {
    Sentry.setUser(null);
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: SentryContext) {
    if (context) {
      this.withContext(context, () => {
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  static captureException(error: Error, context?: SentryContext) {
    if (context) {
      this.withContext(context, () => {
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  static captureAPIError(error: Error, request: {
    method: string;
    url: string;
    statusCode?: number;
    userId?: string;
    organizationId?: string;
  }) {
    this.withContext({
      api: {
        method: request.method,
        url: request.url,
        statusCode: request.statusCode,
      },
      userId: request.userId,
      organizationId: request.organizationId,
    }, () => {
      Sentry.captureException(error);
    });
  }

  static captureSSRError(error: Error, pageProps: {
    route: string;
    params?: Record<string, any>;
    userId?: string;
    organizationId?: string;
  }) {
    this.withContext({
      ssr: {
        route: pageProps.route,
        params: pageProps.params,
      },
      userId: pageProps.userId,
      organizationId: pageProps.organizationId,
    }, () => {
      Sentry.captureException(error);
    });
  }

  static trackPerformance(metric: SentryPerformanceMetric) {
    // Add as breadcrumb for context
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metric.name}: ${metric.value}${metric.unit}`,
      level: 'info',
      data: metric.tags,
    });

    // Set metric with tags
    if (metric.tags) {
      Object.entries(metric.tags).forEach(([key, value]) => {
        Sentry.setTag(key, value);
      });
    }
  }

  static startTransaction(name: string, operation: string, context?: SentryContext) {
    // Add breadcrumb for transaction start
    this.addBreadcrumb(`Starting ${operation}: ${name}`, 'transaction');
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        if (typeof value === 'string') {
          Sentry.setTag(key, value);
        } else {
          Sentry.setContext(key, value);
        }
      });
    }

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
        this.addBreadcrumb(`Completed ${operation}: ${name}`, 'transaction', {
          duration: Date.now() - transaction.startTime,
          status: 'success'
        });
        return result;
      })
      .catch(error => {
        this.captureException(error, context);
        this.addBreadcrumb(`Failed ${operation}: ${name}`, 'transaction', {
          duration: Date.now() - transaction.startTime,
          status: 'error'
        });
        throw error;
      });
  }

  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
      data,
    });
  }

  static setTag(key: string, value: string) {
    Sentry.setTag(key, value);
  }

  static setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context);
  }

  private static withContext(context: SentryContext, callback: () => void) {
    Sentry.withScope(scope => {
      Object.entries(context).forEach(([key, value]) => {
        if (key === 'userId' && value) {
          scope.setUser({ id: value });
        } else if (typeof value === 'string') {
          scope.setTag(key, value);
        } else if (typeof value === 'object' && value !== null) {
          scope.setContext(key, value);
        }
      });
      
      callback();
    });
  }

  // API Route wrapper with automatic error tracking
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
        this.addBreadcrumb(`API Handler: ${operationName}`, 'http', context);
        const result = await handler(...args);
        
        this.addBreadcrumb(`API Success: ${operationName}`, 'http', {
          ...context,
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

  // Webhook monitoring integration
  static trackWebhookEvent(eventType: string, success: boolean, context?: {
    eventId?: string;
    retryCount?: number;
    processingTime?: number;
  }) {
    this.addBreadcrumb(
      `Webhook ${eventType} ${success ? 'succeeded' : 'failed'}`,
      'webhook',
      context
    );

    if (context?.processingTime) {
      this.trackPerformance({
        name: 'webhook.processing_time',
        value: context.processingTime,
        unit: 'milliseconds',
        tags: {
          event_type: eventType,
          success: success.toString(),
        },
      });
    }

    if (!success) {
      this.captureMessage(
        `Webhook processing failed: ${eventType}`,
        'warning',
        {
          webhook: {
            eventType,
            eventId: context?.eventId,
            retryCount: context?.retryCount,
          },
        }
      );
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