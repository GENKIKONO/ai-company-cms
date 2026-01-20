/**
 * API統一エラーレスポンス
 * 全APIエンドポイントで一貫したエラー形式を提供
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from '@/lib/utils/logger';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * 統一エラーレスポンス生成
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * 認証エラー (401)
 */
export function unauthorizedError(message = 'ログインしてください'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('UNAUTHORIZED', message, 401);
}

/**
 * 権限エラー (403)
 */
export function forbiddenError(message = 'Insufficient permissions'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('FORBIDDEN', message, 403);
}

/**
 * バリデーションエラー (400)
 */
export function validationError(details: any, message = 'Validation failed'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('VALIDATION_ERROR', message, 400, details);
}

/**
 * 重複エラー (409)
 */
export function conflictError(resource: string, field?: string): NextResponse<ApiErrorResponse> {
  const message = field 
    ? `${resource} with this ${field} already exists`
    : `${resource} already exists`;
  
  return createErrorResponse('CONFLICT', message, 409, { resource, field });
}

/**
 * リソース未発見エラー (404)
 */
export function notFoundError(resource: string): NextResponse<ApiErrorResponse> {
  return createErrorResponse('NOT_FOUND', `${resource} not found`, 404, { resource });
}

/**
 * レート制限エラー (429)
 */
export function rateLimitError(message = 'Too many requests'): NextResponse<ApiErrorResponse> {
  return createErrorResponse('RATE_LIMIT_EXCEEDED', message, 429);
}

/**
 * Zodエラーを統一レスポンスに変換（日本語対応）
 */
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const details = error.errors.map(err => {
    const field = err.path.join('.');
    let message = err.message;
    
    // 日本語のフィールド固有エラーメッセージ
    switch (field) {
      case 'name':
        if (err.code === 'too_small') message = '企業名を入力してください';
        if (err.code === 'too_big') message = '企業名は255文字以内で入力してください';
        break;
      case 'slug':
        if (err.code === 'too_small') message = 'スラッグは3文字以上で入力してください';
        if (err.code === 'too_big') message = 'スラッグは50文字以内で入力してください';
        if (err.code === 'invalid_string') message = 'スラッグは小文字、数字、ハイフンのみ使用できます';
        break;
      case 'url':
        if (err.code === 'invalid_string') message = '正しいURL形式で入力してください（例: https://example.com）';
        break;
      case 'email':
        if (err.code === 'invalid_string') message = '正しいメールアドレス形式で入力してください';
        break;
      case 'telephone':
        if (err.code === 'invalid_string') message = '正しい電話番号形式で入力してください';
        break;
      case 'postal_code':
        if (err.code === 'invalid_string') message = '郵便番号は「123-4567」の形式で入力してください';
        break;
      default:
        // 一般的なエラーの日本語化
        if (err.code === 'too_small') message = `${field}は必須項目です`;
        if (err.code === 'too_big') message = `${field}は文字数制限を超えています`;
        if (err.code === 'invalid_type') message = `${field}の形式が正しくありません`;
        if (err.code === 'invalid_string') message = `${field}の形式が正しくありません`;
    }

    return {
      field,
      message,
      code: err.code,
    };
  });

  return validationError(details, 'リクエストデータの検証に失敗しました');
}

/**
 * データベースエラーを統一レスポンスに変換
 */
export function handleDatabaseError(error: any): NextResponse<ApiErrorResponse> {
  logger.error('Database error', { data: error instanceof Error ? error : new Error(String(error)) });

  // PostgreSQL固有エラーコードのハンドリング
  if (error.code === '23505') { // unique_violation
    const match = error.detail?.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
    if (match) {
      const field = match[1];
      return conflictError('Resource', field);
    }
    return conflictError('Resource');
  }

  if (error.code === '23503') { // foreign_key_violation
    return createErrorResponse('FOREIGN_KEY_VIOLATION', 'Referenced resource does not exist', 400);
  }

  if (error.code === '23514') { // check_violation
    return createErrorResponse('CHECK_VIOLATION', 'Data violates database constraints', 400);
  }

  // 一般的なデータベースエラー
  return createErrorResponse('DATABASE_ERROR', 'Database operation failed', 500);
}

/**
 * 汎用エラーハンドラー
 *
 * セキュリティ: エラー詳細はログに記録し、クライアントには汎用メッセージのみ返却
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  // ログには詳細情報を記録（スタックトレース含む）
  logger.error(`API Error${context ? ` [${context}]` : ''}`, {
    data: error instanceof Error ? error : new Error(String(error)),
    stack: error instanceof Error ? error.stack : undefined
  });

  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    return handleDatabaseError(error);
  }

  // セキュリティ: クライアントにはerror.messageを返却しない（内部情報漏洩防止）
  return createErrorResponse('INTERNAL_ERROR', 'サーバーエラーが発生しました', 500);
}

/**
 * 安全なエラーレスポンス生成（スタックトレース漏洩防止）
 *
 * 既存コードの移行用ヘルパー
 * 使用例: return safeErrorResponse(error, 'MyAPI');
 */
export function safeErrorResponse(error: unknown, context?: string): NextResponse<ApiErrorResponse> {
  return handleApiError(error, context);
}