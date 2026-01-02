// ================================
// DATA NORMALIZATION UTILITIES
// ================================
// Single-Org API全体で使用する統一されたデータ正規化機能

import { isNonEmptyString, isObject } from '@/types/utils/validation';

// =====================================================
// INTERNAL HELPERS (型安全なフィールド操作)
// =====================================================

/**
 * 動的フィールドへの値設定（内部用）
 * @internal Record<string, unknown> への動的代入を1箇所に集約
 */
function _setField<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
  value: unknown
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 動的フィールド代入のため内部で1箇所のみ許容
  (obj as any)[key] = value;
}

/** メディアオブジェクト入力型 */
interface MediaInput {
  type?: string;
  url?: string;
  alt_text?: string;
  caption?: string;
}

/** 営業時間入力型 */
interface BusinessHoursInput {
  day?: string;
  is_open?: boolean;
  open_time?: string;
  close_time?: string;
}

/** メディア入力の型ガード */
function isMediaInput(v: unknown): v is MediaInput {
  return isObject(v) && typeof (v as MediaInput).url === 'string';
}

/** 営業時間入力の型ガード */
function isBusinessHoursInput(v: unknown): v is BusinessHoursInput {
  return isObject(v) && typeof (v as BusinessHoursInput).day === 'string';
}

/**
 * 空文字をnullに変換する共通ユーティリティ
 * フォームデータの正規化に使用
 */
export function normalizeEmptyStrings<T extends Record<string, unknown>>(
  data: T,
  fieldsToNormalize: (keyof T)[]
): T {
  const normalized = { ...data };

  fieldsToNormalize.forEach(field => {
    if (normalized[field] === '') {
      _setField(normalized, field, null);
    }
  });

  return normalized;
}

/**
 * 数値フィールドの正規化
 * 空文字や不正な値をnullに変換
 */
export function normalizeNumericFields<T extends Record<string, unknown>>(
  data: T,
  numericFields: (keyof T)[]
): T {
  const normalized = { ...data };

  numericFields.forEach(field => {
    const value = normalized[field];
    if (value === '' || value === null || value === undefined) {
      _setField(normalized, field, null);
    } else if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        _setField(normalized, field, null);
      } else {
        _setField(normalized, field, parsed);
      }
    }
  });

  return normalized;
}

/**
 * 配列フィールドの正規化
 * 空配列をnullに変換
 */
export function normalizeArrayFields<T extends Record<string, unknown>>(
  data: T,
  arrayFields: (keyof T)[]
): T {
  const normalized = { ...data };

  arrayFields.forEach(field => {
    const value = normalized[field];
    if (Array.isArray(value) && value.length === 0) {
      _setField(normalized, field, null);
    }
  });

  return normalized;
}

