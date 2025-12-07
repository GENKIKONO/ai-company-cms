# P4-7 audit_logs パーティション化実装

## 1. 現状の audit_logs スキーマ確認

### 実際の audit_logs スキーマ (20251112_security_hardening.sql より)

**実際のスキーマ:**
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    row_data JSONB,
    old_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    api_endpoint TEXT,
    request_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**インデックス:**
- `idx_audit_logs_table_action (table_name, action)`
- `idx_audit_logs_user (user_id)`
- `idx_audit_logs_created_at (created_at)`
- `idx_audit_logs_ip_address (ip_address)`

**RLS:** 管理者のみ閲覧可能 (`is_admin()` 関数使用)

### Supabase Assistant 案との差分

| 項目 | Supabase Assistant案 | 実スキーマ | 差分 |
|------|---------------------|----------|------|
| **主キー型** | `BIGSERIAL PRIMARY KEY` | `BIGSERIAL PRIMARY KEY` | ✅ 一致 |
| **必須列名** | `table_name`, `action` | `table_name`, `action` | ✅ 一致 |
| **制約** | `action IN ('INSERT', 'UPDATE', 'DELETE')` | `action IN ('INSERT', 'UPDATE', 'DELETE')` | ✅ 一致 |
| **JSONB列** | `row_data`, `old_data` | `row_data`, `old_data` | ✅ 一致 |
| **時間列** | `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` | `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()` | ✅ 一致 |
| **追加列** | なし | `user_email`, `session_id`, `api_endpoint`, `request_method` | 🆕 実スキーマに追加列あり |

**結論:** Supabase Assistant の提案より実スキーマの方が詳細で、追加の列が存在する。実装では実スキーマを100%踏襲する。

## 2. 親テーブル audit_logs_v2 の DDL (実スキーマ準拠)

```sql
-- ============================================
-- audit_logs_v2 親テーブル作成 (宣言的パーティション)
-- 実際の audit_logs スキーマを 100% 踏襲
-- ============================================

-- 必要な拡張 (既存で入っているが念のため)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 親テーブル作成: 実スキーマの全列を完全に踏襲
CREATE TABLE IF NOT EXISTS public.audit_logs_v2 (
    id BIGSERIAL,  -- パーティション環境では複合主キーになるため一旦単独で定義
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    row_data JSONB,
    old_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    api_endpoint TEXT,
    request_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- パーティション親テーブル用制約
    CONSTRAINT audit_logs_v2_valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
) PARTITION BY RANGE (created_at);

-- パーティション環境では主キーは (id, created_at) の複合キーが必要
-- 注意: 既存の BIGSERIAL(id) との連番互換性は保てないが、パーティション移行には必要
ALTER TABLE public.audit_logs_v2 ADD CONSTRAINT audit_logs_v2_pkey PRIMARY KEY (id, created_at);

-- 親テーブル用インデックス作成
-- 既存のインデックスパターンを踏襲し、created_at を含む形に最適化
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_table_action_time 
  ON public.audit_logs_v2 (table_name, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_user_time 
  ON public.audit_logs_v2 (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_created_at 
  ON public.audit_logs_v2 (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_ip_time 
  ON public.audit_logs_v2 (ip_address, created_at) WHERE ip_address IS NOT NULL;

-- RLS有効化 (子テーブルに自動継承される)
ALTER TABLE public.audit_logs_v2 ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: 既存の audit_logs と同じポリシーを踏襲
-- 管理者のみ閲覧可能
CREATE POLICY "audit_logs_v2_admin_select" ON public.audit_logs_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
    )
  );

-- システムからのINSERT (監査ログは自動記録のため)
-- Service Role と関数からの INSERT を許可
CREATE POLICY "audit_logs_v2_system_insert" ON public.audit_logs_v2
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    current_setting('role') = 'postgres' OR  -- トリガー関数からの実行
    auth.uid() IS NULL  -- システム実行
  );

-- 手動のUPDATE/DELETEは禁止（監査ログは immutable）
-- SELECT と INSERT のみ許可する設計

-- コメント追加
COMMENT ON TABLE public.audit_logs_v2 IS 'パーティション化された監査ログ親テーブル (created_at による月次パーティション)';
COMMENT ON COLUMN public.audit_logs_v2.id IS 'BIGSERIAL主キー (既存audit_logsからの移行時は新番号になる)';
COMMENT ON COLUMN public.audit_logs_v2.created_at IS 'パーティションキー: 月次分割の基準';
```

**移行時の主キー(id)について:**
- 既存 `audit_logs` は `BIGSERIAL` で単独主キー
- `audit_logs_v2` はパーティション要件により `(id, created_at)` 複合主キー
- 移行時は既存のid値は保持されず、新しいSERIAL番号が振られる
- アプリケーション側でaudit_logsのidに依存している処理があれば事前確認が必要

## 3. 月次子パーティション DDL と RPC 関数

### 3-1. 子パーティション作成例 (audit_logs_202512)

```sql
-- ============================================
-- 月次子パーティション作成例: 2024年12月分
-- ============================================

CREATE TABLE public.audit_logs_202512 PARTITION OF public.audit_logs_v2
  FOR VALUES FROM ('2024-12-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

-- 子テーブル専用インデックス (パフォーマンス最適化)
-- 親テーブルのインデックスは継承されないため個別作成が必要
CREATE INDEX idx_audit_logs_202512_created_at 
  ON public.audit_logs_202512 (created_at);
CREATE INDEX idx_audit_logs_202512_table_action 
  ON public.audit_logs_202512 (table_name, action);
CREATE INDEX idx_audit_logs_202512_user_id 
  ON public.audit_logs_202512 (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_202512_ip_address 
  ON public.audit_logs_202512 (ip_address) WHERE ip_address IS NOT NULL;
-- API監視用インデックス (このプロジェクト特有)
CREATE INDEX idx_audit_logs_202512_api_endpoint 
  ON public.audit_logs_202512 (api_endpoint) WHERE api_endpoint IS NOT NULL;
```

