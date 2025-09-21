'use client';

export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  timing: {
    loadTime: number;
    renderTime: number;
    interactionTime?: number;
  };
  resources: {
    memoryUsage?: number;
    networkRequests?: number;
    cacheHitRate?: number;
  };
  vitals: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    fcp?: number; // First Contentful Paint
    ttfb?: number; // Time to First Byte
  };
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context: ErrorContext;
  userAgent: string;
  url: string;
  sessionId: string;
  performanceMetrics?: PerformanceMetrics;
}

class ErrorMonitoringService {
  private sessionId: string;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
    this.setupPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring() {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        context: {
          page: window.location.pathname,
          component: 'global',
          action: 'javascript_error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        context: {
          page: window.location.pathname,
          component: 'global',
          action: 'promise_rejection',
          metadata: {
            reason: event.reason?.toString(),
          },
        },
      });
    });

    // Network monitoring
    this.monitorNetworkErrors();

    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Start periodic error flushing
    this.flushInterval = setInterval(() => {
      if (this.isOnline) {
        this.flushErrors();
      }
    }, 30000); // Flush every 30 seconds
  }

  private setupPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Web Vitals monitoring
    import('web-vitals').then(({ onLCP, onFID, onCLS, onFCP, onTTFB }) => {
      const sendVital = (metric: any) => {
        this.capturePerformanceMetric({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          delta: metric.delta,
        });
      };

      onLCP(sendVital);
      onFID(sendVital);
      onCLS(sendVital);
      onFCP(sendVital);
      onTTFB(sendVital);
    }).catch(console.warn);

    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.captureError({
                message: `Long task detected: ${entry.duration}ms`,
                context: {
                  page: window.location.pathname,
                  component: 'performance',
                  action: 'long_task',
                  metadata: {
                    duration: entry.duration,
                    startTime: entry.startTime,
                    name: entry.name,
                  },
                },
              }, 'warning');
            }
          }
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.warn('Performance Observer not supported:', e);
      }
    }

    // Memory usage monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.captureError({
            message: 'High memory usage detected',
            context: {
              page: window.location.pathname,
              component: 'performance',
              action: 'memory_warning',
              metadata: {
                usedJSHeapSize: memory.usedJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit,
                totalJSHeapSize: memory.totalJSHeapSize,
              },
            },
          }, 'warning');
        }
      }, 60000); // Check every minute
    }
  }

  private monitorNetworkErrors() {
    if (typeof window === 'undefined') return;

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();

        if (!response.ok) {
          this.captureError({
            message: `Network error: ${response.status} ${response.statusText}`,
            context: {
              page: window.location.pathname,
              component: 'network',
              action: 'fetch_error',
              metadata: {
                url: args[0],
                status: response.status,
                statusText: response.statusText,
                duration: endTime - startTime,
              },
            },
          }, response.status >= 500 ? 'error' : 'warning');
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        this.captureError({
          message: `Network request failed: ${error}`,
          stack: error instanceof Error ? error.stack : undefined,
          context: {
            page: window.location.pathname,
            component: 'network',
            action: 'fetch_failure',
            metadata: {
              url: args[0],
              duration: endTime - startTime,
            },
          },
        });
        throw error;
      }
    };
  }

  captureError(
    error: {
      message: string;
      stack?: string;
      context: ErrorContext;
    },
    level: 'error' | 'warning' | 'info' = 'error'
  ) {
    const errorReport: ErrorReport = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      level,
      message: error.message,
      stack: error.stack,
      context: error.context,
      userAgent: navigator?.userAgent || 'unknown',
      url: window?.location?.href || 'unknown',
      sessionId: this.sessionId,
      performanceMetrics: this.getCurrentPerformanceMetrics(),
    };

    this.errorQueue.push(errorReport);

    // Immediate flush for critical errors
    if (level === 'error' && this.isOnline) {
      this.flushErrors();
    }

    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${level.toUpperCase()}: ${error.message}`);
      console.log('Context:', error.context);
      console.log('Stack:', error.stack);
      console.log('Performance:', errorReport.performanceMetrics);
      console.groupEnd();
    }
  }

  capturePerformanceMetric(metric: {
    name: string;
    value: number;
    id: string;
    delta?: number;
  }) {
    // Send performance metrics to analytics
    if (window.plausible) {
      window.plausible('Performance Metric', {
        props: {
          metric_name: metric.name,
          metric_value: Math.round(metric.value).toString(),
          metric_id: metric.id,
          page: window.location.pathname,
        },
      });
    }

    // Alert on poor performance
    if (
      (metric.name === 'LCP' && metric.value > 2500) ||
      (metric.name === 'FID' && metric.value > 100) ||
      (metric.name === 'CLS' && metric.value > 0.1)
    ) {
      this.captureError({
        message: `Poor ${metric.name} performance: ${metric.value}`,
        context: {
          page: window.location.pathname,
          component: 'performance',
          action: 'poor_vitals',
          metadata: metric,
        },
      }, 'warning');
    }
  }

  private getCurrentPerformanceMetrics(): PerformanceMetrics {
    if (typeof window === 'undefined') {
      return {
        timing: { loadTime: 0, renderTime: 0 },
        resources: {},
        vitals: {},
      };
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const memory = (performance as any).memory;

    return {
      timing: {
        loadTime: navigation ? navigation.loadEventEnd - navigation.navigationStart : 0,
        renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : 0,
      },
      resources: {
        memoryUsage: memory ? memory.usedJSHeapSize : undefined,
        networkRequests: performance.getEntriesByType('resource').length,
      },
      vitals: {
        // These will be populated by the web vitals library
      },
    };
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to your error tracking service
      await this.sendErrorsToService(errors);
      
      // Also send critical errors to Plausible for immediate visibility
      errors.forEach(error => {
        if (error.level === 'error' && window.plausible) {
          window.plausible('Error', {
            props: {
              error_message: error.message.substring(0, 100), // Truncate for URL limits
              error_page: error.context.page || 'unknown',
              error_component: error.context.component || 'unknown',
              error_action: error.context.action || 'unknown',
              session_id: this.sessionId,
            },
          });
        }
      });
    } catch (sendError) {
      console.warn('Failed to send errors:', sendError);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  private async sendErrorsToService(errors: ErrorReport[]) {
    // In a real implementation, send to your error tracking service
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Flushing errors to monitoring service:', errors);
    }

    // Example: Send to a monitoring service
    // const response = await fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errors),
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Failed to send errors: ${response.statusText}`);
    // }
  }

  // Public method to manually capture exceptions
  captureException(error: Error, context?: Partial<ErrorContext>) {
    this.captureError({
      message: error.message,
      stack: error.stack,
      context: {
        page: window?.location?.pathname,
        component: 'manual',
        action: 'exception',
        ...context,
      },
    });
  }

  // Public method to capture messages
  captureMessage(message: string, level: 'error' | 'warning' | 'info' = 'info', context?: Partial<ErrorContext>) {
    this.captureError({
      message,
      context: {
        page: window?.location?.pathname,
        component: 'manual',
        action: 'message',
        ...context,
      },
    }, level);
  }

  // Cleanup method
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushErrors(); // Final flush
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// React error boundary helper
export class ErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

// Hook for React components
export function useErrorHandler() {
  return {
    captureError: (error: Error, context?: Partial<ErrorContext>) => {
      errorMonitoring.captureException(error, context);
    },
    captureMessage: (message: string, level?: 'error' | 'warning' | 'info', context?: Partial<ErrorContext>) => {
      errorMonitoring.captureMessage(message, level, context);
    },
  };
}