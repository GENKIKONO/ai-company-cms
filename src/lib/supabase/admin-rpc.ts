/**
 * Supabase RPC クライアントのラッパー
 * P4-8: Super Admin Console用のRPC関数呼び出し
 * 
 * 機能:
 * 1. Content refresh history取得
 * 2. KPI metrics取得（RLS拒否、Edge失敗率、public_*の鮮度）
 * 3. レガシーview管理とschema diff候補
 * 4. 型安全なレスポンス処理
 */

import { createClient } from '@/lib/supabase/server';

// Content refresh関連の型定義
export interface ContentRefreshHistoryItem {
  job_id: string;
  entity_type: string;
  entity_id: string;
  content_version: number;
  trigger_source: string;
  status: 'running' | 'succeeded' | 'failed' | 'partial_error';
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  steps: Array<{
    step: string;
    status: string;
    started_at: string;
    finished_at: string;
    duration_ms: number;
    items_processed?: number;
    error_message?: string;
  }>;
  error_message?: string;
}

export interface ContentRefreshHistoryParams {
  limit?: number;
  offset?: number;
}

// KPI関連の型定義
export interface RlsDeniesTop5Item {
  table_name: string;
  endpoint: string;
  deny_count: number;
  last_denied_at: string;
}

export interface EdgeFailureStatsItem {
  job_name: string;
  total_runs: number;
  failed_runs: number;
  failure_rate: number;
  last_run_at: string;
}

export interface PublicTablesFreshnessItem {
  table_name: string;
  latest_updated_at: string;
  staleness_seconds: number;
  staleness_display: string;
}

// スキーマ管理関連の型定義
export interface LegacyViewsOverdueItem {
  view_name: string;
  remove_after: string;
  days_overdue: number;
  description: string;
}

export interface SchemaDiffCandidateItem {
  object_type: string;
  object_name: string;
  schema_name: string;
  created_at: string;
  is_ignored: boolean;
}

// エラーレスポンス型
export interface RPCError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * サーバーサイド用のSupabaseクライアント取得
 */
async function getServerSupabaseClient() {
  return await createClient();
}

/**
 * Content refresh履歴取得
 */
export async function getContentRefreshHistory(
  params: ContentRefreshHistoryParams = {}
): Promise<{ data: ContentRefreshHistoryItem[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();
    const { limit = 50, offset = 0 } = params;

    const { data, error } = await supabase.rpc('admin_get_content_refresh_history_guarded', {
      p_limit: limit,
      p_offset: offset
    });

    if (error) {
      console.error('getContentRefreshHistory error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getContentRefreshHistory exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * RLS拒否 Top5 取得
 */
export async function getRlsDeniesTop5(): Promise<{ data: RlsDeniesTop5Item[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase.rpc('admin_get_rls_denies_top5');

    if (error) {
      console.error('getRlsDeniesTop5 error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getRlsDeniesTop5 exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Edge関数失敗統計取得
 */
export async function getEdgeFailureStats(): Promise<{ data: EdgeFailureStatsItem[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase.rpc('admin_get_edge_failure_stats');

    if (error) {
      console.error('getEdgeFailureStats error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getEdgeFailureStats exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * public_* テーブル鮮度取得
 */
export async function getPublicTablesFreshness(): Promise<{ data: PublicTablesFreshnessItem[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase.rpc('admin_get_public_tables_freshness');

    if (error) {
      console.error('getPublicTablesFreshness error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getPublicTablesFreshness exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * レガシーview期限切れ取得
 */
export async function getLegacyViewsOverdue(): Promise<{ data: LegacyViewsOverdueItem[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase.rpc('admin_check_legacy_views_overdue');

    if (error) {
      console.error('getLegacyViewsOverdue error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getLegacyViewsOverdue exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * スキーマdiff候補取得
 */
export async function getSchemaDiffCandidates(): Promise<{ data: SchemaDiffCandidateItem[]; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data, error } = await supabase.rpc('admin_get_schema_diff_candidates');

    if (error) {
      console.error('getSchemaDiffCandidates error:', error);
      return {
        data: [],
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        }
      };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('getSchemaDiffCandidates exception:', error);
    return {
      data: [],
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Content refresh再実行
 */
export async function triggerContentRefresh(params: {
  entity_type: string;
  entity_id: string;
  target_languages?: string[];
  force_refresh?: boolean;
  skip_embedding?: boolean;
  skip_cache_purge?: boolean;
}): Promise<{ data: any; error: RPCError | null }> {
  try {
    const supabase = await getServerSupabaseClient();
    
    // content-refresh-orchestrator Edge Functionを直接呼び出し
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/content-refresh-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        trigger_source: 'admin_ui',
        options: {
          target_langs: params.target_languages,
          force_refresh: params.force_refresh,
          skip_embedding: params.skip_embedding,
          skip_cache_purge: params.skip_cache_purge
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: {
          message: `Content refresh trigger failed: ${response.status} ${errorText}`,
          code: 'TRIGGER_FAILED'
        }
      };
    }

    const result = await response.json();
    return { data: result, error: null };

  } catch (error) {
    console.error('triggerContentRefresh exception:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * 複数KPIデータを一度に取得（パフォーマンス向上用）
 */
export async function getAllKpiMetrics(): Promise<{
  rlsDenies: RlsDeniesTop5Item[];
  edgeFailures: EdgeFailureStatsItem[];
  publicFreshness: PublicTablesFreshnessItem[];
  errors: RPCError[];
}> {
  const [rlsResult, edgeResult, publicResult] = await Promise.allSettled([
    getRlsDeniesTop5(),
    getEdgeFailureStats(),
    getPublicTablesFreshness()
  ]);

  const errors: RPCError[] = [];
  
  const rlsDenies = rlsResult.status === 'fulfilled' && !rlsResult.value.error 
    ? rlsResult.value.data 
    : [];
  
  const edgeFailures = edgeResult.status === 'fulfilled' && !edgeResult.value.error
    ? edgeResult.value.data
    : [];
    
  const publicFreshness = publicResult.status === 'fulfilled' && !publicResult.value.error
    ? publicResult.value.data
    : [];

  // エラー収集
  if (rlsResult.status === 'fulfilled' && rlsResult.value.error) {
    errors.push(rlsResult.value.error);
  }
  if (edgeResult.status === 'fulfilled' && edgeResult.value.error) {
    errors.push(edgeResult.value.error);
  }
  if (publicResult.status === 'fulfilled' && publicResult.value.error) {
    errors.push(publicResult.value.error);
  }

  return {
    rlsDenies,
    edgeFailures,
    publicFreshness,
    errors
  };
}