### 3-2. 単一テーブル用パーティション作成関数

```sql
-- ============================================
-- RPC関数: 指定テーブルの月次パーティション作成
-- ============================================

CREATE OR REPLACE FUNCTION admin_create_month_partition(
  p_table_name TEXT,
  p_year_month TEXT  -- 'YYYYMM' format
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_table_name TEXT;
  start_date DATE;
  end_date DATE;
  start_ts TEXT;
  end_ts TEXT;
BEGIN
  -- 引数検証
  IF p_table_name IS NULL OR p_year_month IS NULL THEN
    RAISE EXCEPTION 'table_name and year_month are required';
  END IF;
  
  -- YYYYMM形式の検証
  IF p_year_month !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'year_month must be in YYYYMM format, got: %', p_year_month;
  END IF;
  
  -- 管理者権限チェック
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  -- 子テーブル名生成
  child_table_name := p_table_name || '_' || p_year_month;
  
  -- 日付範囲計算 (YYYYMM -> 月初〜翌月初)
  start_date := (p_year_month || '01')::DATE;
  end_date := start_date + INTERVAL '1 month';
  start_ts := start_date::TEXT || ' 00:00:00+00';
  end_ts := end_date::TEXT || ' 00:00:00+00';
  
  -- 子テーブル作成 (冪等)
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.%I 
     FOR VALUES FROM (%L) TO (%L)',
    child_table_name, p_table_name, start_ts, end_ts
  );
  
  -- テーブル固有のインデックス作成
  -- audit_logs系の場合
  IF p_table_name IN ('audit_logs', 'audit_logs_v2') THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON public.%I (created_at)', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_table_action ON public.%I (table_name, action)', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON public.%I (user_id) WHERE user_id IS NOT NULL', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_ip_address ON public.%I (ip_address) WHERE ip_address IS NOT NULL', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_api_endpoint ON public.%I (api_endpoint) WHERE api_endpoint IS NOT NULL', 
                   child_table_name, child_table_name);
  -- 他のログテーブルの場合 (基本インデックスのみ)
  ELSE
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON public.%I (created_at)', 
                   child_table_name, child_table_name);
  END IF;
  
  RETURN format('Created partition %s for range %s to %s', child_table_name, start_ts, end_ts);
END;
$$;

-- 実行権限設定
REVOKE ALL ON FUNCTION admin_create_month_partition(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_month_partition(TEXT, TEXT) TO authenticated;

-- 使用例のコメント
COMMENT ON FUNCTION admin_create_month_partition(TEXT, TEXT) IS 
  '月次パーティション作成関数. 使用例: SELECT admin_create_month_partition(''audit_logs_v2'', ''202412'')';
```

### 3-3. 複数テーブル一括処理関数

```sql
-- ============================================
-- RPC関数: 複数ログテーブルの次月パーティション作成
-- ============================================

CREATE OR REPLACE FUNCTION admin_create_next_month_partitions(
  p_months_ahead INTEGER DEFAULT 3  -- 現在+将来N月分作成
)
RETURNS TABLE(
  table_name TEXT,
  partition_name TEXT,
  date_range TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_tables TEXT[] := ARRAY[
    'audit_logs',        -- 既存の単一テーブル (スワップ前)
    'activities',        -- 既にパーティション化済み
    'ai_bot_logs',       -- 既にパーティション化済み  
    'analytics_events',  -- 既にパーティション化済み
    'rate_limit_requests', -- 既にパーティション化済み
    'rate_limit_logs',   -- 既にパーティション化済み
    'security_incidents' -- 既にパーティション化済み
  ];
  current_table TEXT;
  target_month DATE;
  year_month_str TEXT;
  result_record RECORD;
  i INTEGER;
BEGIN
  -- 管理者権限チェック
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required for partition management';
  END IF;
  
  -- 各ログテーブルに対して処理
  FOREACH current_table IN ARRAY log_tables
  LOOP
    -- 親テーブルの存在確認 (audit_logs は将来 audit_logs_v2 にスワップ予定)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = current_table
    ) THEN
      -- テーブルが存在しない場合はスキップ
      table_name := current_table;
      partition_name := 'N/A';
      date_range := 'N/A';
      status := 'SKIPPED: Table does not exist';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- 現在月から p_months_ahead ヶ月先まで作成
    FOR i IN 0..p_months_ahead LOOP
      target_month := date_trunc('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
      year_month_str := to_char(target_month, 'YYYYMM');
      
      BEGIN
        -- パーティション作成実行 (冪等)
        SELECT admin_create_month_partition(current_table, year_month_str) INTO result_record;
        
        -- 結果レコード構築
        table_name := current_table;
        partition_name := current_table || '_' || year_month_str;
        date_range := to_char(target_month, 'YYYY-MM-01') || ' to ' || to_char(target_month + INTERVAL '1 month', 'YYYY-MM-01');
        status := 'SUCCESS';
        RETURN NEXT;
        
      EXCEPTION WHEN OTHERS THEN
        -- エラーが発生しても他のテーブル/月の処理は継続
        table_name := current_table;
        partition_name := current_table || '_' || year_month_str;
        date_range := to_char(target_month, 'YYYY-MM-01') || ' to ' || to_char(target_month + INTERVAL '1 month', 'YYYY-MM-01');
        status := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

-- 実行権限設定
REVOKE ALL ON FUNCTION admin_create_next_month_partitions(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_next_month_partitions(INTEGER) TO authenticated;

-- 使用例のコメント
COMMENT ON FUNCTION admin_create_next_month_partitions(INTEGER) IS 
  '複数ログテーブルの次月パーティション一括作成. 使用例: SELECT * FROM admin_create_next_month_partitions(3)';
```

## 4. 古いパーティション削除 RPC (保持期間付き)

