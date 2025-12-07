/**
 * Content Diff Job Implementation
 * Phase 3 Addendum: public_* テーブルの差分更新戦略
 */

import { createClient } from '@supabase/supabase-js';
import { beginRun, completeSuccess, completeFailure, type JobMeta } from '@/lib/job-runs';
import { getDiffRebuildThresholdPercent } from '@/lib/admin/settings';

export type ContentDiffJobTarget = 
  | 'organizations'
  | 'services' 
  | 'posts'
  | 'news'
  | 'faqs'
  | 'case_studies'
  | 'products'
  | 'organization_keywords'
  | 'ai_content_units';

export interface ContentDiffJobInput {
  target_table: ContentDiffJobTarget;
  source_data: Record<string, any>[];
  organization_id?: string;
  request_id?: string;
}

export interface ContentDiffJobResult {
  success: boolean;
  target_table: ContentDiffJobTarget;
  total_count: number;
  diff_count: number;
  is_full_rebuild: boolean;
  threshold_percent: number;
  duration_ms: number;
  error?: string;
  job_id?: string;
}

/**
 * service_role クライアント作成
 */
function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * content_hash を計算する（仮実装）
 * 注意：実際の計算ロジックはSupabase側のRPC関数と一致させる必要あり
 */
function calculateContentHash(data: Record<string, any>): string {
  // ビジネス的な内容のみからハッシュ計算
  const businessFields = ['title', 'body', 'content', 'description', 'properties'];
  const relevantData: Record<string, any> = {};
  
  for (const field of businessFields) {
    if (data[field] !== undefined) {
      relevantData[field] = data[field];
    }
  }
  
  // 簡易的なハッシュ計算（実際はcrypto.subtle.digestを使う）
  const jsonString = JSON.stringify(relevantData, Object.keys(relevantData).sort());
  return btoa(jsonString).slice(0, 64); // 仮実装
}

/**
 * 差分検出ロジック
 */
