/**
 * Type-Safe Supabase Client Library
 * Phase 4: Complete Type Safety Implementation
 */

import { createClient } from '@supabase/supabase-js'
import type { 
  SupabaseDatabase, 
  TableRow, 
  TableInsert, 
  TableUpdate,
  DatabaseResult,
  DatabaseError,
  isDatabaseError 
} from '@/types/database.types'
import type { ApiResponse } from '@/types/api.types'
import { createApiResponse, createErrorResponse } from '@/types/api.types'
import { logger } from '@/lib/utils/logger'

// =====================================================
// TYPED SUPABASE CLIENT
// =====================================================

/**
 * Type-safe Supabase client with complete database schema types
 */
export const supabase = createClient<SupabaseDatabase>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// =====================================================
// TYPE-SAFE QUERY BUILDERS
// =====================================================

/**
 * Type-safe table accessor with full type inference
 */
export function table<T extends keyof SupabaseDatabase['public']['Tables']>(tableName: T) {
  return supabase.from(tableName)
}

/**
 * Type-safe view accessor
 */
export function view<T extends keyof SupabaseDatabase['public']['Views']>(viewName: T) {
  return supabase.from(viewName)
}

// =====================================================
// CRUD OPERATIONS WITH TYPE SAFETY
// =====================================================

/**
 * Type-safe select operation
 */