```sql
-- ============================================
-- RPC関数: 保持期間を過ぎた古いパーティション削除
-- ============================================

CREATE OR REPLACE FUNCTION admin_drop_old_partitions(
  p_parent_table TEXT,
  p_keep_months INTEGER DEFAULT 12  -- デフォルト12ヶ月保持
)
RETURNS TABLE(
  partition_name TEXT,
  drop_date DATE,
  status TEXT,
  data_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_date DATE;
  partition_record RECORD;
  partition_year_month TEXT;
  partition_date DATE;
  table_size TEXT;
BEGIN
  -- 管理者権限チェック
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required for partition deletion';
  END IF;
  
  -- 引数検証
  IF p_parent_table IS NULL OR p_keep_months <= 0 THEN
    RAISE EXCEPTION 'Invalid arguments: parent_table=%, keep_months=%', p_parent_table, p_keep_months;
  END IF;
  
  -- 保持期限計算 (現在月から p_keep_months 前)
  cutoff_date := date_trunc('month', CURRENT_DATE) - (p_keep_months || ' months')::INTERVAL;
  
  -- 親テーブルの存在確認
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_parent_table
  ) THEN
    RAISE EXCEPTION 'Parent table % does not exist', p_parent_table;
  END IF;
  
  -- 対象パーティション検索 (_YYYYMM パターン)
  FOR partition_record IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name ~ ('^' || p_parent_table || '_[0-9]{6}$')
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    -- パーティション名から年月を抽出
    partition_year_month := regexp_replace(partition_record.table_name, '^.*_([0-9]{6})$', '\1');
    
    -- 年月を DATE に変換
    BEGIN
      partition_date := (partition_year_month || '01')::DATE;
    EXCEPTION WHEN OTHERS THEN
      -- 日付変換に失敗した場合はスキップ
      partition_name := partition_record.table_name;
      drop_date := NULL;
      status := 'SKIPPED: Invalid date format in partition name';
      data_size := 'N/A';
      RETURN NEXT;
      CONTINUE;
    END;
    
    -- 保持期限より古い場合のみ削除
    IF partition_date < cutoff_date THEN
      BEGIN
        -- テーブルサイズ取得 (削除前)
        SELECT pg_size_pretty(pg_total_relation_size('public.' || partition_record.table_name)) 
        INTO table_size;
        
        -- ⚠️ 重要: DROP は不可逆操作
        -- 実行前に必ず保持ポリシーを確認し、バックアップが取られていることを確認すること
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', partition_record.table_name);
        
        -- 成功結果
        partition_name := partition_record.table_name;
        drop_date := partition_date;
        status := 'DROPPED';
        data_size := COALESCE(table_size, 'Unknown');
        RETURN NEXT;
        
      EXCEPTION WHEN OTHERS THEN
        -- 削除失敗
        partition_name := partition_record.table_name;
        drop_date := partition_date;
        status := 'ERROR: ' || SQLERRM;
        data_size := 'N/A';
        RETURN NEXT;
      END;
    ELSE
      -- 保持期限内のため保持
      partition_name := partition_record.table_name;
      drop_date := partition_date;
      status := 'RETAINED';
      data_size := 'N/A';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- 実行権限設定
REVOKE ALL ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) TO authenticated;

-- ⚠️ 重要な警告コメント
COMMENT ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) IS 
  '⚠️警告: 古いパーティションを永久削除します. 実行前に必ずバックアップとデータ保持ポリシーを確認してください. 使用例: SELECT * FROM admin_drop_old_partitions(''audit_logs'', 12)';
```

**使用例:**
```sql
-- audit_logs の12ヶ月より古いパーティションを削除
-- ⚠️ 実行前に必ず保持ポリシーを確認！
SELECT * FROM admin_drop_old_partitions('audit_logs', 12);

-- より厳しい6ヶ月保持の場合
SELECT * FROM admin_drop_old_partitions('audit_logs', 6);
```

## 5. データ移行用 SQL (実スキーマ対応)

### 5-1. バルクコピー用 INSERT...SELECT

```sql
-- ============================================
-- audit_logs → audit_logs_v2 データ移行SQL
-- 実スキーマの全列を完全コピー
-- ============================================

-- 全データの一括移行 (実スキーマの全13列をコピー)
INSERT INTO public.audit_logs_v2 (
  table_name,
  action, 
  row_data,
  old_data,
  changed_fields,
  user_id,
  user_email,
  session_id,
  ip_address,
  user_agent,
  api_endpoint,
  request_method,
  created_at
)
SELECT 
  table_name,
  action,
  row_data, 
  old_data,
  changed_fields,
  user_id,
  user_email,
  session_id,
  ip_address,
  user_agent,
  api_endpoint,
  request_method,
  created_at
FROM public.audit_logs
ORDER BY created_at;
-- 注意: id列は BIGSERIAL のため自動採番される (元のid値は保持されない)
```

### 5-2. 月単位の部分移行テンプレート

```sql
-- ============================================
-- 月単位の部分移行テンプレート
-- 大量データの場合は月単位で段階移行
-- ============================================

-- 例: 2024年12月分のデータのみ移行
INSERT INTO public.audit_logs_v2 (
  table_name, action, row_data, old_data, changed_fields,
  user_id, user_email, session_id, ip_address, user_agent,
  api_endpoint, request_method, created_at
)
SELECT 
  table_name, action, row_data, old_data, changed_fields,
  user_id, user_email, session_id, ip_address, user_agent,
  api_endpoint, request_method, created_at
FROM public.audit_logs
WHERE created_at >= '2024-12-01 00:00:00+00'
  AND created_at < '2025-01-01 00:00:00+00'
ORDER BY created_at;

-- 汎用的な月単位移行関数
CREATE OR REPLACE FUNCTION migrate_audit_logs_month(
  p_year_month TEXT  -- 'YYYYMM' format
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  migrated_count INTEGER;
BEGIN
  -- 管理者権限チェック
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  start_date := (p_year_month || '01')::DATE;
  end_date := start_date + INTERVAL '1 month';
  
  INSERT INTO public.audit_logs_v2 (
    table_name, action, row_data, old_data, changed_fields,
    user_id, user_email, session_id, ip_address, user_agent,
    api_endpoint, request_method, created_at
  )
  SELECT 
    table_name, action, row_data, old_data, changed_fields,
    user_id, user_email, session_id, ip_address, user_agent,
    api_endpoint, request_method, created_at
  FROM public.audit_logs
  WHERE created_at >= start_date
    AND created_at < end_date
  ORDER BY created_at
  ON CONFLICT (id, created_at) DO NOTHING;  -- 重複回避
  
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RETURN migrated_count;
END;
$$;
```

