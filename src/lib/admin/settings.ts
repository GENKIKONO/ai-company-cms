/**
 * Admin Settings Utilities
 * Phase 3 Addendum: 設定値の読み取りユーティリティ
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import 'server-only';

/**
 * 差分リビルド閾値の取得
 * @returns threshold percentage (default: 30)
 */
export async function getDiffRebuildThresholdPercent(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'diff_rebuild_threshold_percent')
      .limit(1)
      .maybeSingle();
    
    if (!data?.value) {
      return 30; // デフォルト値
    }
    
    const parsed = parseInt(data.value, 10);
    return isNaN(parsed) ? 30 : parsed;
    
  } catch (error) {
    logger.warn('Failed to load diff rebuild threshold, using default:', { data: error });
    return 30;
  }
}

/**
 * 設定値の汎用取得（数値）
 */
export async function getSettingNumber(key: string, defaultValue: number): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .limit(1)
      .maybeSingle();
    
    if (!data?.value) {
      return defaultValue;
    }
    
    const parsed = parseInt(data.value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
    
  } catch (error) {
    logger.warn(`Failed to load setting ${key}, using default:`, { data: error });
    return defaultValue;
  }
}

/**
 * 設定値の汎用取得（文字列）
 */
export async function getSettingString(key: string, defaultValue: string): Promise<string> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .limit(1)
      .maybeSingle();
    
    return data?.value ?? defaultValue;

  } catch (error) {
    logger.warn(`Failed to load setting ${key}, using default:`, { data: error });
    return defaultValue;
  }
}

/**
 * バッチジョブ関連の設定値取得
 */
export interface BatchJobSettings {
  diffRebuildThresholdPercent: number;
  maxConcurrentJobs: number;
  jobTimeoutMs: number;
}

export async function getBatchJobSettings(): Promise<BatchJobSettings> {
  const [diffRebuildThresholdPercent, maxConcurrentJobs, jobTimeoutMs] = await Promise.all([
    getDiffRebuildThresholdPercent(),
    getSettingNumber('batch_max_concurrent_jobs', 3),
    getSettingNumber('batch_job_timeout_ms', 300000), // 5分
  ]);
  
  return {
    diffRebuildThresholdPercent,
    maxConcurrentJobs,
    jobTimeoutMs,
  };
}