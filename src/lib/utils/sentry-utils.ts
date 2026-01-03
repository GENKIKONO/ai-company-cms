// Stub implementation to avoid Sentry imports in App Router
import { logger } from '@/lib/utils/logger';

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
    // Stub - log instead
    logger.debug('SentryUtils.setUserContext', { data: { userId, organizationId, email } });
  }

  static clearUserContext() {
    logger.debug('SentryUtils.clearUserContext');
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: SentryContext) {
    logger.debug('SentryUtils.captureMessage', { data: { message, level, context } });
  }

  static captureException(error: Error, context?: SentryContext) {
    logger.error('SentryUtils.captureException', { data: { error, context } });
  }

  static captureAPIError(error: Error, request: {
    method: string;
    url: string;
    statusCode?: number;
    userId?: string;
    organizationId?: string;
  }) {
    logger.error('SentryUtils.captureAPIError', { data: { error, request } });
  }

  static captureSSRError(error: Error, pageProps: {
    route: string;
    params?: Record<string, any>;
    userId?: string;
    organizationId?: string;
  }) {
    logger.error('SentryUtils.captureSSRError', { data: { error, pageProps } });
  }

  static trackPerformance(metric: SentryPerformanceMetric) {
    logger.debug('SentryUtils.trackPerformance', { data: metric });
  }

  static startTransaction(name: string, operation: string, context?: SentryContext) {
    logger.debug('SentryUtils.startTransaction', { data: { name, operation, context } });
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
        logger.debug('SentryUtils.withTransaction completed', { data: { name, operation, duration: Date.now() - transaction.startTime } });
        return result;
      })
      .catch(error => {
        this.captureException(error, context);
        logger.debug('SentryUtils.withTransaction failed', { data: { name, operation, duration: Date.now() - transaction.startTime } });
        throw error;
      });
  }

  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    logger.debug('SentryUtils.addBreadcrumb', { data: { message, category, breadcrumbData: data } });
  }

  static setTag(key: string, value: string) {
    logger.debug('SentryUtils.setTag', { data: { key, value } });
  }

  static setContext(key: string, context: Record<string, any>) {
    logger.debug('SentryUtils.setContext', { data: { key, context } });
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
        logger.debug('SentryUtils.wrapAPIHandler start', { data: { operationName, context } });
        const result = await handler(...args);

        logger.debug('SentryUtils.wrapAPIHandler success', {
          data: {
            operationName,
            context,
            duration: Date.now() - startTime,
          }
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
    logger.debug('SentryUtils.trackWebhookEvent', { data: { eventType, success, context } });

    if (!success) {
      logger.warn('SentryUtils.trackWebhookEvent failed', { data: { eventType, context } });
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