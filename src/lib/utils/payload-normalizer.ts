/**
 * ペイロード正規化ユーティリティ
 * 空文字→null変換、email補完などを統一処理
 */

/** 正規化後の値型（null許容） */
type NormalizedValue = string | number | boolean | null | NormalizedObject | NormalizedValue[];
type NormalizedObject = { [key: string]: NormalizedValue };

/**
 * 空文字列をnullに変換（再帰的）
 */
export function normalizeEmptyStrings<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return (obj.trim() === '' ? null : obj.trim()) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeEmptyStrings) as T;
  }

  if (typeof obj === 'object') {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      normalized[key] = normalizeEmptyStrings(value);
    }
    return normalized as T;
  }

  return obj;
}

/**
 * 日付フィールドの正規化（空文字 → null）
 */
export function normalizeDateFields<T extends Record<string, unknown>>(
  obj: T,
  dateFields: string[] = ['created_at', 'updated_at', 'established_at']
): T {
  const normalized = { ...obj } as Record<string, unknown>;

  for (const field of dateFields) {
    if (field in normalized) {
      const value = normalized[field];
      if (typeof value === 'string' && value.trim() === '') {
        normalized[field] = null;
      }
    }
  }

  return normalized as T;
}

/** email付きペイロード型 */
type PayloadWithEmail = Record<string, unknown> & { email?: string };

/**
 * email補完（認証済みユーザーから取得）
 */
export function supplementEmailFromAuth<T extends PayloadWithEmail>(
  payload: T,
  userEmail?: string
): T {
  const supplemented = { ...payload };

  if (!supplemented.email && userEmail) {
    supplemented.email = userEmail;
  }

  return supplemented;
}

/**
 * 統合正規化関数
 */
export function normalizePayload<T extends Record<string, unknown>>(
  payload: T,
  userEmail?: string,
  dateFields?: string[]
): T {
  let normalized = normalizeEmptyStrings(payload);
  normalized = normalizeDateFields(normalized, dateFields);
  normalized = supplementEmailFromAuth(normalized as T & { email?: string }, userEmail);

  return normalized as T;
}

/** 空文字や空配列/空オブジェクトを安全に除去・変換 */
export function normalizeForInsert<T extends Record<string, unknown>>(
  obj: T,
  opts?: {
    dateFields?: string[];
  }
): T {
  const dateFields = opts?.dateFields ?? ['established_at'];
  const out: Record<string, unknown> = { ...obj };

  // 1) 全フィールドの空文字を undefined に
  for (const k of Object.keys(out)) {
    if (out[k] === '') out[k] = undefined;
    if (Array.isArray(out[k]) && (out[k] as unknown[]).length === 0) out[k] = undefined;
    if (typeof out[k] === 'object' && out[k] && Object.keys(out[k] as object).length === 0) {
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
export function findEmptyDateFields(obj: Record<string, unknown>, fields: string[]): string[] {
  return fields.filter(f => f in obj && obj[f] === '');
}