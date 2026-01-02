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

// =====================================================
// QNA STATS BOUNDARY TYPES
// =====================================================

/**
 * qna_stats ビューの行型
 */
export interface QnaStatsViewRow {
  qna_id: string;
  question: string;
  category_name?: string | null;
  organization_name?: string | null;
  view_count?: number | null;
  unique_view_count?: number | null;
  last_activity_at?: string | null;
}

/**
 * qna_stats ビュー結果の境界変換
 */
export function toQnaStatsViewRows(input: unknown): QnaStatsViewRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      qna_id: String(o.qna_id ?? ''),
      question: typeof o.question === 'string' ? o.question : '',
      category_name: typeof o.category_name === 'string' ? o.category_name : null,
      organization_name: typeof o.organization_name === 'string' ? o.organization_name : null,
      view_count: typeof o.view_count === 'number' ? o.view_count : null,
      unique_view_count: typeof o.unique_view_count === 'number' ? o.unique_view_count : null,
      last_activity_at: typeof o.last_activity_at === 'string' ? o.last_activity_at : null,
    };
  }).filter(r => r.qna_id !== '');
}

/**
 * qa_entries + join結果の行型
 */
export interface QaEntryWithRelations {
  id: string;
  question: string;
  organization_id?: string;
  category_id?: string | null;
  created_at?: string;
  organizations?: { name?: string } | null;
  qa_categories?: { name?: string } | null;
}

/**
 * qa_entries + join結果の境界変換
 */
export function toQaEntriesWithRelations(input: unknown): QaEntryWithRelations[] {
  if (!Array.isArray(input)) return [];
  return input.map((r) => {
    const o = r as Record<string, unknown>;
    const orgs = o.organizations as Record<string, unknown> | null | undefined;
    const cats = o.qa_categories as Record<string, unknown> | null | undefined;
    return {
      id: String(o.id ?? ''),
      question: typeof o.question === 'string' ? o.question : '',
      organization_id: typeof o.organization_id === 'string' ? o.organization_id : undefined,
      category_id: typeof o.category_id === 'string' ? o.category_id : null,
      created_at: typeof o.created_at === 'string' ? o.created_at : undefined,
      organizations: orgs ? { name: typeof orgs.name === 'string' ? orgs.name : undefined } : null,
      qa_categories: cats ? { name: typeof cats.name === 'string' ? cats.name : undefined } : null,
    };
  }).filter(r => r.id !== '');
}

// =====================================================
// CONTENT UNION VIEW BOUNDARY TYPES
// =====================================================

/**
 * content_union_view の行型
 */
export interface ContentUnionViewRow {
  id: string;
  content_type: string;
  title?: string | null;
  is_published?: boolean;
  canonical_url?: string | null;
  organization_id?: string;
  created_at?: string;
}

/**
 * content_union_view 結果の境界変換
 */
export function toContentUnionViewRows(input: unknown): ContentUnionViewRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((r) => {
    const o = r as Record<string, unknown>;
    return {
      id: String(o.id ?? ''),
      content_type: typeof o.content_type === 'string' ? o.content_type : '',
      title: typeof o.title === 'string' ? o.title : null,
      is_published: typeof o.is_published === 'boolean' ? o.is_published : undefined,
      canonical_url: typeof o.canonical_url === 'string' ? o.canonical_url : null,
      organization_id: typeof o.organization_id === 'string' ? o.organization_id : undefined,
      created_at: typeof o.created_at === 'string' ? o.created_at : undefined,
    };
  }).filter(r => r.id !== '');
}
