// ================================
// DATA NORMALIZATION UTILITIES
// ================================
// Single-Org API全体で使用する統一されたデータ正規化機能

/**
 * 空文字をnullに変換する共通ユーティリティ
 * フォームデータの正規化に使用
 */
export function normalizeEmptyStrings<T extends Record<string, any>>(
  data: T,
  fieldsToNormalize: (keyof T)[]
): T {
  const normalized = { ...data };
  
  fieldsToNormalize.forEach(field => {
    if (normalized[field] === '') {
      normalized[field] = null as any;
    }
  });
  
  return normalized;
}

/**
 * 数値フィールドの正規化
 * 空文字や不正な値をnullに変換
 */
export function normalizeNumericFields<T extends Record<string, any>>(
  data: T,
  numericFields: (keyof T)[]
): T {
  const normalized = { ...data };
  
  numericFields.forEach(field => {
    const value = normalized[field];
    if (value === '' || value === null || value === undefined) {
      normalized[field] = null as any;
    } else if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        normalized[field] = null as any;
      } else {
        normalized[field] = parsed as any;
      }
    }
  });
  
  return normalized;
}

/**
 * 配列フィールドの正規化
 * 空配列をnullに変換
 */
export function normalizeArrayFields<T extends Record<string, any>>(
  data: T,
  arrayFields: (keyof T)[]
): T {
  const normalized = { ...data };
  
  arrayFields.forEach(field => {
    const value = normalized[field];
    if (Array.isArray(value) && value.length === 0) {
      normalized[field] = null as any;
    }
  });
  
  return normalized;
}

/**
 * Post データの正規化
 */
export function normalizePostPayload(data: any) {
  let normalized = normalizeEmptyStrings(data, [
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
export function normalizeServicePayload(data: any) {
  let normalized = normalizeEmptyStrings(data, [
    'description',
    'category',
    'cta_text',
    'cta_url'
  ]);
  
  normalized = normalizeNumericFields(normalized, [
    'price',
    'duration_months'
  ]);
  
  // features配列の正規化
  if (normalized.features) {
    if (Array.isArray(normalized.features)) {
      // 空文字やnull要素を除去
      normalized.features = normalized.features
        .filter((feature: any) => feature && feature.trim() !== '');
    } else {
      normalized.features = null;
    }
  }
  
  // media配列の正規化
  if (normalized.media) {
    if (Array.isArray(normalized.media)) {
      // 各メディアオブジェクトの正規化とバリデーション
      normalized.media = normalized.media
        .filter((media: any) => media && media.url && media.url.trim() !== '')
        .map((media: any) => ({
          type: media.type || 'image',
          url: media.url.trim(),
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
export function normalizeCaseStudyPayload(data: any) {
  let normalized = normalizeEmptyStrings(data, [
    'problem',
    'solution', 
    'result'
  ]);
  
  // tags配列の正規化
  if (normalized.tags) {
    if (Array.isArray(normalized.tags)) {
      // 空文字やnull要素を除去
      normalized.tags = normalized.tags
        .filter((tag: any) => tag && tag.trim() !== '');
      
      // 空配列の場合はnullに
      if (normalized.tags.length === 0) {
        normalized.tags = null;
      }
    } else {
      normalized.tags = null;
    }
  }
  
  return normalized;
}


/**
 * FAQ データの正規化
 */
export function normalizeFAQPayload(data: any) {
  const normalized = normalizeEmptyStrings(data, ['category']);
  
  return normalized;
}

/**
 * Organization データの正規化
 */
export function normalizeOrganizationPayload(data: any) {
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
    'founded',
    'establishment_date',
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
  if (normalized.brand_color_primary && !/^#[0-9A-Fa-f]{6}$/.test(normalized.brand_color_primary)) {
    normalized.brand_color_primary = null;
  }
  if (normalized.brand_color_secondary && !/^#[0-9A-Fa-f]{6}$/.test(normalized.brand_color_secondary)) {
    normalized.brand_color_secondary = null;
  }
  
  // social_media object validation
  if (normalized.social_media && typeof normalized.social_media === 'object') {
    const allowedKeys = ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok', 'github', 'note', 'qiita', 'zenn'];
    const validSocialMedia: any = {};
    
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
      .filter((hours: any) => {
        return (
          hours &&
          typeof hours === 'object' &&
          validDays.includes(hours.day) &&
          typeof hours.is_open === 'boolean' &&
          (!hours.is_open || (
            hours.open_time && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hours.open_time) &&
            hours.close_time && /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(hours.close_time)
          ))
        );
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
  details?: any;
  errorId?: string;
}

/**
 * 統一されたエラーレスポンス生成
 */
export function createErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: any,
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
export function createConflictError(message: string, details?: any): Response {
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