'use client';

/**
 * useDashboardData - Dashboard統一データ取得フック
 *
 * @description
 * - DATA_SOURCESの設定に基づいてデータを取得
 * - ローディング・エラー状態を統一管理
 * - 組織スコープを自動適用
 * - リアルタイム更新対応（オプション）
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabaseBrowser as supabase } from '@/lib/supabase/client';
import { getDataSource, hasDataSourcePermission, type DataSourceKey } from '@/config/data-sources';
import { allowedViews, isAllowedView, type AllowedViewName } from '@/lib/allowlist';
import type { UserRole } from '@/types/utils/database';

// =====================================================
// ENVIRONMENT VALIDATION (run once at module load)
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log environment check once at startup
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.debug('[useDashboardData] ENV CHECK:', {
    SUPABASE_URL: SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'UNDEFINED',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 10)}...` : 'UNDEFINED',
    isValidUrl: SUPABASE_URL?.startsWith('https://') && SUPABASE_URL?.includes('.supabase.co'),
  });
}

// Guard: prevent any fetch if env vars are missing
const ENV_VALID = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('https://'));

// =====================================================
// STABLE DEFAULTS (prevent infinite re-render loops)
// =====================================================

const EMPTY_FILTERS: Record<string, unknown> = Object.freeze({});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Normalize user role for permission checks
 * Maps 'owner' to 'admin' to match DATA_SOURCES.permissions config
 */
function normalizeRole(role: UserRole | string): UserRole {
  if (role === 'owner') return 'admin';
  if (role === 'admin' || role === 'editor' || role === 'viewer') return role;
  return 'viewer'; // Default fallback
}

/**
 * Create a query for the given table/view
 * Returns any to avoid infinite type instantiation with complex Supabase types
 */
function createQuery(
  tableName: string,
  selectColumns: string,
  options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }
): any {
  // For dashboard secure views, use the allowlist
  if (isAllowedView(tableName)) {
    return supabase.from(tableName as AllowedViewName).select(selectColumns, options);
  }
  // For other tables, use dynamic access
  return (supabase as any).from(tableName).select(selectColumns, options);
}

// =====================================================
// TYPES
// =====================================================

export interface UseDashboardDataOptions<T = unknown> {
  /** 組織ID（org-scopedデータソースで必須） */
  organizationId?: string;
  /** ユーザーロール（権限チェック用） */
  userRole?: UserRole;
  /** 追加フィルター */
  filters?: Record<string, unknown>;
  /** カスタムカラム選択（デフォルト設定を上書き） */
  select?: string;
  /** ソート設定を上書き */
  orderBy?: { column: string; ascending?: boolean };
  /** 取得件数制限 */
  limit?: number;
  /** オフセット（ページネーション用） */
  offset?: number;
  /** 検索クエリ */
  searchQuery?: string;
  /** リアルタイム更新を有効化 */
  realtime?: boolean;
  /** 自動フェッチを無効化 */
  skipInitialFetch?: boolean;
  /** データ変換関数 */
  transform?: (data: unknown[]) => T[];
}

export interface UseDashboardDataResult<T> {
  /** 取得したデータ */
  data: T[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラー情報 */
  error: string | null;
  /** データが空か */
  isEmpty: boolean;
  /** 総件数 */
  totalCount: number;
  /** 手動リフレッシュ */
  refresh: () => Promise<void>;
  /** 権限エラーか */
  isPermissionError: boolean;
}

// =====================================================
// HOOK IMPLEMENTATION
// =====================================================

export function useDashboardData<T = Record<string, unknown>>(
  dataSourceKey: DataSourceKey | string,
  options: UseDashboardDataOptions<T> = {}
): UseDashboardDataResult<T> {
  const {
    organizationId,
    userRole = 'viewer',
    filters,
    select,
    orderBy,
    limit,
    offset,
    searchQuery,
    realtime = false,
    skipInitialFetch = false,
    transform,
  } = options;

  // Use stable default for filters to prevent infinite re-render loops
  const stableFilters = filters ?? EMPTY_FILTERS;

  // State
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isPermissionError, setIsPermissionError] = useState(false);

