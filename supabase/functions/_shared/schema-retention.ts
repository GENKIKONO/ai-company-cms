/**
 * Schema Snapshots肥大化対策ユーティリティ
 * EPIC 3-7: Supabaseレビュー指摘事項対応
 * 
 * 機能:
 * - 保持期間管理（365日上限、段階的削除）
 * - 同一ハッシュ連続保存のスキップ
 * - 古いスナップショットの週次代表保持
 * - ストレージ最適化
 */

import { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.7';
import { type EdgeLogger } from './logging.ts';

// ============================================
// 保持ポリシー設定
// ============================================

export interface RetentionPolicy {
  // 保持期間（日数）
  daily_retention_days: number;     // 毎日保持: 30日
  weekly_retention_days: number;    // 週次代表保持: 90日
  monthly_retention_days: number;   // 月次代表保持: 365日
  
  // 同一ハッシュスキップ設定
  skip_identical_snapshots: boolean;
  max_identical_streak: number;     // 連続同一ハッシュの最大許容回数
  
  // クリーンアップ設定
  cleanup_batch_size: number;       // 一度にクリーンアップする件数
  keep_error_snapshots: boolean;    // エラー級差分があったスナップショットは保持
}

export const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  daily_retention_days: 30,
  weekly_retention_days: 90,
  monthly_retention_days: 365,
  skip_identical_snapshots: true,
  max_identical_streak: 7,
  cleanup_batch_size: 100,
  keep_error_snapshots: true
};

// ============================================
// スナップショット保存前チェック
// ============================================

/**
 * 新しいスナップショット保存前の重複チェック
 * 同一ハッシュが連続している場合は保存をスキップ
 */
export async function shouldSkipSnapshot(
  supabase: SupabaseClient,
  environment: string,
  schemaHash: string,
  policy: RetentionPolicy = DEFAULT_RETENTION_POLICY,
  logger?: EdgeLogger
): Promise<{ should_skip: boolean; reason?: string }> {
  
  if (!policy.skip_identical_snapshots) {
    return { should_skip: false };
  }

  try {
    // 同一環境の最新N件のスナップショットを取得
    const { data: recentSnapshots, error } = await supabase
      .from('schema_snapshots')
      .select('captured_at, schema_hash, has_error_diff')
      .eq('environment', environment)
      .order('captured_at', { ascending: false })
      .limit(policy.max_identical_streak);

    if (error) {
      logger?.warn('Failed to check recent snapshots', { error: error.message });
      return { should_skip: false };
    }

    if (!recentSnapshots || recentSnapshots.length === 0) {
      return { should_skip: false };
    }

    // 連続する同一ハッシュの数をカウント
    let consecutiveIdentical = 0;
    for (const snapshot of recentSnapshots) {
      if (snapshot.schema_hash === schemaHash) {
        consecutiveIdentical++;
      } else {
        break;
      }
    }

    // 連続同一ハッシュが制限を超えているかチェック
    if (consecutiveIdentical >= policy.max_identical_streak) {
      // エラー級差分があった場合は保存を強制
      const hasRecentErrorDiff = recentSnapshots.some(s => s.has_error_diff);
      if (hasRecentErrorDiff && policy.keep_error_snapshots) {
        return { should_skip: false };
      }

      logger?.info('Skipping identical snapshot', {
        environment,
        consecutive_count: consecutiveIdentical,
        max_streak: policy.max_identical_streak
      });

      return { 
        should_skip: true, 
        reason: `Identical schema hash for ${consecutiveIdentical} consecutive snapshots` 
      };
    }

    return { should_skip: false };

  } catch (error) {
    logger?.error('Exception in snapshot skip check', { error: error.message });
    return { should_skip: false };
  }
}

// ============================================
// 保持期間ベースクリーンアップ
// ============================================

/**
 * 保持期間ポリシーに基づく古いスナップショットクリーンアップ
 */
