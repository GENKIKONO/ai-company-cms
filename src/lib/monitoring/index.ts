/**
 * システム監視・ログ体制
 * 要件定義準拠: 本番運用監視、エラートラッキング、パフォーマンス計測
 */

import { WebVitalsData } from '../performance';
import { logger as utilLogger } from '@/lib/utils/logger';

// ログレベル定義
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// ログエントリ型
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  url?: string;
  userAgent?: string;
}

// エラー分類
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  PERFORMANCE = 'performance',
  SYSTEM = 'system',
  USER_INPUT = 'user_input',
}

// 監視メトリクス
export interface SystemMetrics {
  timestamp: Date;
  performance: {
    webVitals?: WebVitalsData;
    pageLoadTime?: number;
    apiResponseTime?: number;
    databaseQueryTime?: number;
  };
  errors: {
    count: number;
    categories: Record<ErrorCategory, number>;
  };
  usage: {
    activeUsers?: number;
    pageViews?: number;
    apiCalls?: number;
  };
  system: {
    memoryUsage?: number;
    cpuUsage?: number;
    connectionCount?: number;
  };
}

// ログ送信インターフェース
export interface LogTransport {
  send(entry: LogEntry): Promise<void>;
}

// コンソールログ送信（開発用）
export class ConsoleLogTransport implements LogTransport {
  async send(entry: LogEntry): Promise<void> {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()}`;
    const message = `${prefix} ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.metadata);
        if (entry.stack) console.error(entry.stack);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
    }
  }
}

// 外部ログサービス送信（本番用）
export class ExternalLogTransport implements LogTransport {
  constructor(
    private endpoint: string,
    private apiKey: string
  ) {}

  async send(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // フォールバック: コンソールに出力
      utilLogger.error('Failed to send log to external service', error instanceof Error ? error : new Error(String(error)));
      utilLogger.error('Original log entry:', entry);
    }
  }
}

// Logger クラス
export class Logger {
  private static instance: Logger;
  private transports: LogTransport[] = [];
  private context: Record<string, any> = {};

  private constructor() {
    // デフォルトでコンソール出力を設定
    this.transports.push(new ConsoleLogTransport());
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context };
  }

  private async log(level: LogLevel, message: string, metadata?: Record<string, any>): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      ...this.context,
      metadata: { ...this.context, ...metadata },
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    // 全てのトランスポートに送信
    await Promise.allSettled(
      this.transports.map(transport => transport.send(entry))
    );
  }

  async error(message: string, error?: Error, metadata?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.ERROR, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      stack: error?.stack,
    });
  }

  async warn(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.WARN, message, metadata);
  }

  async info(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, message, metadata);
  }

  async debug(message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, metadata);
  }
}

// エラー監視クラス
export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private logger: Logger;
  private errorCounts: Map<ErrorCategory, number> = new Map();

  private constructor() {
    this.logger = Logger.getInstance();
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // JavaScript エラー
    window.addEventListener('error', (event) => {
      this.captureError(
        new Error(event.message),
        ErrorCategory.SYSTEM,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    // Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        ErrorCategory.SYSTEM,
        { reason: event.reason }
      );
    });
  }

  captureError(
    error: Error,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    metadata?: Record<string, any>
  ): void {
    // エラー数をカウント
    const currentCount = this.errorCounts.get(category) || 0;
    this.errorCounts.set(category, currentCount + 1);

    // ログに記録
    this.logger.error(error.message, error, {
      category,
      ...metadata,
    });

    // 重要なエラーの場合は即座に通知
    if (this.isCriticalError(category)) {
      this.sendCriticalAlert(error, category, metadata);
    }
  }

  private isCriticalError(category: ErrorCategory): boolean {
    return [
      ErrorCategory.DATABASE,
      ErrorCategory.AUTHENTICATION,
      ErrorCategory.SYSTEM,
    ].includes(category);
  }

  private sendCriticalAlert(
    error: Error,
    category: ErrorCategory,
    metadata?: Record<string, any>
  ): void {
    // 本番環境では外部アラートサービスに送信
    // 開発環境ではコンソール警告
    if (process.env.NODE_ENV === 'production') {
      // TODO: Slack/Discord/メール通知
      console.error('🚨 CRITICAL ERROR ALERT 🚨', {
        error: error.message,
        category,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }
  }

  getErrorStats(): Record<ErrorCategory, number> {
    return Object.fromEntries(this.errorCounts) as Record<ErrorCategory, number>;
  }

  resetStats(): void {
    this.errorCounts.clear();
  }
}

// パフォーマンス監視
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private logger: Logger;
  private metrics: SystemMetrics[] = [];

  private constructor() {
    this.logger = Logger.getInstance();
    this.startPeriodicCollection();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private startPeriodicCollection(): void {
    // 5分ごとにメトリクスを収集
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);
  }

  collectMetrics(): void {
    if (typeof window === 'undefined') return;

    const errorMonitor = ErrorMonitor.getInstance();
    const errorStats = errorMonitor.getErrorStats();

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      performance: {
        pageLoadTime: this.getPageLoadTime(),
      },
      errors: {
        count: Object.values(errorStats).reduce((sum, count) => sum + count, 0),
        categories: errorStats,
      },
      usage: {
        pageViews: this.getPageViews(),
      },
      system: {
        memoryUsage: this.getMemoryUsage(),
      },
    };

    this.metrics.push(metrics);
    
    // 最新100件のみ保持
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.logger.info('Performance metrics collected', { metrics });
  }

  private getPageLoadTime(): number | undefined {
    if (typeof window === 'undefined') return undefined;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation ? navigation.loadEventEnd - navigation.loadEventStart : undefined;
  }

  private getPageViews(): number {
    // セッションストレージから取得（簡易実装）
    if (typeof window === 'undefined') return 0;
    
    const views = sessionStorage.getItem('pageViews');
    return views ? parseInt(views, 10) : 0;
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window === 'undefined') return undefined;
    
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize : undefined;
  }

  getRecentMetrics(count = 10): SystemMetrics[] {
    return this.metrics.slice(-count);
  }

  recordWebVitals(vitals: WebVitalsData): void {
    this.logger.info('Web Vitals recorded', { vitals });
    
    // しきい値チェック
    if (this.isPerformanceIssue(vitals)) {
      this.logger.warn('Performance issue detected', { vitals });
    }
  }

  private isPerformanceIssue(vitals: WebVitalsData): boolean {
    const thresholds = {
      CLS: 0.1,
      FID: 100,
      LCP: 2500,
      FCP: 1800,
      TTFB: 800,
    };

    const threshold = thresholds[vitals.name as keyof typeof thresholds];
    return threshold ? vitals.value > threshold : false;
  }
}

// 使いやすいグローバル関数
export const logger = Logger.getInstance();
export const errorMonitor = ErrorMonitor.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();

// 初期化関数
export function initMonitoring(config?: {
  logEndpoint?: string;
  logApiKey?: string;
  userId?: string;
  organizationId?: string;
}): void {
  if (config?.logEndpoint && config?.logApiKey) {
    logger.addTransport(new ExternalLogTransport(config.logEndpoint, config.logApiKey));
  }

  if (config?.userId || config?.organizationId) {
    logger.setContext({
      userId: config.userId,
      organizationId: config.organizationId,
    });
  }

  logger.info('Monitoring system initialized', { config: !!config });
}