async function detectChanges(
  supabase: ReturnType<typeof createServiceRoleClient>,
  targetTable: ContentDiffJobTarget,
  sourceData: Record<string, any>[],
  organizationId?: string
): Promise<{ total_count: number; diff_count: number; changes: any[] }> {
  // 現在のデータを取得
  let query = supabase.from(`public_${targetTable}`).select('id, content_hash');
  
  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }
  
  const { data: currentData, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch current ${targetTable}: ${error.message}`);
  }
  
  const currentHashMap = new Map(
    (currentData || []).map(row => [row.id, row.content_hash])
  );
  
  const changes = [];
  
  for (const sourceRow of sourceData) {
    const newHash = calculateContentHash(sourceRow);
    const currentHash = currentHashMap.get(sourceRow.id);
    
    if (!currentHash) {
      // 新規レコード
      changes.push({
        operation: 'INSERT',
        id: sourceRow.id,
        data: { ...sourceRow, content_hash: newHash }
      });
    } else if (currentHash !== newHash) {
      // 更新レコード
      changes.push({
        operation: 'UPDATE',
        id: sourceRow.id,
        data: { ...sourceRow, content_hash: newHash }
      });
    }
  }
  
  // 削除対象の検出（sourceDataにない既存レコード）
  const sourceIds = new Set(sourceData.map(row => row.id));
  for (const [currentId] of currentHashMap) {
    if (!sourceIds.has(currentId)) {
      changes.push({
        operation: 'DELETE',
        id: currentId
      });
    }
  }
  
  return {
    total_count: Math.max(sourceData.length, currentData?.length || 0),
    diff_count: changes.length,
    changes
  };
}

/**
 * 差分適用実行
 * 注意：実際のINSERT/UPDATE/DELETE操作はSupabase RPC関数を使用
 */
async function applyChanges(
  supabase: ReturnType<typeof createServiceRoleClient>,
  targetTable: ContentDiffJobTarget,
  changes: any[],
  isFullRebuild: boolean
): Promise<void> {
  if (isFullRebuild) {
    // フルリビルドの場合はSupabase側のスワップテーブル方式を使用
    // この部分は実際のRPC関数名をSupabaseに確認する必要あり
    const { error } = await supabase.rpc('apply_full_rebuild_content', {
      target_table: targetTable,
      new_data: changes.filter(c => c.operation !== 'DELETE').map(c => c.data)
    });
    
    if (error) {
      throw new Error(`Full rebuild failed: ${error.message}`);
    }
  } else {
    // 差分適用の場合
    for (const change of changes) {
      try {
        if (change.operation === 'INSERT') {
          const { error } = await supabase
            .from(`public_${targetTable}`)
            .insert(change.data);
          if (error) throw error;
        } else if (change.operation === 'UPDATE') {
          const { error } = await supabase
            .from(`public_${targetTable}`)
            .update(change.data)
            .eq('id', change.id);
          if (error) throw error;
        } else if (change.operation === 'DELETE') {
          const { error } = await supabase
            .from(`public_${targetTable}`)
            .delete()
            .eq('id', change.id);
          if (error) throw error;
        }
      } catch (error) {
        throw new Error(`Failed to apply ${change.operation} for ${change.id}: ${error}`);
      }
    }
  }
}

/**
 * コンテンツ差分更新ジョブの実行
 */
export async function runContentDiffJob(
  input: ContentDiffJobInput,
  request: Request
): Promise<ContentDiffJobResult> {
  const startTime = Date.now();
  
  // ジョブ開始
  const jobResult = await beginRun({
    job_name: `content_diff_${input.target_table}`,
    idempotency_key: input.request_id,
    request,
    meta: {
      scope: 'batch',
      runner: 'edge_function',
      input_summary: {
        target_table: input.target_table,
        source_count: input.source_data.length,
        organization_id: input.organization_id
      }
    }
  });
  
  if (!jobResult.success) {
    return {
      success: false,
      target_table: input.target_table,
      total_count: 0,
      diff_count: 0,
      is_full_rebuild: false,
      threshold_percent: 0,
      duration_ms: Date.now() - startTime,
      error: jobResult.error || 'Failed to start job'
    };
  }
  
  if (jobResult.is_duplicate) {
    return {
      success: true,
      target_table: input.target_table,
      total_count: 0,
      diff_count: 0,
      is_full_rebuild: false,
      threshold_percent: 0,
      duration_ms: Date.now() - startTime,
      job_id: jobResult.record.id,
      error: 'Duplicate job detected'
    };
  }
  
  const jobId = jobResult.record.id;
  
  try {
    const supabase = createServiceRoleClient();
    
    // 1. 閾値取得
    const thresholdPercent = await getDiffRebuildThresholdPercent();
    
    // 2. 差分検出
    const { total_count, diff_count, changes } = await detectChanges(
      supabase,
      input.target_table,
      input.source_data,
      input.organization_id
    );
    
    // 3. フルリビルド判定
    const diffRate = total_count > 0 ? (diff_count / total_count) * 100 : 0;
    const isFullRebuild = diffRate > thresholdPercent;
    
    // 4. 変更適用
    if (diff_count > 0) {
      await applyChanges(supabase, input.target_table, changes, isFullRebuild);
    }
    
    // 5. ジョブ完了
    const duration = Date.now() - startTime;
    const completeMeta: JobMeta = {
      scope: 'batch',
      runner: 'edge_function',
      total_count,
      diff_count,
      is_full_rebuild: isFullRebuild,
      target_org_id: input.organization_id,
      stats: {
        rows_affected: diff_count
      },
      output_summary: {
        diff_rate: diffRate,
        threshold_percent: thresholdPercent,
        operations: changes.reduce((acc, c) => {
          acc[c.operation] = (acc[c.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
    
    await completeSuccess({ job_id: jobId, meta: completeMeta });
    
    return {
      success: true,
      target_table: input.target_table,
      total_count,
      diff_count,
      is_full_rebuild: isFullRebuild,
      threshold_percent: thresholdPercent,
      duration_ms: duration,
      job_id: jobId
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    
    await completeFailure({
      job_id: jobId,
      error_code: 'CONTENT_DIFF_ERROR',
      error_message: errorMessage
    });
    
    return {
      success: false,
      target_table: input.target_table,
      total_count: 0,
      diff_count: 0,
      is_full_rebuild: false,
      threshold_percent: 0,
      duration_ms: duration,
      error: errorMessage,
      job_id: jobId
    };
  }
}

/**
 * Supabase側RPC関数の確認が必要な項目：
 * 
 * 1. apply_full_rebuild_content(target_table, new_data) - フルリビルド用RPC
 * 2. calculate_content_hash_for_table(table_name, record_data) - content_hash計算用RPC
 * 3. get_table_diff_summary(target_table, organization_id) - 差分サマリ取得用RPC
 * 
 * これらの実際のRPC関数名をSupabaseアシスタントに確認してください。
 */