/**
 * API Response Helpers
 *
 * Admin API の統一レスポンス形式
 *
 * 成功: { success: true, data, meta? }
 * 失敗: { success: false, error_code, message, details? }
 */

// 成功レスポンス型
export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

// エラーレスポンス型
export type ApiError = {
  success: false;
  error_code: string;
  message: string;
  details?: unknown;
};

// ユニオン型
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * 成功レスポンスを生成
 */
export function ok<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return meta ? { success: true, data, meta } : { success: true, data };
}

/**
 * エラーレスポンスを生成
 */
export function err(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  const response: ApiError = {
    success: false,
    error_code: code,
    message,
  };
  if (details !== undefined) {
    response.details = details;
  }
  return response;
}

// よく使うエラーコード
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SCAN_FAILED: 'SCAN_FAILED',
  JOB_FAILED: 'JOB_FAILED',
} as const;