### 5-3. スワップ用SQL (実名)

```sql
-- ============================================
-- テーブル名スワップ (本番適用時の最終ステップ)
-- ⚠️ アトミックな切り替え - メンテナンスウィンドウで実行
-- ============================================

-- Step 1: 旧テーブルのバックアップ作成 (念のため)
BEGIN;
  ALTER TABLE public.audit_logs RENAME TO audit_logs_legacy_backup_20241204;
  ALTER TABLE public.audit_logs_v2 RENAME TO audit_logs;
COMMIT;

-- Step 2: 切り戻し用SQL (問題発生時)
-- BEGIN;
--   ALTER TABLE public.audit_logs RENAME TO audit_logs_v2_rollback;
--   ALTER TABLE public.audit_logs_legacy_backup_20241204 RENAME TO audit_logs;
-- COMMIT;
```

### 5-4. 移行実行手順書

```
# ============================================
# audit_logs パーティション化移行手順
# Supabase SQL Editor で順次実行
# ============================================

## Step 1: 事前確認 (Supabase SQL Editor で実行)
-- 既存データ量とサイズ確認
SELECT 
  COUNT(*) as total_rows,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  pg_size_pretty(pg_total_relation_size('public.audit_logs')) as table_size
FROM public.audit_logs;

## Step 2: audit_logs_v2 親テーブル作成 (上記の親テーブルDDLを実行)

## Step 3: 必要な月のパーティション作成 (Supabase SQL Editor で実行)
-- 既存データの期間に応じて必要な月を作成
SELECT admin_create_month_partition('audit_logs_v2', '202410');
SELECT admin_create_month_partition('audit_logs_v2', '202411'); 
SELECT admin_create_month_partition('audit_logs_v2', '202412');
SELECT admin_create_month_partition('audit_logs_v2', '202501');
-- 将来分も事前作成
SELECT admin_create_month_partition('audit_logs_v2', '202502');
SELECT admin_create_month_partition('audit_logs_v2', '202503');

## Step 4: データ移行実行 (Supabase SQL Editor で実行)
-- 方法A: 一括移行 (データ量少ない場合)
-- [上記の一括移行SQLを実行]

-- 方法B: 月単位移行 (データ量多い場合)
-- SELECT migrate_audit_logs_month('202410');
-- SELECT migrate_audit_logs_month('202411');
-- ...

## Step 5: 移行検証 (Supabase SQL Editor で実行)
SELECT 
  'Original' as source,
  COUNT(*) as row_count,
  MIN(created_at) as min_date,
  MAX(created_at) as max_date
FROM public.audit_logs
UNION ALL
SELECT 
  'Migrated',
  COUNT(*),
  MIN(created_at),
  MAX(created_at) 
FROM public.audit_logs_v2;

-- 月別の件数比較
SELECT 
  date_trunc('month', created_at) as month,
  COUNT(*) as original_count
FROM public.audit_logs
GROUP BY date_trunc('month', created_at)
ORDER BY month;

SELECT 
  date_trunc('month', created_at) as month,
  COUNT(*) as migrated_count  
FROM public.audit_logs_v2
GROUP BY date_trunc('month', created_at)
ORDER BY month;

## Step 6: 差分移行 (移行中に追加されたデータ)
-- 移行開始時刻以降のデータを追加コピー
-- (移行開始時刻は記録しておく)

## Step 7: 本番切り替え (メンテナンスウィンドウ)
-- [上記のスワップSQLを実行]

## Step 8: 切り替え後動作確認
-- Next.js管理画面での audit_logs クエリ動作確認
-- パーティション・プルーニング効果確認:
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM audit_logs 
WHERE created_at >= '2024-12-01' AND created_at < '2025-01-01'
LIMIT 100;

## Step 9: 旧テーブル保持判断 (1-2週間後)
-- 問題なければ audit_logs_legacy_backup_20241204 削除
-- DROP TABLE public.audit_logs_legacy_backup_20241204;
```

## 6. Edge Function partition-maintenance (このプロジェクト用)

### 6-1. job_runs_v2 スキーマ確認

既存コードから job_runs_v2 のカラム構成を確認:
- `id`, `job_name`, `status`, `started_at`, `finished_at`, `meta`, `idempotency_key`

### 6-2. 完成版 Edge Function

