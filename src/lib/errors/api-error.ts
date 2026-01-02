/**
 * API統一エラーハンドリング
 * 要件定義準拠: JSON形式統一 { code, reason, details }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * API標準エラーコード
 */
export enum ApiErrorCode {
  // 認証・認可
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // バリデーション
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // データ
  NOT_FOUND = 'NOT_FOUND',
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // ビジネスロジック
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LIMIT_EXCEEDED = 'RESOURCE_LIMIT_EXCEEDED',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  
  // 外部サービス
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // システム
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * API統一エラークラス
 */
/** APIエラー詳細型 */
interface ApiErrorDetails {
  field?: string;
  message?: string;
  constraint?: string;
  originalError?: string;
  [key: string]: unknown;
}

/** ユーザー情報型（デバッグ用） */
interface DebugUser {
  id?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    public reason: string,
    public statusCode: number = 500,
    public details?: ApiErrorDetails | ApiErrorDetails[],
    public originalError?: Error
  ) {
    super(reason);
    this.name = 'ApiError';
  }

  /**
   * NextResponse形式で返却
   */
  toResponse(request?: NextRequest, user?: DebugUser): NextResponse {
    const errorResponse: Record<string, unknown> = {
      code: this.code,
      reason: this.reason,
    };

    // 詳細情報（本番環境では機密情報を除外）
    if (this.details) {
      errorResponse.details = this.details;
    }

    // 開発環境でのみデバッグ情報追加
    if (process.env.NODE_ENV === 'development' && request && user) {
      errorResponse.debug = {
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        userId: user?.id,
        originalError: this.originalError?.message,
        stack: this.originalError?.stack,
      };
    }

    return NextResponse.json(errorResponse, { 
      status: this.statusCode,
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });
  }

  /**
   * ログ出力用のフォーマット
   */
  toLogFormat(): Record<string, unknown> {
    return {
      code: this.code,
      reason: this.reason,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }
}

/**
 * Zodエラーをバリデーションエラーに変換
 */
export function createValidationError(error: ZodError): ApiError {
  const details = error.errors.map(e => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));

  const reason = `Validation failed: ${error.errors.map(e => 
    `${e.path.join('.')}: ${e.message}`
  ).join(', ')}`;

  return new ApiError(
    ApiErrorCode.VALIDATION_ERROR,
    reason,
    400,
    details,
    error
  );
}

/** PostgreSQLエラー型 */
interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

/**
 * データベースエラーを適切なAPIエラーに変換
 */
export function createDatabaseError(error: PostgresError): ApiError {
  // PostgreSQL制約違反
  if (error.code === '23505') {
    return new ApiError(
      ApiErrorCode.UNIQUE_VIOLATION,
      'Resource already exists',
      409,
      { constraint: error.constraint },
      error
    );
  }

  // PostgreSQL外部キー違反
  if (error.code === '23503') {
    return new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Referenced resource does not exist',
      400,
      { constraint: error.constraint },
      error
    );
  }

  // PostgreSQL CHECK制約違反
  if (error.code === '23514') {
    return new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Data violates database constraints',
      400,
      { constraint: error.constraint },
      error
    );
  }

  // 一般的なデータベースエラー
  return new ApiError(
    ApiErrorCode.DATABASE_ERROR,
    'Database operation failed',
    500,
    process.env.NODE_ENV === 'development' ? { originalError: error.message } : undefined,
    error
  );
}

/**
 * 認証エラー
 */
export function createAuthError(reason: string = 'Authentication required'): ApiError {
  return new ApiError(
    ApiErrorCode.UNAUTHORIZED,
    reason,
    401
  );
}

/**
 * 認可エラー
 */
export function createForbiddenError(reason: string = 'Insufficient permissions'): ApiError {
  return new ApiError(
    ApiErrorCode.FORBIDDEN,
    reason,
    403
  );
}

/**
 * リソース未存在エラー
 */
export function createNotFoundError(resource: string = 'Resource'): ApiError {
  return new ApiError(
    ApiErrorCode.NOT_FOUND,
    `${resource} not found`,
    404
  );
}

/**
 * レート制限エラー
 */
export function createRateLimitError(): ApiError {
  return new ApiError(
    ApiErrorCode.RATE_LIMIT_EXCEEDED,
    'Too many requests',
    429
  );
}

/**
 * 支払い必須エラー
 */
export function createPaymentRequiredError(reason: string = 'Subscription required'): ApiError {
  return new ApiError(
    ApiErrorCode.PAYMENT_REQUIRED,
    reason,
    402
  );
}