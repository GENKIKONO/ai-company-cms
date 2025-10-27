// 本番環境でのログ制御
const isProd = process.env.NODE_ENV === 'production';
const isDev = process.env.NODE_ENV === 'development';

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN', 
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Logger interface
interface LogContext {
  component?: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  [key: string]: any;
}

// Core logger functions
export const logger = {
  error: (message: string, error?: Error | any, context?: LogContext) => {
    // Always log errors, even in production
    const timestamp = new Date().toISOString();
    const logData = {
      level: LogLevel.ERROR,
      message,
      timestamp,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      context
    };
    
    if (isProd) {
      // In production, use structured logging (could be sent to external service)
      console.error(JSON.stringify(logData));
    } else {
      console.error(`[${timestamp}] ERROR: ${message}`, { error, context });
    }
  },

  warn: (message: string, data?: any, context?: LogContext) => {
    // Log warnings in all environments
    const timestamp = new Date().toISOString();
    const logData = {
      level: LogLevel.WARN,
      message,
      timestamp,
      data,
      context
    };

    if (isProd) {
      console.warn(JSON.stringify(logData));
    } else {
      console.warn(`[${timestamp}] WARN: ${message}`, { data, context });
    }
  },

  info: (message: string, data?: any, context?: LogContext) => {
    // Log info in development and staging, minimal in production
    if (isProd) {
      // Only log critical info in production
      return;
    }
    
    const timestamp = new Date().toISOString();
    console.info(`[${timestamp}] INFO: ${message}`, { data, context });
  },

  debug: (message: string, data?: any, context?: LogContext) => {
    // Only log debug in development
    if (!isDev) return;
    
    const timestamp = new Date().toISOString();
    logger.debug('Debug', `[${timestamp}] DEBUG: ${message}`, { data, context });
  }
};

// Legacy verification functions (maintained for backward compatibility)
export function vLog(message: string, data?: any) {
  logger.debug(`[VERIFY] ${message}`, data);
}

export function vErr(message: string, data?: any) {
  logger.error(`[VERIFY] ${message}`, data);
}

// Specialized loggers for common use cases
export const apiLogger = {
  request: (method: string, path: string, context?: LogContext) => {
    logger.debug(`API ${method} ${path}`, undefined, context);
  },
  
  response: (method: string, path: string, status: number, duration?: number, context?: LogContext) => {
    const message = `API ${method} ${path} - ${status}${duration ? ` (${duration}ms)` : ''}`;
    if (status >= 500) {
      logger.error(message, undefined, context);
    } else if (status >= 400) {
      logger.warn(message, undefined, context);
    } else {
      logger.debug(message, undefined, context);
    }
  },

  error: (method: string, path: string, error: Error, context?: LogContext) => {
    logger.error(`API ${method} ${path} error`, error, context);
  }
};

export const authLogger = {
  login: (userId: string, method: string) => {
    logger.info(`User login`, { userId, method });
  },
  
  logout: (userId: string) => {
    logger.info(`User logout`, { userId });
  },
  
  error: (action: string, error: Error, context?: LogContext) => {
    logger.error(`Auth ${action} error`, error, context);
  }
};

export const dbLogger = {
  query: (query: string, duration?: number, context?: LogContext) => {
    logger.debug(`DB Query${duration ? ` (${duration}ms)` : ''}`, { query }, context);
  },
  
  error: (operation: string, error: Error, context?: LogContext) => {
    logger.error(`DB ${operation} error`, error, context);
  }
};