```typescript
// supabase/functions/partition-maintenance/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// このプロジェクトで実際にパーティション化されているテーブル
const PARTITION_TABLES = [
  'audit_logs',        // 新しくパーティション化予定 (スワップ後)
  'activities',        // 既存のパーティション化済み
  'ai_bot_logs',       // 既存のパーティション化済み  
  'analytics_events',  // 既存のパーティション化済み
  'rate_limit_requests', // 既存のパーティション化済み
  'rate_limit_logs',   // 既存のパーティション化済み
  'security_incidents' // 既存のパーティション化済み
] as const;

type PartitionTable = typeof PARTITION_TABLES[number];

interface PartitionMaintenanceResult {
  function_name: string;
  status: 'succeeded' | 'failed' | 'partial_error';
  started_at: string;
  finished_at: string;
  duration_ms: number;
  error_message?: string;
  summary: {
    created_partitions: string[];
    dropped_partitions: string[];
    skipped_tables: string[];
    errors: Array<{table: string, operation: string, error: string}>;
  };
}

serve(async (req) => {
  console.log(`🚀 partition-maintenance started: ${new Date().toISOString()}`);
  
  try {
    // 環境変数確認
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!serviceKey || !supabaseUrl) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL environment variables');
    }

    // Supabase Service Role クライアント作成
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    const startTime = new Date();
    const result: PartitionMaintenanceResult = {
      function_name: 'partition-maintenance',
      status: 'succeeded',
      started_at: startTime.toISOString(),
      finished_at: '', // 後で設定
      duration_ms: 0,  // 後で計算
      summary: {
        created_partitions: [],
        dropped_partitions: [],
        skipped_tables: [],
        errors: []
      }
    };

    // パラメータ解析
    const url = new URL(req.url);
    const createMonths = parseInt(url.searchParams.get('create_months') || '3');
    const retentionMonths = parseInt(url.searchParams.get('retention_months') || '12');
    const dryRun = url.searchParams.get('dry_run') === 'true';

    console.log(`📋 Parameters: create_months=${createMonths}, retention_months=${retentionMonths}, dry_run=${dryRun}`);

    // 機能A: 将来パーティション作成
    console.log(`📅 Creating future partitions...`);
    for (const table of PARTITION_TABLES) {
      try {
        const createdPartitions = await createFuturePartitions(supabase, table, createMonths, dryRun);
        result.summary.created_partitions.push(...createdPartitions);
        console.log(`✅ ${table}: Created ${createdPartitions.length} partitions`);
      } catch (error) {
        console.error(`❌ ${table} partition creation failed:`, error);
        result.summary.errors.push({
          table,
          operation: 'create_partitions',
          error: error.message
        });
        result.status = 'partial_error';
      }
    }

    // 機能B: 古いパーティション削除
    if (!dryRun) {
      console.log(`🗑️ Dropping old partitions (retention: ${retentionMonths} months)...`);
      for (const table of PARTITION_TABLES) {
        try {
          const droppedPartitions = await dropOldPartitions(supabase, table, retentionMonths, dryRun);
          result.summary.dropped_partitions.push(...droppedPartitions);
          console.log(`🗑️ ${table}: Dropped ${droppedPartitions.length} partitions`);
        } catch (error) {
          console.error(`❌ ${table} partition cleanup failed:`, error);
          result.summary.errors.push({
            table,
            operation: 'drop_partitions', 
            error: error.message
          });
          result.status = 'partial_error';
        }
      }
    } else {
      console.log(`⚠️ Skipping partition drops (dry_run=true)`);
    }

    const endTime = new Date();
    result.finished_at = endTime.toISOString();
    result.duration_ms = endTime.getTime() - startTime.getTime();

    if (result.summary.errors.length > 0) {
      result.status = result.summary.errors.length === PARTITION_TABLES.length * 2 ? 'failed' : 'partial_error';
      result.error_message = `${result.summary.errors.length} errors occurred during partition maintenance`;
    }

    // job_runs_v2 テーブルに実行結果を記録 (実際のスキーマに合わせて調整)
    if (!dryRun) {
      try {
        const jobRecord = {
          job_name: 'partition-maintenance',
          status: result.status,
          started_at: result.started_at,
          finished_at: result.finished_at,
          error_message: result.error_message || null,
          meta: {
            function_name: result.function_name,
            duration_ms: result.duration_ms,
            summary: result.summary,
            parameters: {
              create_months: createMonths,
              retention_months: retentionMonths,
              dry_run: dryRun
            }
          },
          idempotency_key: `partition-maintenance-${Date.now()}`
        };
        
        const { error: insertError } = await supabase
          .from('job_runs_v2')
          .insert(jobRecord);
        
        if (insertError) {
          console.error('Failed to insert job run record:', insertError);
        } else {
          console.log(`📝 Job run recorded in job_runs_v2`);
        }
      } catch (insertError) {
        console.error('Failed to insert job run record:', insertError);
      }
    }

    console.log(`🎉 partition-maintenance completed: ${result.status}`);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Partition maintenance failed:', error);
    
    const errorResult = {
      function_name: 'partition-maintenance',
      status: 'failed',
      error_message: error.message,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      summary: {
        created_partitions: [],
        dropped_partitions: [],
        skipped_tables: [],
        errors: [{ table: 'system', operation: 'initialization', error: error.message }]
      }
    };
    
    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

/**
 * 指定したテーブルの将来のパーティションを作成 (このプロジェクト用RPC呼び出し)
 */
async function createFuturePartitions(
  supabase: any,
  tableName: PartitionTable, 
  monthsAhead: number,
  dryRun: boolean
): Promise<string[]> {
  const createdPartitions: string[] = [];
  const today = new Date();

  for (let i = 0; i <= monthsAhead; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const yearMonth = formatYearMonth(targetDate);
    const partitionName = `${tableName}_${yearMonth}`;

    if (dryRun) {
      console.log(`[DRY RUN] Would create partition: ${partitionName}`);
      createdPartitions.push(partitionName + ' (dry-run)');
    } else {
      try {
        // admin_create_month_partition RPC 呼び出し
        const { data, error } = await supabase.rpc('admin_create_month_partition', {
          p_table_name: tableName,
          p_year_month: yearMonth
        });
        
        if (error) {
          // 既に存在する場合は警告レベル
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`ℹ️ Partition ${partitionName} already exists (OK)`);
            createdPartitions.push(partitionName + ' (exists)');
          } else {
            throw new Error(`RPC call failed for ${partitionName}: ${error.message}`);
          }
        } else {
          console.log(`✅ Created partition: ${partitionName}`);
          createdPartitions.push(partitionName);
        }
      } catch (error) {
        console.error(`❌ Failed to create ${partitionName}:`, error);
        throw error;
      }
    }
  }

  return createdPartitions;
}

/**
 * 保持期間を過ぎた古いパーティションを削除 (このプロジェクト用RPC呼び出し)
 */
async function dropOldPartitions(
  supabase: any,
  tableName: PartitionTable,
  retentionMonths: number,
  dryRun: boolean
): Promise<string[]> {
  if (dryRun) {
    return [`${tableName} (dry-run - would check for old partitions)`];
  }
  
  const droppedPartitions: string[] = [];
  
  try {
    // admin_drop_old_partitions RPC 呼び出し
    const { data, error } = await supabase.rpc('admin_drop_old_partitions', {
      p_parent_table: tableName,
      p_keep_months: retentionMonths
    });
    
    if (error) {
      throw new Error(`RPC call failed for ${tableName}: ${error.message}`);
    }
    
    // RPC結果を処理
    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row.status === 'DROPPED') {
          droppedPartitions.push(`${row.partition_name} (${row.data_size})`);
        }
      }
    }
    
    console.log(`🗑️ Processed ${tableName}: ${droppedPartitions.length} partitions dropped`);
    
  } catch (error) {
    console.error(`❌ Failed to drop old partitions for ${tableName}:`, error);
    throw error;
  }

  return droppedPartitions;
}

/**
 * ユーティリティ関数
 */
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}${month}`;
}