  // Get data source config
  const config = useMemo(() => getDataSource(dataSourceKey), [dataSourceKey]);

  // Permission check (normalize role to handle 'owner' → 'admin')
  const normalizedRole = useMemo(() => normalizeRole(userRole), [userRole]);
  const hasPermission = useMemo(() => {
    if (!config) return false;
    return hasDataSourcePermission(dataSourceKey, 'read', normalizedRole);
  }, [config, dataSourceKey, normalizedRole]);

  // Build filters with org scope
  const effectiveFilters = useMemo(() => {
    const result: Record<string, unknown> = { ...stableFilters };

    if (config?.requiresOrgScope && organizationId) {
      result.organization_id = organizationId;
    }

    return result;
  }, [config, organizationId, stableFilters]);

  // Enabled guard: org-scoped sources require organizationId to be set
  // This prevents queries from running before context is ready
  const isEnabled = useMemo(() => {
    if (!config) return false;
    if (config.requiresOrgScope && !organizationId) return false;
    return true;
  }, [config, organizationId]);

  // Track fetch state for debugging and preventing concurrent fetches
  const fetchCountRef = useRef(0);
  const inFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastErrorTimeRef = useRef<number>(0);
  const COOLDOWN_MS = 5000; // 5秒間のcooldown（エラー後の連打防止）

