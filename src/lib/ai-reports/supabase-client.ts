/**
 * AI月次レポート用 service_role Supabaseクライアント
 * バッチ処理・集計で RLS回避のために使用
 */

import { createClient } from '@supabase/supabase-js';

let _supabaseServiceClient: ReturnType<typeof createClient> | null = null;

/**
 * service_role クライアントのシングルトンインスタンス取得
 * バッチ処理用でRLS制限を回避
 */
export function getServiceRoleClient() {
  if (!_supabaseServiceClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase service_role configuration missing. NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    }

    _supabaseServiceClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  return _supabaseServiceClient;
}

/**
 * URL正規化関数
 * analytics_events.page_url と content_union_view.canonical_url の結合用
 * Supabaseアシスタント回答: normalize_url() 相当の処理
 */
export function normalizeUrl(url: string | null): string {
  if (!url) return '';
  
  return url
    .toLowerCase()
    .trim()
    // クエリパラメータとハッシュを除去
    .replace(/[?#].*$/, '')
    // 末尾スラッシュを除去 (root path "/" は除く)
    .replace(/\/+$/, '') || '/';
}

/**
 * 期間から analytics_events パーティション名のリストを生成
 * 例: 2025-05-01 ~ 2025-05-31 → ['analytics_events_202505']
 *     2025-05-15 ~ 2025-06-15 → ['analytics_events_202505', 'analytics_events_202506']
 */
export function getAnalyticsPartitionTables(periodStart: string, periodEnd: string): string[] {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const partitions: string[] = [];
  
  const current = new Date(start.getFullYear(), start.getMonth(), 1);
  
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    partitions.push(`analytics_events_${year}${month}`);
    
    // 次の月へ
    current.setMonth(current.getMonth() + 1);
  }
  
  return partitions;
}