/**
 * Enhanced Logging Utility for Email System
 * Provides structured logging with correlation IDs and standardized formats
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  event?: string;
  userId?: string;
  email?: string;
  provider?: string;
  duration?: number;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: Error | string;
  stack?: string;
}

class EmailSystemLogger {
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}`
      : username;
    return `${maskedUsername}@${domain}`;
  }

  private createLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    // Mask sensitive information
    if (entry.email) {
      entry.email = this.maskEmail(entry.email);
    }

    // Remove undefined values
    Object.keys(entry).forEach(key => {
      if (entry[key] === undefined) {
        delete entry[key];
      }
    });

    return entry;
  }

  private formatLogOutput(entry: LogEntry): string {
    const { level, message, timestamp, ...context } = entry;
    const contextStr = Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context: LogContext = {}) {
    const entry = this.createLogEntry('debug', message, context);
    console.debug(this.formatLogOutput(entry));
    return entry;
  }

  info(message: string, context: LogContext = {}) {
    const entry = this.createLogEntry('info', message, context);
    console.info(this.formatLogOutput(entry));
    return entry;
  }

  warn(message: string, context: LogContext = {}) {
    const entry = this.createLogEntry('warn', message, context);
    console.warn(this.formatLogOutput(entry));
    return entry;
  }

  error(message: string, context: LogContext = {}) {
    const entry = this.createLogEntry('error', message, context);
    
    // Handle error objects
    if (context.error) {
      if (context.error instanceof Error) {
        entry.stack = context.error.stack;
        entry.error = context.error.message;
      } else {
        entry.error = String(context.error);
      }
    }
    
    console.error(this.formatLogOutput(entry));
    return entry;
  }

  // Email-specific logging methods
  emailSent(context: LogContext) {
    return this.info('Email sent successfully', {
      event: 'email_sent',
      ...context
    });
  }

  emailFailed(message: string, context: LogContext) {
    return this.error(`Email delivery failed: ${message}`, {
      event: 'email_failed',
      ...context
    });
  }

  authLinkGenerated(context: LogContext) {
    return this.info('Auth link generated', {
      event: 'auth_link_generated',
      ...context
    });
  }

  authLinkFailed(message: string, context: LogContext) {
    return this.error(`Auth link generation failed: ${message}`, {
      event: 'auth_link_failed',
      ...context
    });
  }

  rateLimitHit(context: LogContext) {
    return this.warn('Rate limit exceeded', {
      event: 'rate_limit_exceeded',
      ...context
    });
  }

  validationError(message: string, context: LogContext) {
    return this.warn(`Validation error: ${message}`, {
      event: 'validation_error',
      ...context
    });
  }

  apiRequest(context: LogContext) {
    return this.info('API request received', {
      event: 'api_request',
      ...context
    });
  }

  apiResponse(context: LogContext) {
    return this.info('API response sent', {
      event: 'api_response',
      ...context
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context: LogContext = {}) {
    const level = duration > 5000 ? 'warn' : 'info';
    return this[level](`Performance: ${operation} took ${duration}ms`, {
      event: 'performance_metric',
      operation,
      duration,
      ...context
    });
  }

  // Diagnostic logging
  diagnostic(checkName: string, result: 'pass' | 'fail' | 'warn', context: LogContext = {}) {
    const level = result === 'fail' ? 'error' : result === 'warn' ? 'warn' : 'info';
    return this[level](`Diagnostic check: ${checkName} - ${result}`, {
      event: 'diagnostic_check',
      checkName,
      result,
      ...context
    });
  }
}

// Export singleton instance
export const logger = new EmailSystemLogger();

// Request context helper for Next.js API routes
export function createRequestContext(request: Request, additionalContext: LogContext = {}): LogContext {
  const url = new URL(request.url);
  
  return {
    endpoint: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    ...additionalContext
  };
}

export default logger;