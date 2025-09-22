-- ========================================
-- AIO Hub UAT データベース検証SQL
-- Supabase SQLエディタで実行用
-- ========================================

-- 🔍 RLS（Row Level Security）確認
-- 全主要テーブルでRLSが有効化されているかチェック
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 
    'organizations', 
    'services', 
    'faqs', 
    'case_studies',
    'organization_members'
  )
ORDER BY tablename;

-- 期待結果: 全テーブルで rls_enabled = true

-- ========================================

-- 📊 データ件数確認
-- 各テーブルの基本的なデータ件数をチェック
SELECT 
  now() as check_time,
  (SELECT count(*) FROM users) as user_count,
  (SELECT count(*) FROM organizations) as org_count,
  (SELECT count(*) FROM services) as service_count,
  (SELECT count(*) FROM faqs) as faq_count,
  (SELECT count(*) FROM case_studies) as case_study_count,
  (SELECT count(*) FROM organization_members) as member_count;

-- ========================================

-- ⚡ パフォーマンス確認
-- スロークエリの確認（100ms以上）
SELECT 
  query, 
  mean_time, 
  calls, 
  total_time,
  ROUND((mean_time)::numeric, 2) as avg_ms
FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC 
LIMIT 10;

-- 期待結果: 重いクエリがないこと

-- ========================================

-- 🔗 外部キー制約確認
-- 参照整合性が正しく設定されているかチェック
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ========================================

-- 🚨 データ整合性確認
-- 孤立したレコードがないかチェック

-- 1. ユーザーが存在しない組織
SELECT o.id, o.name, o.user_id
FROM organizations o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- 期待結果: 0件

-- 2. 組織が存在しないサービス
SELECT s.id, s.name, s.organization_id
FROM services s
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE o.id IS NULL;

-- 期待結果: 0件

-- 3. 組織が存在しないFAQ
SELECT f.id, f.question, f.organization_id
FROM faqs f
LEFT JOIN organizations o ON f.organization_id = o.id
WHERE o.id IS NULL;

-- 期待結果: 0件

-- 4. 組織が存在しない導入事例
SELECT cs.id, cs.title, cs.organization_id
FROM case_studies cs
LEFT JOIN organizations o ON cs.organization_id = o.id
WHERE o.id IS NULL;

-- 期待結果: 0件

-- ========================================

-- 👥 ユーザー権限確認
-- 各権限レベルのユーザー数をチェック
SELECT 
  role,
  COUNT(*) as user_count,
  ARRAY_AGG(email ORDER BY created_at DESC) as recent_users
FROM users 
GROUP BY role
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1 
    WHEN 'editor' THEN 2 
    WHEN 'viewer' THEN 3 
    ELSE 4 
  END;

-- ========================================

-- 📈 アクティビティ確認
-- 最近の更新アクティビティをチェック

-- 最近作成された企業（7日以内）
SELECT 
  'organizations' as table_name,
  COUNT(*) as recent_count,
  MAX(created_at) as latest_created
FROM organizations 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

-- 最近作成されたサービス（7日以内）
SELECT 
  'services' as table_name,
  COUNT(*) as recent_count,
  MAX(created_at) as latest_created
FROM services 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

-- 最近作成されたFAQ（7日以内）
SELECT 
  'faqs' as table_name,
  COUNT(*) as recent_count,
  MAX(created_at) as latest_created
FROM faqs 
WHERE created_at > NOW() - INTERVAL '7 days'

ORDER BY latest_created DESC;

-- ========================================

-- 🔐 認証設定確認
-- 認証関連の設定状況をチェック
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  last_sign_in_at,
  sign_in_count
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- ========================================

-- 🗄️ ストレージ使用量確認
-- データベースサイズとテーブルサイズをチェック
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'organizations', 'services')
ORDER BY tablename, attname;

-- ========================================

-- 🔍 インデックス確認
-- 重要なインデックスが存在するかチェック
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'organizations', 'services', 'faqs', 'case_studies')
ORDER BY tablename, indexname;

-- ========================================

-- 💾 バックアップ・復旧確認
-- Point-in-Time Recovery設定確認（Supabase Dashboard要確認）
-- この部分はSupabase Dashboard > Settings > Database で手動確認

-- ========================================

-- 🚀 公開企業データ確認
-- 公開状態の企業とその関連データをチェック
SELECT 
  o.name as org_name,
  o.is_published,
  o.status,
  COUNT(DISTINCT s.id) as service_count,
  COUNT(DISTINCT f.id) as faq_count,
  COUNT(DISTINCT cs.id) as case_study_count
FROM organizations o
LEFT JOIN services s ON o.id = s.organization_id
LEFT JOIN faqs f ON o.id = f.organization_id  
LEFT JOIN case_studies cs ON o.id = cs.organization_id
WHERE o.is_published = true
GROUP BY o.id, o.name, o.is_published, o.status
ORDER BY o.created_at DESC
LIMIT 10;

-- ========================================

-- 🔧 実行ログ記録
-- このSQL実行の記録を残す（オプション）
INSERT INTO uat_execution_log (
  test_type,
  executed_at,
  executed_by,
  notes
) VALUES (
  'database_verification',
  NOW(),
  current_user,
  'UAT database integrity check completed'
);

-- 注意: uat_execution_log テーブルが存在しない場合はこのINSERT文はスキップしてください

-- ========================================
-- 📝 チェックリスト
-- 
-- □ すべてのテーブルでRLSが有効
-- □ 孤立レコードが存在しない
-- □ 外部キー制約が正しく設定
-- □ パフォーマンスに問題なし（スロークエリなし）
-- □ 適切なインデックスが設定済み
-- □ 公開企業データが正常
-- □ 認証ユーザー情報が正常
-- 
-- ========================================