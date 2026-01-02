// エラーハンドリングユーティリティ

import type { JsonObject } from '@/lib/utils/ab-testing';

export enum ErrorCode {
  // 認証エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // データベースエラー
  DATABASE_ERROR = 'DATABASE_ERROR',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // API エラー
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // ファイル関連エラー
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // システムエラー
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: JsonObject;
  timestamp: string;
  requestId?: string;
  userId?: string;
  organizationId?: string;
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: JsonObject;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly organizationId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: JsonObject,
    requestId?: string,
    userId?: string,
    organizationId?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;
    this.userId = userId;
    this.organizationId = organizationId;
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      organizationId: this.organizationId,
    };
  }
}

// エラーファクトリー関数
export const createError = {
  unauthorized: (message = '認証が必要です') => 
    new CustomError(ErrorCode.UNAUTHORIZED, message),
  
  forbidden: (message = 'アクセスが禁止されています') => 
    new CustomError(ErrorCode.FORBIDDEN, message),
  
  validation: (message: string, details?: JsonObject) => 
    new CustomError(ErrorCode.VALIDATION_ERROR, message, details),
  
  notFound: (resource = 'リソース', id?: string) => 
    new CustomError(ErrorCode.RECORD_NOT_FOUND, `${resource}が見つかりません`, { id }),
  
  duplicate: (resource = 'リソース', field?: string) => 
    new CustomError(ErrorCode.DUPLICATE_ENTRY, `${resource}は既に存在します`, { field }),
  
  rateLimit: (limit: number, window: string) => 
    new CustomError(ErrorCode.RATE_LIMIT_EXCEEDED, 'レート制限に達しました', { limit, window }),
  
  fileUpload: (message: string, details?: JsonObject) => 
    new CustomError(ErrorCode.FILE_UPLOAD_ERROR, message, details),
  
  fileSize: (maxSize: number, actualSize: number) => 
    new CustomError(ErrorCode.FILE_SIZE_EXCEEDED, 'ファイルサイズが上限を超えています', {
      maxSize,
      actualSize,
      maxSizeMB: Math.round(maxSize / 1024 / 1024),
      actualSizeMB: Math.round(actualSize / 1024 / 1024)
    }),
  
  invalidFileType: (allowedTypes: string[], actualType: string) => 
    new CustomError(ErrorCode.INVALID_FILE_TYPE, '許可されていないファイル形式です', {
      allowedTypes,
      actualType
    }),
  
  external: (service: string, message: string, details?: JsonObject) => 
    new CustomError(ErrorCode.EXTERNAL_API_ERROR, `${service}エラー: ${message}`, details),
  
  internal: (message = 'サーバー内部エラーが発生しました', details?: JsonObject) => 
    new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, details),
  
  timeout: (operation: string, timeoutMs: number) => 
    new CustomError(ErrorCode.TIMEOUT_ERROR, `${operation}がタイムアウトしました`, { timeoutMs }),
};

// エラーレスポンス変換
export function errorToResponse(error: unknown, requestId?: string): {
  status: number;
  body: AppError;
} {
  if (error instanceof CustomError) {
    const status = getStatusCode(error.code);
    return {
      status,
      body: {
        ...error.toJSON(),
        requestId: requestId || error.requestId,
      },
    };
  }

  // 予期しないエラー
  const appError = createError.internal('予期しないエラーが発生しました');
  return {
    status: 500,
    body: {
      ...appError.toJSON(),
      requestId,
    },
  };
}

// エラーコードからHTTPステータスコードを取得
function getStatusCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.TOKEN_EXPIRED:
      return 401;
    
    case ErrorCode.FORBIDDEN:
      return 403;
    
    case ErrorCode.RECORD_NOT_FOUND:
      return 404;
    
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.DUPLICATE_ENTRY:
    case ErrorCode.FILE_SIZE_EXCEEDED:
    case ErrorCode.INVALID_FILE_TYPE:
      return 400;
    
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    
    case ErrorCode.EXTERNAL_API_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.FILE_UPLOAD_ERROR:
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 500;
    
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    
    case ErrorCode.TIMEOUT_ERROR:
      return 504;
    
    default:
      return 500;
  }
}

// エラーをマスクして安全な情報のみ返す
export function maskSensitiveError(error: AppError): AppError {
  const maskedError = { ...error };
  
  // 本番環境では詳細を隠す
  if (process.env.NODE_ENV === 'production') {
    switch (error.code) {
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.INTERNAL_SERVER_ERROR:
        maskedError.details = undefined;
        break;
    }
  }
  
  return maskedError;
}