export async function cleanupOldSnapshots(
  supabase: SupabaseClient,
  policy: RetentionPolicy = DEFAULT_RETENTION_POLICY,
  logger?: EdgeLogger
): Promise<{
  deleted_count: number;
  errors: string[];
}> {
  
  const errors: string[] = [];
  let totalDeleted = 0;

  try {
    logger?.info('Starting snapshot cleanup', { policy });

    // ============================================
    // 1. 古い日次スナップショットの削除
    // ============================================

    const dailyCutoff = new Date();
    dailyCutoff.setDate(dailyCutoff.getDate() - policy.daily_retention_days);

    const { data: oldDailySnapshots, error: dailyError } = await supabase
      .from('schema_snapshots')
      .select('id, captured_at, environment')
      .lt('captured_at', dailyCutoff.toISOString())
      .limit(policy.cleanup_batch_size);

    if (dailyError) {
      errors.push(`Daily snapshot query failed: ${dailyError.message}`);
    } else if (oldDailySnapshots && oldDailySnapshots.length > 0) {
      // 週次代表として保持するものを除外
      const weeklyKeepers = await getWeeklyRepresentatives(
        supabase, 
        oldDailySnapshots, 
        policy,
        logger
      );

      const toDelete = oldDailySnapshots.filter(snap => 
        !weeklyKeepers.has(snap.id)
      );

      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('schema_snapshots')
          .delete()
          .in('id', toDelete.map(s => s.id));

        if (deleteError) {
          errors.push(`Daily snapshot deletion failed: ${deleteError.message}`);
        } else {
          totalDeleted += toDelete.length;
          logger?.info('Deleted old daily snapshots', { count: toDelete.length });
        }
      }
    }

    // ============================================
    // 2. 古い週次代表スナップショットの削除
    // ============================================

    const weeklyCutoff = new Date();
    weeklyCutoff.setDate(weeklyCutoff.getDate() - policy.weekly_retention_days);

    const { data: oldWeeklySnapshots, error: weeklyError } = await supabase
      .from('schema_snapshots')
      .select('id, captured_at, environment')
      .lt('captured_at', weeklyCutoff.toISOString())
      .limit(policy.cleanup_batch_size);

    if (weeklyError) {
      errors.push(`Weekly snapshot query failed: ${weeklyError.message}`);
    } else if (oldWeeklySnapshots && oldWeeklySnapshots.length > 0) {
      // 月次代表として保持するものを除外
      const monthlyKeepers = await getMonthlyRepresentatives(
        supabase,
        oldWeeklySnapshots,
        policy,
        logger
      );

      const toDeleteWeekly = oldWeeklySnapshots.filter(snap =>
        !monthlyKeepers.has(snap.id)
      );

      if (toDeleteWeekly.length > 0) {
        const { error: deleteWeeklyError } = await supabase
          .from('schema_snapshots')
          .delete()
          .in('id', toDeleteWeekly.map(s => s.id));

        if (deleteWeeklyError) {
          errors.push(`Weekly snapshot deletion failed: ${deleteWeeklyError.message}`);
        } else {
          totalDeleted += toDeleteWeekly.length;
          logger?.info('Deleted old weekly snapshots', { count: toDeleteWeekly.length });
        }
      }
    }

    // ============================================
    // 3. 超古い月次スナップショットの削除
    // ============================================

    const monthlyCutoff = new Date();
    monthlyCutoff.setDate(monthlyCutoff.getDate() - policy.monthly_retention_days);

    const { data: oldMonthlySnapshots, error: monthlyError } = await supabase
      .from('schema_snapshots')
      .select('id')
      .lt('captured_at', monthlyCutoff.toISOString())
      .limit(policy.cleanup_batch_size);

    if (monthlyError) {
      errors.push(`Monthly snapshot query failed: ${monthlyError.message}`);
    } else if (oldMonthlySnapshots && oldMonthlySnapshots.length > 0) {
      const { error: deleteMonthlyError } = await supabase
        .from('schema_snapshots')
        .delete()
        .in('id', oldMonthlySnapshots.map(s => s.id));

      if (deleteMonthlyError) {
        errors.push(`Monthly snapshot deletion failed: ${deleteMonthlyError.message}`);
      } else {
        totalDeleted += oldMonthlySnapshots.length;
        logger?.info('Deleted old monthly snapshots', { count: oldMonthlySnapshots.length });
      }
    }

    logger?.info('Snapshot cleanup completed', {
      total_deleted: totalDeleted,
      errors_count: errors.length
    });

    return { deleted_count: totalDeleted, errors };

  } catch (error) {
    const errorMsg = `Cleanup exception: ${error instanceof Error ? error.message : 'Unknown error'}`;
    errors.push(errorMsg);
    logger?.error('Snapshot cleanup failed', { error: errorMsg });
    
    return { deleted_count: totalDeleted, errors };
  }
}

// ============================================
// 代表スナップショット選定ヘルパー
// ============================================

/**
 * 週次代表スナップショットの選定
 * 各週の最初のスナップショットを代表として保持
 */
