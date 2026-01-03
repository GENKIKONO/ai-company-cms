/**
 * db-boundary.ts
 *
 * 動的テーブルアクセスの境界隔離モジュール
 *
 * ポリシー:
 * - 内部のみ any 許容（実装内部限定）
 * - 外部公開の戻り値は具体的な Domain 型 or Result 型で固定
 * - Supabase クライアントの動的アクセスは全てここに集約
 *
 * @internal このモジュールは内部専用。外部からは error-mapping.ts の Facade を使用
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// =====================================================
// TYPES
// =====================================================

/** テーブル名の型 */
export type TableName = keyof Database['public']['Tables'];

/** クエリ結果の型 */
export interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

// =====================================================
// INTERNAL DYNAMIC ACCESS (any は内部のみ)
// =====================================================

/**
 * 動的テーブルからの単一レコード取得（内部用）
 *
 * @internal 外部からは fetchOrganizationResource / fetchUserResource を使用
 */
export async function _fetchSingleFromDynamicTable<TRow>(
  supabase: SupabaseClient<Database>,
  tableName: TableName,
  filters: Record<string, string>
): Promise<QueryResult<TRow>> {
  let query = (supabase as any).from(tableName).select('*');

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query.maybeSingle();

  return {
    data: data as TRow | null,
    error: error ? { message: error.message, code: error.code } : null,
  };
}

/**
 * 動的テーブルからの複数レコード取得（内部用）
 *
 * @internal 外部からは型安全な Facade を使用
 */
export async function _fetchManyFromDynamicTable<TRow>(
  supabase: SupabaseClient<Database>,
  tableName: TableName,
  filters: Record<string, string>,
  options?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  }
): Promise<QueryResult<TRow[]>> {
  let query = (supabase as any).from(tableName).select('*');

  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }

  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  return {
    data: (data as TRow[] | null) ?? [],
    error: error ? { message: error.message, code: error.code } : null,
  };
}
