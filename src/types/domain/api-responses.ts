/**
 * API レスポンス型定義
 * 各APIエンドポイントの標準化されたレスポンス形状を定義
 */

// 基本的なAPIレスポンス構造
export interface BaseApiResponse {
  success: boolean
  error?: string
  code?: string
  timestamp?: string
}

// ページネーション情報
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ページネーション付きレスポンス
export interface PaginatedResponse<T> extends BaseApiResponse {
  data: T[]
  pagination: PaginationInfo
}

// データ付きレスポンス
export interface DataResponse<T> extends BaseApiResponse {
  data: T
}

// リスト型レスポンス
export interface ListResponse<T> extends BaseApiResponse {
  data: T[]
  count?: number
}

// 作成系APIレスポンス
export interface CreateResponse extends BaseApiResponse {
  id?: string
  data?: unknown
}

// 更新系APIレスポンス
export interface UpdateResponse extends BaseApiResponse {
  data?: unknown
  updatedFields?: string[]
}

// 削除系APIレスポンス
export interface DeleteResponse extends BaseApiResponse {
  deletedId?: string
}

// バリデーションエラー詳細
export interface ValidationError {
  field: string
  message: string
  code: string
}

// バリデーションエラーレスポンス
export interface ValidationErrorResponse extends BaseApiResponse {
  success: false
  error: 'Validation failed'
  validationErrors: ValidationError[]
}

// ファイルアップロードレスポンス
export interface FileUploadResponse extends BaseApiResponse {
  data?: {
    url: string
    filename: string
    size: number
    mimeType: string
  }
}

// 健康診断レスポンス
export interface HealthCheckResponse extends BaseApiResponse {
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    version: string
    timestamp: string
    services: {
      database: 'up' | 'down'
      storage: 'up' | 'down'
      ai: 'up' | 'down'
    }
  }
}

// エクスポート系レスポンス
export interface ExportResponse extends BaseApiResponse {
  data?: {
    downloadUrl: string
    expiresAt: string
    format: 'csv' | 'xlsx' | 'json'
    filename: string
  }
}

// Migrated from database.ts - Legacy API Response Types
// TODO: Replace with new structured response types above

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MyOrganizationResponse {
  data: any; // TODO: Replace with proper Supabase Organization type
}

export interface MyOrganizationUpdateResponse {
  data: any; // TODO: Replace with proper Supabase Organization type
}

export interface MyOrganizationDeleteResponse {
  message: string;
}

export interface MyOrganizationErrorResponse {
  error: string;
  message: string;
}