async function getWeeklyRepresentatives(
  supabase: SupabaseClient,
  snapshots: Array<{ id: string; captured_at: string; environment: string }>,
  policy: RetentionPolicy,
  logger?: EdgeLogger
): Promise<Set<string>> {
  
  const keepers = new Set<string>();
  const weekGroups = new Map<string, Array<typeof snapshots[0]>>();

  // 環境別・週別でグループ化
  for (const snapshot of snapshots) {
    const date = new Date(snapshot.captured_at);
    const weekKey = `${snapshot.environment}-${getISOWeek(date)}-${date.getFullYear()}`;
    
    if (!weekGroups.has(weekKey)) {
      weekGroups.set(weekKey, []);
    }
    weekGroups.get(weekKey)!.push(snapshot);
  }

  // 各週の最初のスナップショットを代表として選定
  for (const [weekKey, weekSnapshots] of weekGroups) {
    const representative = weekSnapshots.sort((a, b) => 
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
    )[0];
    
    keepers.add(representative.id);
  }

  logger?.debug('Selected weekly representatives', { count: keepers.size });
  return keepers;
}

/**
 * 月次代表スナップショットの選定
 * 各月の最初のスナップショットを代表として保持
 */
async function getMonthlyRepresentatives(
  supabase: SupabaseClient,
  snapshots: Array<{ id: string; captured_at: string; environment: string }>,
  policy: RetentionPolicy,
  logger?: EdgeLogger
): Promise<Set<string>> {
  
  const keepers = new Set<string>();
  const monthGroups = new Map<string, Array<typeof snapshots[0]>>();

  // 環境別・月別でグループ化
  for (const snapshot of snapshots) {
    const date = new Date(snapshot.captured_at);
    const monthKey = `${snapshot.environment}-${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthGroups.has(monthKey)) {
      monthGroups.set(monthKey, []);
    }
    monthGroups.get(monthKey)!.push(snapshot);
  }

  // 各月の最初のスナップショットを代表として選定
  for (const [monthKey, monthSnapshots] of monthGroups) {
    const representative = monthSnapshots.sort((a, b) => 
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime()
    )[0];
    
    keepers.add(representative.id);
  }

  logger?.debug('Selected monthly representatives', { count: keepers.size });
  return keepers;
}

// ============================================
// ユーティリティ関数
// ============================================

/**
 * ISO週番号取得
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * スナップショットのスキーマハッシュ計算
 */
export function calculateSchemaHash(schemaObjects: unknown[]): string {
  // スキーマオブジェクトを正規化してハッシュ化
  const normalized = JSON.stringify(schemaObjects, Object.keys(schemaObjects).sort());
  return createHash(normalized);
}

function createHash(input: string): string {
  // 簡易ハッシュ（実際のcrypto.subtle.digestが使えない環境向け）
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(36);
}

/**
 * 肥大化状況の監視
 */
export async function getStorageStats(
  supabase: SupabaseClient,
  logger?: EdgeLogger
): Promise<{
  total_snapshots: number;
  total_size_mb: number;
  oldest_snapshot: string | null;
  environments_count: number;
  avg_snapshot_size_kb: number;
}> {
  
  try {
    const { data: stats, error } = await supabase
      .from('schema_snapshots')
      .select(`
        id,
        captured_at,
        environment,
        schema_json
      `)
      .order('captured_at', { ascending: true });

    if (error) {
      throw error;
    }

    const totalSnapshots = stats?.length || 0;
    const environments = new Set(stats?.map(s => s.environment) || []);
    const oldestSnapshot = stats && stats.length > 0 ? stats[0].captured_at : null;
    
    // JSONサイズの概算計算
    const totalSizeBytes = (stats || []).reduce((sum, snap) => {
      const jsonSize = JSON.stringify(snap.schema_json || {}).length;
      return sum + jsonSize;
    }, 0);

    const totalSizeMb = totalSizeBytes / (1024 * 1024);
    const avgSnapshotSizeKb = totalSnapshots > 0 
      ? (totalSizeBytes / totalSnapshots) / 1024 
      : 0;

    return {
      total_snapshots: totalSnapshots,
      total_size_mb: Math.round(totalSizeMb * 100) / 100,
      oldest_snapshot: oldestSnapshot,
      environments_count: environments.size,
      avg_snapshot_size_kb: Math.round(avgSnapshotSizeKb * 100) / 100
    };

  } catch (error) {
    logger?.error('Failed to get storage stats', { error: error.message });
    return {
      total_snapshots: 0,
      total_size_mb: 0,
      oldest_snapshot: null,
      environments_count: 0,
      avg_snapshot_size_kb: 0
    };
  }
}