/**
 * Generic Type Normalizers
 * as any パターン除去用の型安全なユーティリティ
 */

/**
 * 特定の型Vを持つキーのみを抽出
 */
export type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/**
 * 日付フィールド候補（string | null | undefined）を持つオブジェクトのキー抽出
 */
export type DateFieldKeys<T> = KeysOfType<T, string | null | undefined>;

/**
 * 型安全な空日付フィールド検出
 * @param obj 検査対象オブジェクト
 * @param keys 日付フィールドのキー配列（as const推奨）
 * @returns 空文字が検出されたフィールド名の配列
 */
export function findEmptyDateFields<T extends Record<string, unknown>>(
  obj: T,
  keys: readonly (keyof T)[]
): string[] {
  const empty: string[] = [];
  for (const k of keys) {
    const v = obj[k];
    if (v === '' || v === null || v === undefined) {
      empty.push(String(k));
    }
  }
  return empty;
}

/**
 * 型安全なINSERT用正規化
 * @param obj 正規化対象オブジェクト
 * @param replacers フィールドごとのカスタム変換関数
 * @returns 正規化されたオブジェクト
 */
export function normalizeForInsertTyped<T extends object>(
  obj: T,
  replacers: Partial<Record<keyof T, (v: unknown) => unknown>> = {}
): T {
  const out: Record<string, unknown> = {};
  for (const k in obj) {
    const val = obj[k];
    const r = replacers[k as keyof T];
    out[k] = r ? r(val) : val;
  }
  return out as T;
}

/**
 * 日付フィールドの空文字をnullに変換
 * @param obj 対象オブジェクト
 * @param dateFields 日付フィールドのキー配列
 */
export function nullifyEmptyDateFields<T extends Record<string, unknown>>(
  obj: T,
  dateFields: readonly (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of dateFields) {
    const v = result[field];
    if (v === '' || v === undefined) {
      (result as Record<string, unknown>)[field as string] = null;
    }
  }
  return result;
}

/**
 * includes型ガードの健全化ヘルパー
 * 配列に値が含まれるかを型安全にチェック
 */
export function createIncludesGuard<const T extends readonly string[]>(
  allowed: T
): (v: unknown) => v is T[number] {
  return (v: unknown): v is T[number] =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

/**
 * Promise.race用の型安全なタイムアウトラッパー
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * PromiseSettledResult配列の型安全な展開
 */
export type PromiseSettledResultValue<T> = T extends PromiseSettledResult<infer U> ? U : never;

export function extractSettledValues<T extends readonly PromiseSettledResult<unknown>[]>(
  results: T
): { [K in keyof T]: PromiseSettledResultValue<T[K]> | undefined } {
  return results.map((r) =>
    r.status === 'fulfilled' ? r.value : undefined
  ) as { [K in keyof T]: PromiseSettledResultValue<T[K]> | undefined };
}

/**
 * JSON-LD基本型
 */
export interface JsonLdBase {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'WebSite' | 'LocalBusiness' | string;
  name?: string;
  url?: string;
  [k: string]: unknown;
}

/**
 * JSON-LD用組織入力型（最小限）
 */
export interface JsonLdOrganizationInput {
  name: string;
  url?: string;
  description?: string;
  address_locality?: string;
  address_region?: string;
  telephone?: string;
}