console.log("🔧 partition-maintenance Edge Function initialized");
```

## 7. マイグレーションファイル統合版

```sql
-- ============================================
-- supabase/migrations/20241204_p47_audit_logs_partitioning.sql
-- P4-7: audit_logs パーティション化実装
-- ============================================

-- ============================================
-- 1. 必要な拡張確認
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 2. audit_logs_v2 親テーブル作成 (実スキーマ準拠)
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs_v2 (
    id BIGSERIAL,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    row_data JSONB,
    old_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    api_endpoint TEXT,
    request_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT audit_logs_v2_valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
) PARTITION BY RANGE (created_at);

-- パーティション複合主キー設定
ALTER TABLE public.audit_logs_v2 ADD CONSTRAINT audit_logs_v2_pkey PRIMARY KEY (id, created_at);

-- 親テーブル用インデックス
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_table_action_time ON public.audit_logs_v2 (table_name, action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_user_time ON public.audit_logs_v2 (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_created_at ON public.audit_logs_v2 (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_v2_ip_time ON public.audit_logs_v2 (ip_address, created_at) WHERE ip_address IS NOT NULL;

-- テーブルコメント
COMMENT ON TABLE public.audit_logs_v2 IS 'パーティション化された監査ログ親テーブル (created_at による月次パーティション)';

-- ============================================
-- 3. RLS ポリシー設定
-- ============================================

ALTER TABLE public.audit_logs_v2 ENABLE ROW LEVEL SECURITY;

-- 管理者のみ閲覧可能
CREATE POLICY "audit_logs_v2_admin_select" ON public.audit_logs_v2
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
    )
  );

-- システムからのINSERT
CREATE POLICY "audit_logs_v2_system_insert" ON public.audit_logs_v2
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    current_setting('role') = 'postgres' OR
    auth.uid() IS NULL
  );

-- ============================================
-- 4. 初期パーティション作成 (直近数ヶ月分)
-- ============================================

-- 2024年12月分
CREATE TABLE public.audit_logs_202412 PARTITION OF public.audit_logs_v2
  FOR VALUES FROM ('2024-12-01 00:00:00+00') TO ('2025-01-01 00:00:00+00');

-- 2025年1月分
CREATE TABLE public.audit_logs_202501 PARTITION OF public.audit_logs_v2
  FOR VALUES FROM ('2025-01-01 00:00:00+00') TO ('2025-02-01 00:00:00+00');

-- 2025年2月分  
CREATE TABLE public.audit_logs_202502 PARTITION OF public.audit_logs_v2
  FOR VALUES FROM ('2025-02-01 00:00:00+00') TO ('2025-03-01 00:00:00+00');

-- 2025年3月分
CREATE TABLE public.audit_logs_202503 PARTITION OF public.audit_logs_v2
  FOR VALUES FROM ('2025-03-01 00:00:00+00') TO ('2025-04-01 00:00:00+00');

-- ============================================
-- 5. 子テーブルインデックス作成
-- ============================================

