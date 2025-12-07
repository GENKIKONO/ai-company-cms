/**
 * P1-5: Edge Functions 用構造化ログユーティリティ
 * 
 * Supabase Assistant 回答準拠:
 * - console.log で JSON文字列化
 * - レベル: debug/info/warn/error
 * - request_id 通し番号付与
 * - user_id, org_id, function_name 含む
 */

import { type LogLevel } from './supabase.ts';

/**
 * ログコンテキスト情報
 */
export interface LogContext {
  request_id?: string;
  user_id?: string;
  org_id?: string;
  function_name?: string;
  operation?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

/**
 * 構造化ログエントリ
 */
interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  request_id?: string;
  user_id?: string;
  org_id?: string;
  function_name?: string;
  ctx?: Record<string, unknown>;
}

/**
 * ログレベル数値 (フィルタリング用)
 */
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * 構造化ロガークラス
 */
export class EdgeLogger {
  private context: LogContext;
  private minLevel: LogLevel;

  constructor(context: LogContext = {}, minLevel: LogLevel = 'info') {
    this.context = context;
    this.minLevel = minLevel;
  }

  /**
   * ログレベル判定
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_VALUES[level] >= LOG_LEVEL_VALUES[this.minLevel];
  }

  /**
   * 基本ログ出力
   */
  private log(level: LogLevel, message: string, ctx?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      msg: message,
      timestamp: new Date().toISOString(),
      request_id: this.context.request_id,
      user_id: this.context.user_id,
      org_id: this.context.org_id,
      function_name: this.context.function_name,
      ctx: { ...this.context, ...ctx },
    };

    // JSON文字列化して出力 (Supabase Assistant回答準拠)
    console.log(JSON.stringify(entry));
  }

  /**
   * コンテキスト付きロガー作成
   */
  withContext(additionalContext: LogContext): EdgeLogger {
    return new EdgeLogger(
      { ...this.context, ...additionalContext },
      this.minLevel
    );
  }

  /**
   * デバッグログ
   */
  debug(message: string, ctx?: Record<string, unknown>): void {
    this.log('debug', message, ctx);
  }

  /**
   * 情報ログ
   */
  info(message: string, ctx?: Record<string, unknown>): void {
    this.log('info', message, ctx);
  }

  /**
   * 警告ログ
   */
  warn(message: string, ctx?: Record<string, unknown>): void {
    this.log('warn', message, ctx);
  }

  /**
   * エラーログ
   */
  error(message: string, ctx?: Record<string, unknown>): void {
    this.log('error', message, ctx);
  }

  /**
   * 実行時間計測付きログ
   */
  async timed<T>(
    operation: string,
    fn: () => Promise<T>,
    level: LogLevel = 'info'
  ): Promise<T> {
    const startTime = Date.now();
    
    this.info(`Starting ${operation}`, { operation });
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.log(level, `Completed ${operation}`, { 
        operation, 
        duration_ms: duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      this.error(`Failed ${operation}`, {
        operation,
        duration_ms: duration,
        success: false,
        error: errorMsg,
      });
      
      throw error;
    }
  }
}

/**
 * request_id 生成
 * Edge Function 毎に一意のID生成
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * リクエストヘッダーから request_id 取得または生成
 */
export function getOrGenerateRequestId(request: Request): string {
  const existingId = request.headers.get('x-request-id');
  return existingId || generateRequestId();
}

/**
 * Edge Function 向けロガー作成
 * 
 * @param request - HTTP Request (request_id抽出用)
 * @param functionName - Edge Function名
 * @param additionalContext - 追加コンテキスト
 */
export function createEdgeLogger(
  request: Request,
  functionName: string,
  additionalContext: LogContext = {}
): EdgeLogger {
  const request_id = getOrGenerateRequestId(request);
  
  const context: LogContext = {
    request_id,
    function_name: functionName,
    ...additionalContext,
  };

  // 本番環境では info 以上、開発環境では debug 以上
  const minLevel: LogLevel = Deno.env.get('DENO_ENV') === 'production' ? 'info' : 'debug';
  
  return new EdgeLogger(context, minLevel);
}

/**
 * service_role 使用時の専用ログ
 * 必ずログに残すべき高権限操作
 */
export function logServiceRoleUsage(
  logger: EdgeLogger,
  operation: string,
  details: {
    table_name?: string;
    row_count?: number;
    user_id?: string;
    org_id?: string;
    query_text?: string;
  }
): void {
  logger.warn('SERVICE_ROLE_USAGE', {
    operation,
    is_service_role: true,
    risk_level: 'high',
    ...details,
  });
}