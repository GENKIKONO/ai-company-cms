/**
 * Partition Maintenance Edge Function
 * P4-7: audit_logs等のパーティション自動管理
 * 
 * 機能:
 * 1. 対象テーブルの将来分パーティションを作成
 * 2. 古いパーティションを保持期間に従って削除
 * 3. 実行結果をjob_runs_v2に記録
 * 4. HTTP レスポンスとして実行結果 JSON を返す
 */

import { createServiceRoleClient } from '../_shared/supabase.ts';
import { createEdgeLogger } from '../_shared/logging.ts';
import { beginRun, completeSuccess, completeFailure, type JobMeta } from '../_shared/job-runs.ts';

// 対象テーブル（コード内で固定配列）
const PARTITION_TABLES = [
  "audit_logs",
  "activities", 
  "ai_bot_logs",
  "analytics_events",
  "rate_limit_requests",
  "rate_limit_logs",
  "security_incidents",
] as const;

type PartitionTable = (typeof PARTITION_TABLES)[number];

// TypeScript インタフェース定義
interface PartitionMaintenanceSummary {
  created_partitions: string[];
  dropped_partitions: string[];
  skipped_tables: string[];
  errors: Array<{ table: string; operation: string; error: string }>;
}

type JobStatus = "succeeded" | "failed" | "partial_error";

interface PartitionMaintenanceResult {
  function_name: "partition-maintenance";
  status: JobStatus;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  error_message?: string;
  summary: PartitionMaintenanceSummary;
}

// 月次パーティション名生成（YYYYMM形式）
function generateMonthlyPartitions(startMonth: Date, monthsAhead: number): string[] {
  const partitions: string[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(startMonth);
    date.setMonth(date.getMonth() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    partitions.push(`${year}${month}`);
  }
  return partitions;
}

// RPC関数呼び出し
async function callRPC(
  supabase: any, 
  functionName: string, 
  params: Record<string, any>,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      logger.error(`RPC ${functionName} failed`, { error: error.message, params });
      return { success: false, error: error.message };
    }
    
    logger.debug(`RPC ${functionName} succeeded`, { params, result: data });
    return { success: true, data };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown RPC error';
    logger.error(`RPC ${functionName} exception`, { error: errorMsg, params });
    return { success: false, error: errorMsg };
  }
}