/**
 * Post データの正規化
 * @returns 正規化されたペイロード（フィールドアクセス可能）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizePostPayload(data: Record<string, unknown>): Record<string, any> {
  const normalized = normalizeEmptyStrings(data, [
    'content_markdown',
    'content_html',
    'slug'
  ]);
  
  // published_atの設定
  if (normalized.status === 'published' && !normalized.published_at) {
    normalized.published_at = new Date().toISOString();
  } else if (normalized.status === 'draft') {
    normalized.published_at = null;
  }
  
  return normalized;
}

/**
 * Service データの正規化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeServicePayload(data: Record<string, unknown>): Record<string, any> {
  // 実際のデータベース スキーマに存在するフィールドのみ抽出
  const allowedFields = [
    'name',
    'description',
    'category',
    'price',
    'is_published',
    'organization_id'
  ];

  // 許可されたフィールドのみを保持
  let normalized: Record<string, unknown> = {};
  allowedFields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      normalized[field] = data[field];
    }
  });

  normalized = normalizeEmptyStrings(normalized, [
    'description',
    'category'
  ]);
  
  normalized = normalizeNumericFields(normalized, [
    'price'
  ]);
  
  // features配列の正規化
  if (normalized.features) {
    if (Array.isArray(normalized.features)) {
      // 空文字やnull要素を除去
      normalized.features = normalized.features
        .filter((feature): feature is string => isNonEmptyString(feature));
    } else {
      normalized.features = null;
    }
  }

  // media配列の正規化
  if (normalized.media) {
    if (Array.isArray(normalized.media)) {
      // 各メディアオブジェクトの正規化とバリデーション
      normalized.media = normalized.media
        .filter((m): m is MediaInput => isMediaInput(m) && isNonEmptyString(m.url))
        .map((media) => ({
          type: media.type || 'image',
          url: (media.url ?? '').trim(),
          alt_text: media.alt_text?.trim() || null,
          caption: media.caption?.trim() || null
        }));
    } else {
      normalized.media = null;
    }
  }
  
  return normalized;
}

/**
 * CaseStudy データの正規化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCaseStudyPayload(data: Record<string, unknown>): Record<string, any> {
  const normalized = normalizeEmptyStrings(data, [
    'problem',
    'solution',
    'result'
  ]);

  // Map 'result' to 'outcome' for database compatibility
  // Database schema uses 'outcome' while frontend/types use 'result'
  if (normalized.result !== undefined) {
    normalized.outcome = normalized.result;
    delete normalized.result;
  }

  // tags配列の正規化
  if (normalized.tags) {
    if (Array.isArray(normalized.tags)) {
      // 空文字やnull要素を除去
      const validTags = normalized.tags
        .filter((tag): tag is string => isNonEmptyString(tag));

      // 空配列の場合はnullに
      normalized.tags = validTags.length > 0 ? validTags : null;
    } else {
      normalized.tags = null;
    }
  }

  return normalized;
}


/**
 * FAQ データの正規化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeFAQPayload(data: Record<string, unknown>): Record<string, any> {
  const normalized = normalizeEmptyStrings(data, ['category']);

  return normalized;
}

/**
 * Organization データの正規化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeOrganizationPayload(data: Record<string, unknown>): Record<string, any> {
  let normalized = normalizeEmptyStrings(data, [
    'description',
    'url',
    'logo_url',
    'address_street',
    'street_address', // フロントエンド互換性フィールド
    'address_locality',
    'address_region', 
    'address_postal_code',
    'postal_code', // フロントエンド互換性フィールド
    'address_country',
    'telephone',
    'email',
    // founded と establishment_date フィールドはUIに存在しないため完全除去
    'legal_form',
    'representative_name',
    // Enhanced organization settings (I1)
    'favicon_url',
    'brand_color_primary',
    'brand_color_secondary',
    'timezone',
    'company_culture',
    'mission_statement',
    'vision_statement',
    'meta_title',
    'meta_description'
  ]);
  
  normalized = normalizeNumericFields(normalized, [
    'capital',
    'employees'
  ]);
  
  normalized = normalizeArrayFields(normalized, [
    'same_as',
    'industries',
    'languages_supported',
    'certifications',
    'awards',
    'values',
    'area_served'
  ]);
  
  // email_public boolean validation
  if (typeof normalized.email_public !== 'boolean') {
    normalized.email_public = false;
  }
  
  // brand color validation (hex format)
  const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
  const primaryColor = normalized.brand_color_primary;
  if (typeof primaryColor === 'string' && !hexColorPattern.test(primaryColor)) {
    normalized.brand_color_primary = null;
  }
  const secondaryColor = normalized.brand_color_secondary;
  if (typeof secondaryColor === 'string' && !hexColorPattern.test(secondaryColor)) {
    normalized.brand_color_secondary = null;
  }
  
  // social_media object validation
  if (normalized.social_media && typeof normalized.social_media === 'object') {
    const allowedKeys = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'github', 'note', 'qiita', 'zenn'];
    const validSocialMedia: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(normalized.social_media)) {
      if (allowedKeys.includes(key) && typeof value === 'string' && value.trim() !== '') {
        // Basic URL validation
        if (/^https?:\/\//.test(value)) {
          validSocialMedia[key] = value.trim();
        }
      }
    }
    
    normalized.social_media = Object.keys(validSocialMedia).length > 0 ? validSocialMedia : null;
  } else {
    normalized.social_media = null;
  }
  
  // business_hours array validation
  if (normalized.business_hours && Array.isArray(normalized.business_hours)) {
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const validBusinessHours = normalized.business_hours
      .filter((hours): hours is BusinessHoursInput => {
        if (!isBusinessHoursInput(hours)) return false;
        const { day, is_open, open_time, close_time } = hours;
        if (!day || !validDays.includes(day)) return false;
        if (typeof is_open !== 'boolean') return false;
        if (is_open) {
          const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
          if (!open_time || !timePattern.test(open_time)) return false;
          if (!close_time || !timePattern.test(close_time)) return false;
        }
        return true;
      });

    normalized.business_hours = validBusinessHours.length > 0 ? validBusinessHours : null;
  } else {
    normalized.business_hours = null;
  }
  
  return normalized;
}

/**
 * API レスポンス用の統一エラー形式
 */
export interface APIError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  errorId?: string;
}

/**
 * 統一されたエラーレスポンス生成
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
  errorId?: string
): Response {
  const errorResponse: APIError = {
    error,
    message,
    ...(details && { details }),
    ...(errorId && { errorId })
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * バリデーションエラーの統一形式
 */
export function createValidationError(field: string, message: string): Response {
  return createErrorResponse(
    'Validation Error',
    `${field}: ${message}`,
    400,
    { field, validation: message }
  );
}

/**
 *認証エラーの統一形式
 */
export function createAuthError(message: string = 'Authentication required'): Response {
  return createErrorResponse(
    'Unauthorized',
    message,
    401
  );
}

/**
 * 権限エラーの統一形式
 */
export function createForbiddenError(message: string = 'Access denied'): Response {
  return createErrorResponse(
    'Forbidden',
    message,
    403
  );
}

/**
 * Not Found エラーの統一形式
 */
export function createNotFoundError(resource: string): Response {
  return createErrorResponse(
    'Not Found',
    `${resource} not found`,
    404,
    { resource }
  );
}

/**
 * Conflict エラーの統一形式
 */
export function createConflictError(message: string, details?: Record<string, unknown>): Response {
  return createErrorResponse(
    'Conflict',
    message,
    409,
    details
  );
}

/**
 * 内部サーバーエラーの統一形式
 */
export function createInternalError(errorId: string, message?: string): Response {
  return createErrorResponse(
    'Internal Server Error',
    message || 'An unexpected error occurred',
    500,
    undefined,
    errorId
  );
}

/**
 * エラーIDの生成
 */
export function generateErrorId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * スラッグバリデーション
 */
export function validateSlug(slug: string): { isValid: boolean; error?: string } {
  if (!slug || typeof slug !== 'string') {
    return { isValid: false, error: 'Slug is required' };
  }
  
  // 空文字チェック
  if (slug.trim() === '') {
    return { isValid: false, error: 'Slug cannot be empty' };
  }
  
  // 全角文字チェック
  if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
    return { isValid: false, error: 'Slug must contain only alphanumeric characters, hyphens, and underscores' };
  }
  
  // 長さチェック
  if (slug.length < 2 || slug.length > 100) {
    return { isValid: false, error: 'Slug must be between 2 and 100 characters' };
  }
  
  return { isValid: true };
}