/**
 * ペイロード正規化ユーティリティ
 * 空文字→null変換、email補完などを統一処理
 */

/**
 * 空文字列をnullに変換（再帰的）
 */
export function normalizeEmptyStrings(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return obj.trim() === '' ? null : obj.trim();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(normalizeEmptyStrings);
  }
  
  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[key] = normalizeEmptyStrings(value);
    }
    return normalized;
  }
  
  return obj;
}

/**
 * 日付フィールドの正規化（空文字 → null）
 */
export function normalizeDateFields(obj: any, dateFields: string[] = ['created_at', 'updated_at']): any {
  const normalized = { ...obj };
  
  for (const field of dateFields) {
    if (field in normalized) {
      const value = normalized[field];
      if (typeof value === 'string' && value.trim() === '') {
        normalized[field] = null;
      }
    }
  }
  
  return normalized;
}

/**
 * email補完（認証済みユーザーから取得）
 */
export function supplementEmailFromAuth(payload: any, userEmail?: string): any {
  const supplemented = { ...payload };
  
  if (!supplemented.email && userEmail) {
    supplemented.email = userEmail;
  }
  
  return supplemented;
}

/**
 * 統合正規化関数
 */
export function normalizePayload(payload: any, userEmail?: string, dateFields?: string[]): any {
  let normalized = normalizeEmptyStrings(payload);
  normalized = normalizeDateFields(normalized, dateFields);
  normalized = supplementEmailFromAuth(normalized, userEmail);
  
  return normalized;
}