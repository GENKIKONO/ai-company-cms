/**
 * Complete Supabase Database Type Definitions
 * Phase 4: Type Safety - Comprehensive Database Schema Types
 *
 * NOTE: SupabaseDatabase is now delegated to generated ./supabase.ts
 * which includes all secure dashboard views (v_dashboard_*_secure)
 */

// Re-export base types from database.ts for compatibility
export * from '@/types/database'

// Import generated Database type from supabase.ts
import type { Database as GeneratedDatabase } from './supabase'

// =====================================================
// SUPABASE DATABASE SCHEMA TYPE DEFINITIONS
// =====================================================

/**
 * Complete Supabase Database Schema
 * Delegated to generated supabase.ts (includes secure dashboard views)
 *
 * Available views:
 * - v_dashboard_posts_secure
 * - v_dashboard_services_secure
 * - v_dashboard_case_studies_secure
 * - v_dashboard_faqs_secure
 */
export type SupabaseDatabase = GeneratedDatabase

// =====================================================
// TYPE-SAFE SUPABASE CLIENT WRAPPER
// =====================================================

/**
 * Type-safe Supabase client interface
 * Ensures all database operations are properly typed
 */
export type TypedSupabaseClient = {
  from<T extends keyof SupabaseDatabase['public']['Tables']>(
    table: T
  ): {
    select: <K extends keyof SupabaseDatabase['public']['Tables'][T]['Row'] | '*'>(
      columns?: K | string
    ) => Promise<{
      data: K extends '*'
        ? SupabaseDatabase['public']['Tables'][T]['Row'][] | null
        : Pick<SupabaseDatabase['public']['Tables'][T]['Row'], K extends keyof SupabaseDatabase['public']['Tables'][T]['Row'] ? K : never>[] | null
      error: Error | null
    }>

    insert: (
      values: SupabaseDatabase['public']['Tables'][T]['Insert'] | SupabaseDatabase['public']['Tables'][T]['Insert'][]
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>

    update: (
      values: SupabaseDatabase['public']['Tables'][T]['Update']
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>

    delete: () => Promise<{
      data: null
      error: Error | null
    }>

    upsert: (
      values: SupabaseDatabase['public']['Tables'][T]['Insert'] | SupabaseDatabase['public']['Tables'][T]['Insert'][]
    ) => Promise<{
      data: SupabaseDatabase['public']['Tables'][T]['Row'][] | null
      error: Error | null
    }>
  }
}

// =====================================================
// QUERY BUILDER TYPES
// =====================================================

/**
 * Type-safe query builder for complex database operations
 */
export interface TypedQueryBuilder<T> {
  eq<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  neq<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  gt<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  gte<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  lt<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  lte<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  like<K extends keyof T>(column: K, pattern: string): TypedQueryBuilder<T>
  ilike<K extends keyof T>(column: K, pattern: string): TypedQueryBuilder<T>
  is<K extends keyof T>(column: K, value: null): TypedQueryBuilder<T>
  in<K extends keyof T>(column: K, values: T[K][]): TypedQueryBuilder<T>
  contains<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  containedBy<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  rangeGt<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeGte<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeLt<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeLte<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  rangeAdjacent<K extends keyof T>(column: K, range: string): TypedQueryBuilder<T>
  overlaps<K extends keyof T>(column: K, value: T[K]): TypedQueryBuilder<T>
  textSearch<K extends keyof T>(column: K, query: string, config?: string): TypedQueryBuilder<T>
  match<K extends keyof T>(query: { [P in K]?: T[P] }): TypedQueryBuilder<T>
  not<K extends keyof T>(column: K, operator: string, value: T[K]): TypedQueryBuilder<T>
  or(filters: string): TypedQueryBuilder<T>
  filter<K extends keyof T>(column: K, operator: string, value: T[K]): TypedQueryBuilder<T>
  single(): Promise<{ data: T | null; error: Error | null }>
  maybeSingle(): Promise<{ data: T | null; error: Error | null }>
  limit(count: number): TypedQueryBuilder<T>
  order<K extends keyof T>(
    column: K,
    options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string }
  ): TypedQueryBuilder<T>
  range(from: number, to: number): TypedQueryBuilder<T>
  abortSignal(signal: AbortSignal): TypedQueryBuilder<T>
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Extract table row type
 */
export type TableRow<T extends keyof SupabaseDatabase['public']['Tables']> =
  SupabaseDatabase['public']['Tables'][T]['Row']

/**
 * Extract table insert type
 */
export type TableInsert<T extends keyof SupabaseDatabase['public']['Tables']> =
  SupabaseDatabase['public']['Tables'][T]['Insert']

/**
 * Extract table update type
 */
export type TableUpdate<T extends keyof SupabaseDatabase['public']['Tables']> =
  SupabaseDatabase['public']['Tables'][T]['Update']

/**
 * Extract enum values
 */
export type EnumValues<T extends keyof SupabaseDatabase['public']['Enums']> =
  SupabaseDatabase['public']['Enums'][T]

/**
 * Database error type
 */
export interface DatabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

/**
 * Type guard for database errors
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as DatabaseError).message === 'string'
  )
}

/**
 * Type-safe database operation result
 */
export interface DatabaseResult<T> {
  data: T | null
  error: DatabaseError | null
  count?: number | null
}

/**
 * Generic database operation function type
 */
export type DatabaseOperation<TInput, TOutput> = (
  input: TInput
) => Promise<DatabaseResult<TOutput>>

// =====================================================
// RELATION TYPES
// =====================================================

/**
 * Organization with related data
 */
export type OrganizationWithRelations = TableRow<'organizations'> & {
  services?: TableRow<'services'>[]
  posts?: TableRow<'posts'>[]
  case_studies?: TableRow<'case_studies'>[]
  faqs?: TableRow<'faqs'>[]
  qa_entries?: TableRow<'qa_entries'>[]
  partner?: TableRow<'partners'>
  creator?: TableRow<'profiles'>
}

/**
 * QA Entry with category
 */
export type QAEntryWithCategory = TableRow<'qa_entries'> & {
  qa_categories?: Pick<TableRow<'qa_categories'>, 'id' | 'name' | 'slug'> | null
}

/**
 * User with profile
 */
export type UserWithProfile = {
  id: string
  email: string | null
  profile: TableRow<'profiles'> | null
}

/**
 * Question with details
 * NOTE: Uses 'questions' table if available in schema
 */
export interface QuestionWithDetails {
  id: string
  title?: string
  content?: string
  status?: string
  user_id?: string
  organization_id?: string
  created_at?: string
  updated_at?: string
  user_email?: string
  user_full_name?: string
  company_name?: string
  answerer_name?: string
}

// =====================================================
// ADVANCED TYPE UTILITIES
// =====================================================

/**
 * Make all properties except specified ones optional
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Exclude null and undefined
 */
export type NonNullable<T> = T extends null | undefined ? never : T

/**
 * Extract non-nullable properties
 */
export type NonNullableKeys<T> = {
  [K in keyof T]: T[K] extends null | undefined ? never : K
}[keyof T]

/**
 * Make specified properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * JSON value type for database storage
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Type-safe JSON object
 */
export interface JsonObject {
  [key: string]: Json | undefined
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

/**
 * Sort parameters
 */
export interface SortParams<T = Record<string, unknown>> {
  column: keyof T
  ascending?: boolean
  nullsFirst?: boolean
}

/**
 * Filter parameters
 */
export interface FilterParams<T = Record<string, unknown>> {
  [key: string]: {
    column: keyof T
    operator: string
    value: unknown
  }
}

/**
 * Complete query parameters
 */
export interface QueryParams<T = Record<string, unknown>> {
  pagination?: PaginationParams
  sort?: SortParams<T>[]
  filters?: FilterParams<T>
  search?: {
    query: string
    columns?: (keyof T)[]
  }
}