// パーティション作成処理
async function createPartitionsForTable(
  supabase: any,
  tableName: PartitionTable,
  createMonths: number,
  dryRun: boolean,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ created: string[]; errors: Array<{ operation: string; error: string }> }> {
  const created: string[] = [];
  const errors: Array<{ operation: string; error: string }> = [];
  
  try {
    // 来月から指定月数分のパーティションを作成
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const partitions = generateMonthlyPartitions(nextMonth, createMonths);
    
    for (const yearMonth of partitions) {
      if (dryRun) {
        logger.info(`[DRY RUN] Would create partition: ${tableName}_${yearMonth}`, {
          table: tableName,
          year_month: yearMonth
        });
        created.push(`${tableName}_${yearMonth}`);
      } else {
        const result = await callRPC(
          supabase, 
          'admin_create_month_partition', 
          { p_table_name: tableName, p_year_month: yearMonth },
          logger
        );
        
        if (result.success) {
          created.push(`${tableName}_${yearMonth}`);
          logger.info(`Created partition: ${tableName}_${yearMonth}`, {
            table: tableName,
            year_month: yearMonth
          });
        } else {
          errors.push({
            operation: `create_partition_${yearMonth}`,
            error: result.error || 'Unknown error'
          });
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push({
      operation: 'create_partitions',
      error: errorMsg
    });
    logger.error(`Failed to create partitions for ${tableName}`, { error: errorMsg });
  }
  
  return { created, errors };
}

// 古いパーティション削除処理
async function dropOldPartitionsForTable(
  supabase: any,
  tableName: PartitionTable,
  retentionMonths: number,
  dryRun: boolean,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<{ dropped: string[]; errors: Array<{ operation: string; error: string }> }> {
  const dropped: string[] = [];
  const errors: Array<{ operation: string; error: string }> = [];
  
  try {
    if (dryRun) {
      logger.info(`[DRY RUN] Would drop old partitions for ${tableName}`, {
        table: tableName,
        retention_months: retentionMonths
      });
      // ドライランでは仮の削除対象を生成
      const currentDate = new Date();
      const oldDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - retentionMonths - 1, 1);
      const yearMonth = `${oldDate.getFullYear()}${String(oldDate.getMonth() + 1).padStart(2, '0')}`;
      dropped.push(`${tableName}_${yearMonth}`);
    } else {
      const result = await callRPC(
        supabase,
        'admin_drop_old_partitions',
        { p_parent_table: tableName, p_keep_months: retentionMonths },
        logger
      );
      
      if (result.success) {
        // RPC関数の戻り値から削除されたパーティション名を取得
        const droppedPartitions = Array.isArray(result.data) ? result.data : [];
        dropped.push(...droppedPartitions);
        logger.info(`Dropped old partitions for ${tableName}`, {
          table: tableName,
          retention_months: retentionMonths,
          dropped_count: droppedPartitions.length
        });
      } else {
        errors.push({
          operation: 'drop_old_partitions',
          error: result.error || 'Unknown error'
        });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push({
      operation: 'drop_old_partitions',
      error: errorMsg
    });
    logger.error(`Failed to drop old partitions for ${tableName}`, { error: errorMsg });
  }
  
  return { dropped, errors };
}

// メイン処理
async function performPartitionMaintenance(
  createMonths: number,
  retentionMonths: number,
  dryRun: boolean,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<PartitionMaintenanceResult> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  
  const summary: PartitionMaintenanceSummary = {
    created_partitions: [],
    dropped_partitions: [],
    skipped_tables: [],
    errors: []
  };

  // 環境変数チェック
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  
  if (!serviceKey || !supabaseUrl) {
    const finishedAt = new Date().toISOString();
    return {
      function_name: "partition-maintenance",
      status: "failed",
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: Date.now() - startTime,
      error_message: "Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL",
      summary
    };
  }

  const supabase = createServiceRoleClient();
  
  // 各テーブルに対してパーティション管理を実行
  for (const tableName of PARTITION_TABLES) {
    try {
      // パーティション作成
      const createResult = await createPartitionsForTable(
        supabase, tableName, createMonths, dryRun, logger
      );
      
      summary.created_partitions.push(...createResult.created);
      summary.errors.push(
        ...createResult.errors.map(err => ({
          table: tableName,
          operation: err.operation,
          error: err.error
        }))
      );
      
      // 古いパーティション削除
      const dropResult = await dropOldPartitionsForTable(
        supabase, tableName, retentionMonths, dryRun, logger
      );
      
      summary.dropped_partitions.push(...dropResult.dropped);
      summary.errors.push(
        ...dropResult.errors.map(err => ({
          table: tableName,
          operation: err.operation,
          error: err.error
        }))
      );
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      summary.errors.push({
        table: tableName,
        operation: 'table_maintenance',
        error: errorMsg
      });
      summary.skipped_tables.push(tableName);
      logger.error(`Failed to maintain partitions for ${tableName}`, { error: errorMsg });
    }
  }
  
  // ステータス判定
  let status: JobStatus = "succeeded";
  let errorMessage: string | undefined;
  
  if (summary.errors.length > 0) {
    const totalTables = PARTITION_TABLES.length;
    const skippedTables = summary.skipped_tables.length;
    
    if (skippedTables === totalTables) {
      status = "failed";
      errorMessage = "All tables failed to process";
    } else {
      status = "partial_error";
      errorMessage = `${summary.errors.length} error(s) occurred during partition maintenance`;
    }
  }
  
  const finishedAt = new Date().toISOString();
  
  return {
    function_name: "partition-maintenance",
    status,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.now() - startTime,
    error_message: errorMessage,
    summary
  };
}

// job_runs_v2 への記録
async function recordJobExecution(
  result: PartitionMaintenanceResult,
  createMonths: number,
  retentionMonths: number,
  dryRun: boolean,
  request: Request,
  logger: ReturnType<typeof createEdgeLogger>
): Promise<void> {
  if (dryRun) {
    logger.info("Skipping job_runs_v2 record (dry run mode)");
    return;
  }
  
  try {
    const idempotencyKey = `partition-maintenance-${result.started_at}`;
    
    const jobMeta: JobMeta = {
      scope: 'cron',
      runner: 'edge_function',
      stats: {
        items_processed: result.summary.created_partitions.length + result.summary.dropped_partitions.length
      },
      input_summary: {
        create_months: createMonths,
        retention_months: retentionMonths,
        dry_run: dryRun,
        target_tables: PARTITION_TABLES.length
      },
      output_summary: {
        created_partitions: result.summary.created_partitions.length,
        dropped_partitions: result.summary.dropped_partitions.length,
        errors: result.summary.errors.length
      }
    };

    // ジョブ開始記録
    const beginResult = await beginRun({
      job_name: "partition-maintenance",
      idempotency_key: idempotencyKey,
      request,
      meta: jobMeta
    }, logger);
    
    if (!beginResult.success) {
      logger.error("Failed to record job start", { error: beginResult.error });
      return;
    }

    // ジョブ完了記録
    if (result.status === "succeeded") {
      await completeSuccess({
        job_id: beginResult.record.id,
        meta: {
          ...jobMeta,
          output_summary: {
            ...jobMeta.output_summary,
            summary: result.summary
          }
        }
      }, logger);
    } else {
      await completeFailure({
        job_id: beginResult.record.id,
        error_code: result.status,
        error_message: result.error_message,
        meta: {
          ...jobMeta,
          error_details: {
            message_full: result.error_message,
            context: { summary: result.summary }
          }
        }
      }, logger);
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error("Failed to record job execution", { error: errorMsg });
  }
}

// メインハンドラー
Deno.serve(async (req: Request): Promise<Response> => {
  const logger = createEdgeLogger(req, "partition-maintenance");
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // URL パラメータ取得
    const url = new URL(req.url);
    const createMonths = parseInt(url.searchParams.get('create_months') || '3');
    const retentionMonths = parseInt(url.searchParams.get('retention_months') || '12');
    const dryRun = url.searchParams.get('dry_run') === 'true';
    
    logger.info('Partition maintenance started', {
      create_months: createMonths,
      retention_months: retentionMonths,
      dry_run: dryRun,
      target_tables: PARTITION_TABLES
    });
    
    // パーティション管理実行
    const result = await performPartitionMaintenance(
      createMonths, retentionMonths, dryRun, logger
    );
    
    // job_runs_v2 への記録
    await recordJobExecution(
      result, createMonths, retentionMonths, dryRun, req, logger
    );
    
    logger.info('Partition maintenance completed', {
      status: result.status,
      duration_ms: result.duration_ms,
      created_partitions: result.summary.created_partitions.length,
      dropped_partitions: result.summary.dropped_partitions.length,
      errors: result.summary.errors.length
    });
    
    // HTTP レスポンス - 常に 200 で JSON を返す（成功/失敗に関わらず）
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Partition maintenance function error', { error: errorMsg });
    
    const errorResult: PartitionMaintenanceResult = {
      function_name: "partition-maintenance",
      status: "failed",
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: 0,
      error_message: errorMsg,
      summary: {
        created_partitions: [],
        dropped_partitions: [],
        skipped_tables: [],
        errors: [{ table: 'global', operation: 'function_execution', error: errorMsg }]
      }
    };
    
    return new Response(JSON.stringify(errorResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});