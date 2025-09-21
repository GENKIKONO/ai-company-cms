// 構造化ログシステム

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private service: string;
  private defaultMetadata: Record<string, any>;

  constructor(service: string, defaultMetadata: Record<string, any> = {}) {
    this.service = service;
    this.defaultMetadata = defaultMetadata;
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      requestId,
      userId,
      organizationId,
      metadata: {
        ...this.defaultMetadata,
        ...metadata,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    // 開発環境では見やすい形式で出力
    if (process.env.NODE_ENV === 'development') {
      this.logToDevelopment(entry);
    } else {
      // 本番環境では構造化JSON形式で出力
      console.log(JSON.stringify(entry));
    }

    // 外部ログサービスに送信（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private logToDevelopment(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // cyan
      [LogLevel.INFO]: '\x1b[32m',  // green
      [LogLevel.WARN]: '\x1b[33m',  // yellow
      [LogLevel.ERROR]: '\x1b[31m', // red
    };

    const resetColor = '\x1b[0m';
    const color = colors[entry.level];
    
    const prefix = `${color}[${entry.level.toUpperCase()}]${resetColor}`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const service = `[${entry.service}]`;
    
    let logMessage = `${prefix} ${timestamp} ${service} ${entry.message}`;
    
    if (entry.requestId) {
      logMessage += ` (req: ${entry.requestId})`;
    }
    
    if (entry.userId) {
      logMessage += ` (user: ${entry.userId})`;
    }

    console.log(logMessage);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', entry.metadata);
    }

    if (entry.error) {
      console.error('  Error:', entry.error);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // 外部ログサービス（例：DataDog、Sentry、CloudWatch）への送信
      // 今後実装予定
      
      // エラーレベルの場合はSentryに送信
      if (entry.level === LogLevel.ERROR && entry.error) {
        // await Sentry.captureException(entry.error, {
        //   tags: {
        //     service: entry.service,
        //     requestId: entry.requestId,
        //   },
        //   extra: entry.metadata,
        // });
      }
    } catch (error) {
      // 外部サービスへの送信に失敗してもアプリケーションを停止させない
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string, organizationId?: string): void {
    this.log(LogLevel.DEBUG, message, metadata, undefined, requestId, userId, organizationId);
  }

  info(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string, organizationId?: string): void {
    this.log(LogLevel.INFO, message, metadata, undefined, requestId, userId, organizationId);
  }

  warn(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string, organizationId?: string): void {
    this.log(LogLevel.WARN, message, metadata, undefined, requestId, userId, organizationId);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>, requestId?: string, userId?: string, organizationId?: string): void {
    this.log(LogLevel.ERROR, message, metadata, error, requestId, userId, organizationId);
  }

  // パフォーマンス計測
  async time<T>(
    operation: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, any>,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      this.debug(`Starting ${operation}`, { ...metadata, startTime }, requestId, userId, organizationId);
      
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.info(`Completed ${operation}`, { 
        ...metadata, 
        duration,
        status: 'success' 
      }, requestId, userId, organizationId);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Failed ${operation}`, error as Error, { 
        ...metadata, 
        duration,
        status: 'error' 
      }, requestId, userId, organizationId);
      
      throw error;
    }
  }

  // APIリクエスト用のロガー
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;

    this.log(level, `${method} ${path}`, {
      ...metadata,
      statusCode,
      duration,
      type: 'api_request'
    }, undefined, requestId, userId);
  }
}

// 各サービス用のロガーを作成
export const createLogger = (service: string, defaultMetadata?: Record<string, any>) => 
  new Logger(service, defaultMetadata);

// デフォルトロガー
export const logger = createLogger('app');

// 各サービス専用ロガー
export const apiLogger = createLogger('api');
export const dbLogger = createLogger('database');
export const authLogger = createLogger('auth');
export const extractLogger = createLogger('extraction');
export const ogpLogger = createLogger('ogp');
export const analyticsLogger = createLogger('analytics');

// パフォーマンス監視
export class PerformanceMonitor {
  private static thresholds = {
    api: 2000,      // 2秒
    database: 1000, // 1秒
    external: 5000, // 5秒
  };

  static async monitor<T>(
    type: keyof typeof PerformanceMonitor.thresholds,
    operation: string,
    fn: () => Promise<T> | T,
    logger: Logger = apiLogger,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      const threshold = this.thresholds[type];
      
      if (duration > threshold) {
        logger.warn(`Slow ${type} operation: ${operation}`, {
          ...metadata,
          duration,
          threshold,
          type: 'performance_warning'
        });
      } else {
        logger.debug(`${type} operation completed: ${operation}`, {
          ...metadata,
          duration,
          type: 'performance_info'
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`${type} operation failed: ${operation}`, error as Error, {
        ...metadata,
        duration,
        type: 'performance_error'
      });
      throw error;
    }
  }
}