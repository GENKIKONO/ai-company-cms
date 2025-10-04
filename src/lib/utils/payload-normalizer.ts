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
export function normalizeDateFields(obj: any, dateFields: string[] = ['created_at', 'updated_at', 'established_at']): any {
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

// GPT恒久対策: 型定義
type AnyObj = Record<string, any>;

/** 空文字や空配列/空オブジェクトを安全に除去・変換（恒久対策） */
export function normalizeForInsert<T extends AnyObj>(
  obj: T,
  opts?: {
    dateFields?: string[];
  }
): T {
  const dateFields = opts?.dateFields ?? ['established_at', 'founded']; // 必要なら追加
  const out: AnyObj = { ...obj };

  // 1) 全フィールドの空文字を undefined に
  for (const k of Object.keys(out)) {
    if (out[k] === '') out[k] = undefined;
    if (Array.isArray(out[k]) && out[k].length === 0) out[k] = undefined;
    if (typeof out[k] === 'object' && out[k] && Object.keys(out[k]).length === 0) {
      out[k] = undefined;
    }
  }

  // 2) DATE フィールドは null に統一（undefined でも OK だが意図を明確化）
  for (const field of dateFields) {
    if (field in out && (out[field] === '' || out[field] === undefined)) {
      out[field] = null;
    }
  }

  return out as T;
}

/** デバッグ用: 空文字の日付フィールドを検出 */
export function findEmptyDateFields(obj: Record<string, any>, fields: string[]): string[] {
  return fields.filter(f => f in obj && obj[f] === '');
}