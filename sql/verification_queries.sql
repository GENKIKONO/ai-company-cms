-- =====================================================
-- 検証クエリ集 (Supabase SQL Editor で順番に実行)
-- ※ 必ず書き込み可能な接続で実行すること
-- =====================================================

-- =====================================================
-- 1. 書き込みモード確認
-- =====================================================
SHOW transaction_read_only;
-- 結果が 'off' であれば書き込み可能
-- 'on' の場合は service_role キーで接続し直すか、
-- Supabase ダッシュボードの SQL Editor を使用

-- =====================================================
-- 2. increment_org_interview_stats 書き込み検証
-- =====================================================

-- Step 1: RPC 実行 (テスト用 org_id)
SELECT public.increment_org_interview_stats(
  'd968df67-3467-4ffb-a9ad-0382e27f6661'::uuid,
  1,  -- p_interview_count
  2   -- p_message_count
);

-- Step 2: 反映確認
SELECT
  organization_id,
  period_start,
  period_end,
  token_quota,
  token_used,
  updated_at
FROM public.organization_ai_usage
WHERE organization_id = 'd968df67-3467-4ffb-a9ad-0382e27f6661'::uuid
ORDER BY period_start DESC
LIMIT 1;

-- 期待結果:
-- - 当月の period_start/period_end 行が存在
-- - token_used が加算されている
-- - updated_at が現在時刻に近い

-- =====================================================
-- 3. monthly_report_jobs クエリ計画確認
-- =====================================================

EXPLAIN ANALYZE
SELECT * FROM public.monthly_report_jobs
WHERE status = 'queued'
ORDER BY scheduled_at
LIMIT 10;

-- 期待: Index Scan が使用される
-- データ少量時は Seq Scan 許容

-- オプション: queued が多く Seq Scan のままなら以下を実行
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mrj_queued_sched
-- ON public.monthly_report_jobs (scheduled_at)
-- WHERE status = 'queued';

-- =====================================================
-- 4. ops_audit クエリ計画確認
-- =====================================================

EXPLAIN ANALYZE
SELECT * FROM public.ops_audit
WHERE created_at >= now() - interval '30 days'
  AND action = 'security_scan'
ORDER BY created_at DESC
LIMIT 50;

-- 期待: Index Scan using idx_ops_audit_* または類似

-- オプション: Seq Scan のままなら以下を実行
-- CREATE INDEX IF NOT EXISTS idx_ops_audit_action_created_at_desc
-- ON public.ops_audit (action, created_at DESC);

-- =====================================================
-- 5. site_admins 確認
-- =====================================================

SELECT user_id, created_at FROM public.site_admins;

-- 期待: 管理者として登録済みの user_id が表示される

-- =====================================================
-- 6. 既存インデックス確認（参考）
-- =====================================================

-- ops_audit のインデックス一覧
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ops_audit';

-- monthly_report_jobs のインデックス一覧
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'monthly_report_jobs';

-- organization_ai_usage のインデックス一覧
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'organization_ai_usage';