  // Fetch function with inFlight guard and AbortController
  const fetchData = useCallback(async () => {
    // ENV guard: prevent fetch if environment is invalid
    if (!ENV_VALID) {
      // eslint-disable-next-line no-console
      console.error('[useDashboardData] BLOCKED: Invalid environment variables. SUPABASE_URL or ANON_KEY is missing/invalid.');
      setError('環境設定エラー: Supabase接続情報が不正です');
      setIsLoading(false);
      return;
    }

    // inFlight guard: prevent concurrent fetches for the same query
    if (inFlightRef.current) {
      // eslint-disable-next-line no-console
      console.debug(`[useDashboardData] SKIPPED: fetch already in flight for "${dataSourceKey}"`);
      return;
    }

    // Cooldown guard: prevent rapid retries after error
    const now = Date.now();
    if (lastErrorTimeRef.current > 0 && now - lastErrorTimeRef.current < COOLDOWN_MS) {
      // eslint-disable-next-line no-console
      console.debug(`[useDashboardData] SKIPPED: cooldown active for "${dataSourceKey}" (${Math.ceil((COOLDOWN_MS - (now - lastErrorTimeRef.current)) / 1000)}s remaining)`);
      return;
    }

    // Abort previous fetch if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Debug: track fetch execution count
    fetchCountRef.current += 1;
    const fetchId = fetchCountRef.current;
    // eslint-disable-next-line no-console
    console.debug(`[useDashboardData] fetchData #${fetchId} START for "${dataSourceKey}" (orgId: ${organizationId || 'null'})`);

    if (!config) {
      setError(`データソース "${dataSourceKey}" が見つかりません`);
      setIsLoading(false);
      return;
    }

    if (!hasPermission) {
      setError('このデータへのアクセス権限がありません');
      setIsPermissionError(true);
      setIsLoading(false);
      return;
    }

    if (config.requiresOrgScope && !organizationId) {
      setError('組織IDが指定されていません');
      setIsLoading(false);
      return;
    }

    // Mark as in-flight
    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);
    setIsPermissionError(false);

    try {
      // Build query using type-safe helper (supports views via allowlist)
      let query = createQuery(config.table, select || config.defaultSelect);

      // Apply filters
      Object.entries(effectiveFilters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      const sortConfig = orderBy || config.defaultOrder;
      if (sortConfig) {
        query = query.order(sortConfig.column, { ascending: sortConfig.ascending ?? true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      // Apply offset
      if (offset && offset > 0) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) {
        // Detailed error logging for debugging network/preflight issues
        // eslint-disable-next-line no-console
        console.error(`[useDashboardData] fetchData #${fetchId} QUERY ERROR:`, {
          table: config.table,
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          supabaseUrl: SUPABASE_URL?.substring(0, 40),
        });
        throw new Error(fetchError.message || 'データの取得に失敗しました');
      }

      // Apply transform if provided
      const finalData = transform
        ? transform(result || [])
        : ((result || []) as T[]);

      setData(finalData);

      // Get total count using head: true for efficiency
      let countQuery = createQuery(config.table, '*', { count: 'exact', head: true });

      Object.entries(effectiveFilters).forEach(([key, value]) => {
        countQuery = countQuery.eq(key, value);
      });

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // eslint-disable-next-line no-console
      console.debug(`[useDashboardData] fetchData #${fetchId} SUCCESS: ${finalData.length} rows`);

    } catch (err) {
      // Set cooldown to prevent rapid retries
      lastErrorTimeRef.current = Date.now();

      // Detailed error logging for network failures
      const errorInfo = {
        name: err instanceof Error ? err.name : 'Unknown',
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      };
      // eslint-disable-next-line no-console
      console.error(`[useDashboardData] fetchData #${fetchId} CATCH ERROR:`, errorInfo);

      const message = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(message);
      setData([]);
    } finally {
      // Reset inFlight flag
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [config, hasPermission, organizationId, effectiveFilters, select, orderBy, limit, offset, transform, dataSourceKey]);

  // Initial fetch - only when enabled (organizationId confirmed for org-scoped sources)
  useEffect(() => {
    if (!skipInitialFetch && isEnabled) {
      fetchData();
    }
  }, [fetchData, skipInitialFetch, isEnabled]);

  // Realtime subscription
  useEffect(() => {
    if (!realtime || !config || !organizationId) return;

    const channel = supabase
      .channel(`dashboard:${config.table}:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.table,
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          // Refresh on any change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [realtime, config, organizationId, fetchData]);

  return {
    data,
    isLoading,
    error,
    isEmpty: !isLoading && data.length === 0,
    totalCount,
    refresh: fetchData,
    isPermissionError,
  };
}

// =====================================================
// CONVENIENCE HOOKS
// =====================================================

/**
 * 単一レコード取得用フック
 */
export function useDashboardSingleRecord<T = Record<string, unknown>>(
  dataSourceKey: DataSourceKey | string,
  id: string | null,
  options: Omit<UseDashboardDataOptions<T>, 'limit'> = {}
) {
  const result = useDashboardData<T>(dataSourceKey, {
    ...options,
    filters: id ? { ...options.filters, id } : options.filters,
    limit: 1,
    skipInitialFetch: !id,
  });

  return {
    ...result,
    data: result.data[0] || null,
  };
}

/**
 * カウント取得用フック
 */
export function useDashboardCount(
  dataSourceKey: DataSourceKey | string,
  options: Pick<UseDashboardDataOptions, 'organizationId' | 'filters'> = {}
) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { organizationId, filters } = options;
  // Use stable default for filters to prevent infinite re-render loops
  const stableFilters = filters ?? EMPTY_FILTERS;
  const config = getDataSource(dataSourceKey);

  const fetchCount = useCallback(async () => {
    if (!config) {
      setError(`データソース "${dataSourceKey}" が見つかりません`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const effectiveFilters: Record<string, unknown> = { ...stableFilters };
      if (config.requiresOrgScope && organizationId) {
        effectiveFilters.organization_id = organizationId;
      }

      // Use type-safe helper (supports views via allowlist)
      let countQuery = createQuery(config.table, '*', { count: 'exact', head: true });

      Object.entries(effectiveFilters).forEach(([key, value]) => {
        countQuery = countQuery.eq(key, value);
      });

      const { count: result, error: fetchError } = await countQuery;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setCount(result || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '件数の取得に失敗しました';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [config, dataSourceKey, organizationId, stableFilters]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, isLoading, error, refresh: fetchCount };
}