-- 2024年12月分
CREATE INDEX idx_audit_logs_202412_created_at ON public.audit_logs_202412 (created_at);
CREATE INDEX idx_audit_logs_202412_table_action ON public.audit_logs_202412 (table_name, action);
CREATE INDEX idx_audit_logs_202412_user_id ON public.audit_logs_202412 (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_202412_ip_address ON public.audit_logs_202412 (ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_202412_api_endpoint ON public.audit_logs_202412 (api_endpoint) WHERE api_endpoint IS NOT NULL;

-- 2025年1月分
CREATE INDEX idx_audit_logs_202501_created_at ON public.audit_logs_202501 (created_at);
CREATE INDEX idx_audit_logs_202501_table_action ON public.audit_logs_202501 (table_name, action);
CREATE INDEX idx_audit_logs_202501_user_id ON public.audit_logs_202501 (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_202501_ip_address ON public.audit_logs_202501 (ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_202501_api_endpoint ON public.audit_logs_202501 (api_endpoint) WHERE api_endpoint IS NOT NULL;

-- 2025年2月分
CREATE INDEX idx_audit_logs_202502_created_at ON public.audit_logs_202502 (created_at);
CREATE INDEX idx_audit_logs_202502_table_action ON public.audit_logs_202502 (table_name, action);
CREATE INDEX idx_audit_logs_202502_user_id ON public.audit_logs_202502 (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_202502_ip_address ON public.audit_logs_202502 (ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_202502_api_endpoint ON public.audit_logs_202502 (api_endpoint) WHERE api_endpoint IS NOT NULL;

-- 2025年3月分
CREATE INDEX idx_audit_logs_202503_created_at ON public.audit_logs_202503 (created_at);
CREATE INDEX idx_audit_logs_202503_table_action ON public.audit_logs_202503 (table_name, action);
CREATE INDEX idx_audit_logs_202503_user_id ON public.audit_logs_202503 (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_202503_ip_address ON public.audit_logs_202503 (ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX idx_audit_logs_202503_api_endpoint ON public.audit_logs_202503 (api_endpoint) WHERE api_endpoint IS NOT NULL;

-- ============================================
-- 6. 月次パーティション作成関数
-- ============================================

CREATE OR REPLACE FUNCTION admin_create_month_partition(
  p_table_name TEXT,
  p_year_month TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_table_name TEXT;
  start_date DATE;
  end_date DATE;
  start_ts TEXT;
  end_ts TEXT;
BEGIN
  IF p_table_name IS NULL OR p_year_month IS NULL THEN
    RAISE EXCEPTION 'table_name and year_month are required';
  END IF;
  
  IF p_year_month !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'year_month must be in YYYYMM format, got: %', p_year_month;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  
  child_table_name := p_table_name || '_' || p_year_month;
  start_date := (p_year_month || '01')::DATE;
  end_date := start_date + INTERVAL '1 month';
  start_ts := start_date::TEXT || ' 00:00:00+00';
  end_ts := end_date::TEXT || ' 00:00:00+00';
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.%I 
     FOR VALUES FROM (%L) TO (%L)',
    child_table_name, p_table_name, start_ts, end_ts
  );
  
  IF p_table_name IN ('audit_logs', 'audit_logs_v2') THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON public.%I (created_at)', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_table_action ON public.%I (table_name, action)', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON public.%I (user_id) WHERE user_id IS NOT NULL', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_ip_address ON public.%I (ip_address) WHERE ip_address IS NOT NULL', 
                   child_table_name, child_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_api_endpoint ON public.%I (api_endpoint) WHERE api_endpoint IS NOT NULL', 
                   child_table_name, child_table_name);
  ELSE
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON public.%I (created_at)', 
                   child_table_name, child_table_name);
  END IF;
  
  RETURN format('Created partition %s for range %s to %s', child_table_name, start_ts, end_ts);
END;
$$;

REVOKE ALL ON FUNCTION admin_create_month_partition(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_month_partition(TEXT, TEXT) TO authenticated;
COMMENT ON FUNCTION admin_create_month_partition(TEXT, TEXT) IS '月次パーティション作成関数';

-- ============================================
-- 7. 複数テーブル一括パーティション作成関数
-- ============================================

CREATE OR REPLACE FUNCTION admin_create_next_month_partitions(
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS TABLE(
  table_name TEXT,
  partition_name TEXT,
  date_range TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_tables TEXT[] := ARRAY[
    'audit_logs', 'activities', 'ai_bot_logs', 'analytics_events',
    'rate_limit_requests', 'rate_limit_logs', 'security_incidents'
  ];
  current_table TEXT;
  target_month DATE;
  year_month_str TEXT;
  result_record RECORD;
  i INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required for partition management';
  END IF;
  
  FOREACH current_table IN ARRAY log_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = current_table
    ) THEN
      table_name := current_table;
      partition_name := 'N/A';
      date_range := 'N/A';
      status := 'SKIPPED: Table does not exist';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    FOR i IN 0..p_months_ahead LOOP
      target_month := date_trunc('month', CURRENT_DATE) + (i || ' months')::INTERVAL;
      year_month_str := to_char(target_month, 'YYYYMM');
      
      BEGIN
        SELECT admin_create_month_partition(current_table, year_month_str) INTO result_record;
        table_name := current_table;
        partition_name := current_table || '_' || year_month_str;
        date_range := to_char(target_month, 'YYYY-MM-01') || ' to ' || to_char(target_month + INTERVAL '1 month', 'YYYY-MM-01');
        status := 'SUCCESS';
        RETURN NEXT;
      EXCEPTION WHEN OTHERS THEN
        table_name := current_table;
        partition_name := current_table || '_' || year_month_str;
        date_range := to_char(target_month, 'YYYY-MM-01') || ' to ' || to_char(target_month + INTERVAL '1 month', 'YYYY-MM-01');
        status := 'ERROR: ' || SQLERRM;
        RETURN NEXT;
      END;
    END LOOP;
  END LOOP;
  
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION admin_create_next_month_partitions(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_create_next_month_partitions(INTEGER) TO authenticated;
COMMENT ON FUNCTION admin_create_next_month_partitions(INTEGER) IS '複数ログテーブルの次月パーティション一括作成';

-- ============================================
-- 8. 古いパーティション削除関数
-- ============================================

CREATE OR REPLACE FUNCTION admin_drop_old_partitions(
  p_parent_table TEXT,
  p_keep_months INTEGER DEFAULT 12
)
RETURNS TABLE(
  partition_name TEXT,
  drop_date DATE,
  status TEXT,
  data_size TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff_date DATE;
  partition_record RECORD;
  partition_year_month TEXT;
  partition_date DATE;
  table_size TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_app_meta_data ->> 'role' IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Admin privileges required for partition deletion';
  END IF;
  
  IF p_parent_table IS NULL OR p_keep_months <= 0 THEN
    RAISE EXCEPTION 'Invalid arguments: parent_table=%, keep_months=%', p_parent_table, p_keep_months;
  END IF;
  
  cutoff_date := date_trunc('month', CURRENT_DATE) - (p_keep_months || ' months')::INTERVAL;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_parent_table
  ) THEN
    RAISE EXCEPTION 'Parent table % does not exist', p_parent_table;
  END IF;
  
  FOR partition_record IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
    AND t.table_name ~ ('^' || p_parent_table || '_[0-9]{6}$')
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  LOOP
    partition_year_month := regexp_replace(partition_record.table_name, '^.*_([0-9]{6})$', '\1');
    
    BEGIN
      partition_date := (partition_year_month || '01')::DATE;
    EXCEPTION WHEN OTHERS THEN
      partition_name := partition_record.table_name;
      drop_date := NULL;
      status := 'SKIPPED: Invalid date format in partition name';
      data_size := 'N/A';
      RETURN NEXT;
      CONTINUE;
    END;
    
    IF partition_date < cutoff_date THEN
      BEGIN
        SELECT pg_size_pretty(pg_total_relation_size('public.' || partition_record.table_name)) 
        INTO table_size;
        
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', partition_record.table_name);
        
        partition_name := partition_record.table_name;
        drop_date := partition_date;
        status := 'DROPPED';
        data_size := COALESCE(table_size, 'Unknown');
        RETURN NEXT;
        
      EXCEPTION WHEN OTHERS THEN
        partition_name := partition_record.table_name;
        drop_date := partition_date;
        status := 'ERROR: ' || SQLERRM;
        data_size := 'N/A';
        RETURN NEXT;
      END;
    ELSE
      partition_name := partition_record.table_name;
      drop_date := partition_date;
      status := 'RETAINED';
      data_size := 'N/A';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) TO authenticated;
COMMENT ON FUNCTION admin_drop_old_partitions(TEXT, INTEGER) IS '⚠️警告: 古いパーティションを永久削除. 実行前に必ずバックアップを確認';

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== P4-7: audit_logs パーティション化実装完了 ===';
  RAISE NOTICE '1. audit_logs_v2 親テーブル作成 (実スキーマ準拠)';
  RAISE NOTICE '2. 月次パーティション (202412〜202503) 作成済み';
  RAISE NOTICE '3. RLS ポリシー設定完了 (管理者のみアクセス)';
  RAISE NOTICE '4. admin_create_month_partition 関数';
  RAISE NOTICE '5. admin_create_next_month_partitions 関数';
  RAISE NOTICE '6. admin_drop_old_partitions 関数';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ:';
  RAISE NOTICE '1. データ移行: 既存 audit_logs → audit_logs_v2';
  RAISE NOTICE '2. 検証: 移行データの整合性確認';
  RAISE NOTICE '3. スワップ: audit_logs ↔ audit_logs_v2';
  RAISE NOTICE '4. Edge Function デプロイ: partition-maintenance';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ スワップは手動実行推奨';
END $$;

-- ============================================
-- スワップ用SQL (コメントとして残す)
-- ============================================

/*
-- 本番スワップ時に実行 (メンテナンスウィンドウで)
BEGIN;
  ALTER TABLE public.audit_logs RENAME TO audit_logs_legacy_backup_20241204;
  ALTER TABLE public.audit_logs_v2 RENAME TO audit_logs;
COMMIT;

-- 切り戻し用 (問題発生時)
BEGIN;
  ALTER TABLE public.audit_logs RENAME TO audit_logs_v2_rollback;
  ALTER TABLE public.audit_logs_legacy_backup_20241204 RENAME TO audit_logs;
COMMIT;
*/
```

## 8. 作業サマリと実行ステップ

### 作成/変更ファイル一覧

1. **`supabase/migrations/20241204_p47_audit_logs_partitioning.sql`** - 新規作成
   - audit_logs_v2 親テーブル定義
   - 初期パーティション (202412〜202503)
   - RPC関数 3個 (create/batch/drop)

2. **`supabase/functions/partition-maintenance/index.ts`** - 新規作成  
   - Deno/TypeScript Edge Function
   - job_runs_v2 連携
   - 月次自動実行対応

### Supabase 側実行ステップ (ユーザー作業)

#### **Phase 1: インフラ構築**
1. **マイグレーション実行**
   ```sql
   -- Supabase SQL Editor で実行
   -- supabase/migrations/20241204_p47_audit_logs_partitioning.sql の内容をコピペ実行
   ```

2. **Edge Function デプロイ**
   ```bash
   cd supabase/functions
   supabase functions deploy partition-maintenance
   ```

3. **動作確認**
   ```sql
   -- パーティション作成テスト
   SELECT admin_create_month_partition('audit_logs_v2', '202504');
   
   -- 一括作成テスト
   SELECT * FROM admin_create_next_month_partitions(2);
   ```

#### **Phase 2: データ移行 (慎重に実行)**
4. **既存データ量確認**
   ```sql
   SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM audit_logs;
   ```

5. **データ移行実行**
   ```sql
   -- 小規模な場合: 一括移行
   INSERT INTO audit_logs_v2 (...) SELECT ... FROM audit_logs;
   
   -- 大規模な場合: 月単位移行
   SELECT migrate_audit_logs_month('202410');
   -- 各月を順次実行
   ```

6. **移行検証**
   ```sql
   -- 件数一致確認
   SELECT 'original', COUNT(*) FROM audit_logs
   UNION ALL 
   SELECT 'migrated', COUNT(*) FROM audit_logs_v2;
   ```

#### **Phase 3: 本番切り替え**
7. **本番スワップ** (メンテナンスウィンドウ)
   ```sql
   BEGIN;
     ALTER TABLE audit_logs RENAME TO audit_logs_legacy_backup_20241204;
     ALTER TABLE audit_logs_v2 RENAME TO audit_logs;
   COMMIT;
   ```

8. **動作確認**
   - Next.js 管理画面での audit_logs クエリ確認
   - パーティション・プルーニング効果確認

#### **Phase 4: 運用自動化**
9. **Cron 設定** (Supabase Dashboard)
   ```
   Schedule: 0 2 1 * * (毎月1日 2:00 AM)
   Function: partition-maintenance
   ```

10. **監視設定**
    - job_runs_v2 の失敗アラート
    - パーティション作成状況監視

### リスク管理
- **バックアップ**: 既存 audit_logs の事前バックアップ
- **切り戻し計画**: スワップSQL の逆操作準備
- **段階実行**: Phase単位での確認・承認プロセス
- **影響範囲**: Next.js audit_logs クエリの事前テスト

**実装担当**: Claude Code  
**実行担当**: ユーザー (Supabase操作)  
**完了予定**: Phase 1-2: 1週間, Phase 3-4: 2週間