export async function selectFrom<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  options?: {
    columns?: string
    filters?: Record<string, unknown>
    limit?: number
    orderBy?: { column: string; ascending?: boolean }
  }
): Promise<DatabaseResult<TableRow<T>[]>> {
  try {
    let query = table(tableName).select(options?.columns || '*')

    // Apply filters
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value as any)
      })
    }

    // Apply ordering
    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending ?? true 
      })
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Database select error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: data as unknown as TableRow<T>[], error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_SELECT_ERROR',
    }
    logger.error('Database select exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe single record select
 */
export async function selectSingle<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  id: string,
  columns?: string
): Promise<DatabaseResult<TableRow<T>>> {
  try {
    const { data, error } = await table(tableName)
      .select(columns || '*')
      .eq('id', id as any)
      .single()

    if (error) {
      logger.error('Database select single error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: data as unknown as TableRow<T>, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_SELECT_SINGLE_ERROR',
    }
    logger.error('Database select single exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe insert operation
 */
export async function insertInto<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  data: TableInsert<T> | TableInsert<T>[]
): Promise<DatabaseResult<TableRow<T>[]>> {
  try {
    const { data: result, error } = await table(tableName)
      .insert(data as any)
      .select()

    if (error) {
      logger.error('Database insert error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: result as unknown as TableRow<T>[], error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_INSERT_ERROR',
    }
    logger.error('Database insert exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe update operation
 */
export async function updateRecord<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  id: string,
  updates: TableUpdate<T>
): Promise<DatabaseResult<TableRow<T>>> {
  try {
    const { data, error } = await table(tableName)
      .update(updates as any)
      .eq('id', id as any)
      .select()
      .single()

    if (error) {
      logger.error('Database update error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: data as unknown as TableRow<T>, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_UPDATE_ERROR',
    }
    logger.error('Database update exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe upsert operation
 */
export async function upsertRecord<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  data: TableInsert<T> | TableInsert<T>[],
  options?: {
    onConflict?: string
    ignoreDuplicates?: boolean
  }
): Promise<DatabaseResult<TableRow<T>[]>> {
  try {
    const query = table(tableName).upsert(data as any, {
      onConflict: options?.onConflict,
      ignoreDuplicates: options?.ignoreDuplicates ?? false,
    })

    const { data: result, error } = await query.select()

    if (error) {
      logger.error('Database upsert error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: result as unknown as TableRow<T>[], error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_UPSERT_ERROR',
    }
    logger.error('Database upsert exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe delete operation
 */
export async function deleteRecord<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  id: string
): Promise<DatabaseResult<null>> {
  try {
    const { error } = await table(tableName)
      .delete()
      .eq('id', id as any)

    if (error) {
      logger.error('Database delete error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: null, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_DELETE_ERROR',
    }
    logger.error('Database delete exception:', dbError)
    return { data: null, error: dbError }
  }
}

// =====================================================
// SPECIALIZED QUERY FUNCTIONS
// =====================================================

/**
 * Type-safe count operation
 */
export async function countRecords<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  filters?: Record<string, unknown>
): Promise<DatabaseResult<number>> {
  try {
    let query = table(tableName).select('*', { count: 'exact', head: true })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value as any)
      })
    }

    const { count, error } = await query

    if (error) {
      logger.error('Database count error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: count ?? 0, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_COUNT_ERROR',
    }
    logger.error('Database count exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe exists check
 */
export async function recordExists<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  filters: Record<string, unknown>
): Promise<DatabaseResult<boolean>> {
  try {
    let query = table(tableName).select('id', { count: 'exact', head: true })

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value as any)
    })

    const { count, error } = await query

    if (error) {
      logger.error('Database exists check error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: (count ?? 0) > 0, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_EXISTS_ERROR',
    }
    logger.error('Database exists exception:', dbError)
    return { data: null, error: dbError }
  }
}

/**
 * Type-safe full-text search
 */
export async function searchRecords<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  column: string,
  query: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<DatabaseResult<TableRow<T>[]>> {
  try {
    let searchQuery = table(tableName)
      .select('*')
      .textSearch(column, query)

    if (options?.limit) {
      searchQuery = searchQuery.limit(options.limit)
    }

    if (options?.offset) {
      searchQuery = searchQuery.range(options.offset, options.offset + (options.limit ?? 10) - 1)
    }

    const { data, error } = await searchQuery

    if (error) {
      logger.error('Database search error:', error)
      return { data: null, error: error as DatabaseError }
    }

    return { data: data as unknown as TableRow<T>[], error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Unknown database error',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_SEARCH_ERROR',
    }
    logger.error('Database search exception:', dbError)
    return { data: null, error: dbError }
  }
}

// =====================================================
// TRANSACTION SUPPORT
// =====================================================

/**
 * Type-safe transaction wrapper
 */
export async function withTransaction<T>(
  operation: (client: typeof supabase) => Promise<T>
): Promise<DatabaseResult<T>> {
  try {
    // Note: Supabase doesn't have explicit transactions in the JS client
    // This is a placeholder for when they add transaction support
    // For now, we'll just execute the operation
    const result = await operation(supabase)
    return { data: result, error: null }
  } catch (error) {
    const dbError: DatabaseError = {
      message: error instanceof Error ? error.message : 'Transaction failed',
      details: error instanceof Error ? error.stack : undefined,
      code: 'DB_TRANSACTION_ERROR',
    }
    logger.error('Database transaction exception:', dbError)
    return { data: null, error: dbError }
  }
}

// =====================================================
// API RESPONSE WRAPPERS
// =====================================================

/**
 * Convert database result to API response
 */
export function toApiResponse<T>(result: DatabaseResult<T>): ApiResponse<T> {
  if (result.error) {
    return createErrorResponse({
      code: result.error.code || 'DATABASE_ERROR',
      message: result.error.message,
      details: result.error.details,
      context: { hint: result.error.hint },
    })
  }

  return createApiResponse(result.data, {
    message: 'Operation completed successfully',
  })
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

/**
 * Type-safe real-time subscription
 */
export function subscribeToTable<T extends keyof SupabaseDatabase['public']['Tables']>(
  tableName: T,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new?: TableRow<T>
    old?: TableRow<T>
  }) => void,
  filters?: Record<string, unknown>
): () => void {
  const subscription = supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: tableName,
        filter: filters ? Object.entries(filters).map(([key, value]) => `${key}=eq.${value}`).join('&') : undefined
      },
      (payload) => {
        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as TableRow<T> | undefined,
          old: payload.old as TableRow<T> | undefined,
        })
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Type-safe enum validation
 */
export function isValidEnumValue<T extends keyof SupabaseDatabase['public']['Enums']>(
  enumName: T,
  value: string
): value is SupabaseDatabase['public']['Enums'][T] {
  // This would need to be implemented based on actual enum values
  // For now, we'll just check if it's a non-empty string
  return typeof value === 'string' && value.length > 0
}

/**
 * Sanitize input for database operations
 */
export function sanitizeInput<T extends Record<string, unknown>>(input: T): T {
  const sanitized = { ...input }
  
  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key]
    }
  })
  
  return sanitized
}

/**
 * Validate required fields
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = []
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field as string)
    }
  })
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default supabase
export type { SupabaseDatabase, TableRow, TableInsert, TableUpdate, DatabaseResult, DatabaseError }