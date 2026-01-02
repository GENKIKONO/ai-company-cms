/**
 * Supabase Boundary Adapters
 *
 * Supabase RPC/ビューの戻り値をドメイン型に変換するための境界アダプタ
 * - 内部anyをゼロ化しつつ、アサーションは一箇所に集約
 * - 境界に限定してas型アサーションを許可
 */

import type { Database } from '@/types/supabase';

type Pub = Database['public'];

// View行型
export type ViewRow<V extends keyof Pub['Views']> = Pub['Views'][V]['Row'];

// Function戻り値型
export type FuncRet<F extends keyof Pub['Functions']> = Pub['Functions'][F]['Returns'];

// Table行型
export type TableRow<T extends keyof Pub['Tables']> = Pub['Tables'][T]['Row'];

// 境界アダプタ: View行へのキャスト（境界に限定）
export function asViewRow<V extends keyof Pub['Views']>(u: unknown): ViewRow<V> {
  return u as ViewRow<V>;
}

// 境界アダプタ: Function戻り値へのキャスト（境界に限定）
export function asFuncRet<F extends keyof Pub['Functions']>(u: unknown): FuncRet<F> {
  return u as FuncRet<F>;
}

// 境界アダプタ: Table行へのキャスト（境界に限定）
export function asTableRow<T extends keyof Pub['Tables']>(u: unknown): TableRow<T> {
  return u as TableRow<T>;
}

// 境界アダプタ: 配列用
export function asViewRows<V extends keyof Pub['Views']>(u: unknown): ViewRow<V>[] {
  return (u ?? []) as ViewRow<V>[];
}

export function asFuncRetArray<F extends keyof Pub['Functions']>(u: unknown): FuncRet<F> {
  return (u ?? []) as FuncRet<F>;
}

export function asTableRows<T extends keyof Pub['Tables']>(u: unknown): TableRow<T>[] {
  return (u ?? []) as TableRow<T>[];
}

// Supabase data結果のnull安全変換
export function unwrapData<T>(data: T | null): T | undefined {
  return data ?? undefined;
}

// Supabase配列結果のnull安全変換
export function unwrapDataArray<T>(data: T[] | null): T[] {
  return data ?? [];
}

// =====================================================
// FILTER VALUE BOUNDARY HELPERS
// =====================================================
// Supabaseのeq/insert/update等は厳密な型を要求するため
// 境界でのみasを使用し、呼び出し元からasを排除

/**
 * フィルター値の境界キャスト
 * .eq(key, value) の value に使用
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asFilterValue(value: unknown): any {
  return value;
}

/**
 * Insert/Upsertデータの境界キャスト
 * .insert(data) / .upsert(data) の data に使用
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asInsertData<T>(data: T): any {
  return data;
}

/**
 * Updateデータの境界キャスト
 * .update(data) の data に使用
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function asUpdateData<T>(data: T): any {
  return data;
}
