/**
 * 統一エラーハンドリングパターン - Phase 3
 * AppErrorBoundary との連携を強化したエラー処理システム
 */

import { logger } from './utils/logger';

// エラータイプ定義
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 統一エラークラス
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode?: number;
  public readonly userMessage: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor({
    message,
    type = ErrorType.UNKNOWN,
    severity = ErrorSeverity.MEDIUM,
    statusCode,
    userMessage,
    context,
    originalError
  }: {
    message: string;
    type?: ErrorType;
    severity?: ErrorSeverity;
    statusCode?: number;
    userMessage?: string;
    context?: Record<string, unknown>;
    originalError?: Error;
  }) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.context = context;
    this.timestamp = new Date();

    // 元のエラーのスタックトレースを保持
    if (originalError?.stack) {
      this.stack = originalError.stack;
    }

    // 即座にログ記録
    this.logError();
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'ネットワークエラーが発生しました。インターネット接続をご確認ください。';
      case ErrorType.AUTHENTICATION:
        return 'ログインが必要です。再度ログインしてください。';
      case ErrorType.AUTHORIZATION:
        return 'この操作を実行する権限がありません。';
      case ErrorType.VALIDATION:
        return '入力内容に問題があります。もう一度ご確認ください。';
      case ErrorType.NOT_FOUND:
        return '要求されたリソースが見つかりませんでした。';
      case ErrorType.SERVER:
        return 'サーバーエラーが発生しました。しばらく待ってからもう一度お試しください。';
      default:
        return '予期しないエラーが発生しました。問題が続く場合はサポートまでご連絡ください。';
    }
  }

  private logError(): void {
    const errorData = {
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };

    switch (this.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('Critical error occurred', errorData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('High severity error', errorData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Medium severity error', errorData);
        break;
      case ErrorSeverity.LOW:
        logger.info('Low severity error', errorData);
        break;
    }
  }

  // エラー情報のJSONシリアライゼーション
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

// エラーファクトリー関数群
export const createNetworkError = (message: string, context?: Record<string, unknown>) =>
  new AppError({
    message,
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    context
  });

export const createAuthError = (message: string, context?: Record<string, unknown>) =>
  new AppError({
    message,
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    statusCode: 401,
    context
  });

export const createValidationError = (message: string, context?: Record<string, unknown>) =>
  new AppError({
    message,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 400,
    context
  });

export const createNotFoundError = (message: string, context?: Record<string, unknown>) =>
  new AppError({
    message,
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 404,
    context
  });

export const createServerError = (message: string, context?: Record<string, unknown>) =>
  new AppError({
    message,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    statusCode: 500,
    context
  });

// 汎用エラーハンドリングラッパー
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, unknown>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // 既にAppErrorの場合はそのまま再スロー
      if (error instanceof AppError) {
        throw error;
      }

      // 標準エラーをAppErrorに変換
      if (error instanceof Error) {
        throw new AppError({
          message: error.message,
          type: ErrorType.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          context,
          originalError: error
        });
      }

      // その他の例外
      throw new AppError({
        message: 'Unknown error occurred',
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        context: { ...context, originalError: error }
      });
    }
  };
};

// HTTP レスポンスエラーの処理
export const handleHttpError = (response: Response, context?: Record<string, unknown>) => {
  const { status, statusText } = response;

  let type: ErrorType;
  let severity: ErrorSeverity;

  if (status >= 400 && status < 500) {
    // クライアントエラー
    if (status === 401) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    } else if (status === 403) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.HIGH;
    } else if (status === 404) {
      type = ErrorType.NOT_FOUND;
      severity = ErrorSeverity.MEDIUM;
    } else if (status === 400) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
    } else {
      type = ErrorType.CLIENT;
      severity = ErrorSeverity.MEDIUM;
    }
  } else if (status >= 500) {
    // サーバーエラー
    type = ErrorType.SERVER;
    severity = ErrorSeverity.HIGH;
  } else {
    // その他
    type = ErrorType.UNKNOWN;
    severity = ErrorSeverity.MEDIUM;
  }

  throw new AppError({
    message: `HTTP ${status}: ${statusText}`,
    type,
    severity,
    statusCode: status,
    context: { ...context, url: response.url }
  });
};

// Supabase エラーの処理
export const handleSupabaseError = (error: unknown, context?: Record<string, unknown>) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string; details?: string };
    
    let type: ErrorType;
    let severity: ErrorSeverity;

    // Supabase エラーコードに基づく分類
    switch (supabaseError.code) {
      case 'PGRST301': // JWT expired
      case 'PGRST302': // JWT invalid
        type = ErrorType.AUTHENTICATION;
        severity = ErrorSeverity.HIGH;
        break;
      case 'PGRST116': // JWT missing
        type = ErrorType.AUTHORIZATION;
        severity = ErrorSeverity.HIGH;
        break;
      case '23505': // Unique constraint violation
        type = ErrorType.VALIDATION;
        severity = ErrorSeverity.MEDIUM;
        break;
      default:
        type = ErrorType.SERVER;
        severity = ErrorSeverity.HIGH;
    }

    throw new AppError({
      message: supabaseError.message,
      type,
      severity,
      context: { ...context, code: supabaseError.code, details: supabaseError.details }
    });
  }

  throw new AppError({
    message: 'Supabase operation failed',
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    context
  });
};

// React コンポーネント用エラーハンドリングフック
export const useErrorHandler = () => {
  const handleError = (error: unknown, context?: Record<string, unknown>) => {
    if (error instanceof AppError) {
      // 既にAppErrorの場合はそのまま処理
      return error;
    }

    // その他のエラーをAppErrorに変換
    return new AppError({
      message: error instanceof Error ? error.message : 'Unknown error',
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      context,
      originalError: error instanceof Error ? error : undefined
    });
  };

  return { handleError };
};

const errorHandling = {
  AppError,
  ErrorType,
  ErrorSeverity,
  createNetworkError,
  createAuthError,
  createValidationError,
  createNotFoundError,
  createServerError,
  withErrorHandling,
  handleHttpError,
  handleSupabaseError,
  useErrorHandler
};

export default errorHandling;