# Supabase DB構造検証ガイド

Generated: 2025-12-30
Methodology: Static analysis of `supabase/migrations/*.sql` and `src/**/*.{ts,tsx}`

---

## 危険操作の禁止

**以下の操作は本番DBでは絶対に実行しないこと：**

```sql
-- 禁止: データ破壊系
DROP TABLE ...
DROP COLUMN ...
TRUNCATE ...
DELETE FROM ... (WHERE句なし)

-- 禁止: スキーマ破壊系
ALTER TABLE ... DROP CONSTRAINT ...
DROP INDEX ...
DROP FUNCTION ...

-- 禁止: 権限操作
REVOKE ...
DROP ROLE ...
```

---

## 1. テーブル存在確認SQL

```sql
-- 期待するテーブル一覧（migrations由来: 36テーブル）
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'organizations', 'services', 'posts', 'case_studies', 'faqs',
      'contact_points', 'app_users', 'partners', 'subscriptions',
      'audit_logs', 'audit_log', 'redirects', 'approval_history',
      'stripe_products', 'stripe_customers', 'webhook_events',
      'reports', 'hearing_requests', 'qa_categories', 'qa_entries',
      'qa_content_logs', 'qa_question_templates', 'ai_visibility_logs',
      'blocked_ips', 'rate_limit_logs', 'ai_visibility_config',
      'partner_organizations', 'organization_members', 'organization_groups',
      'org_group_members', 'org_group_invites', 'org_group_join_requests',
      'payment_history', 'email_logs', 'idempotency_keys', 'schema_snapshots'
    ) THEN 'EXPECTED'
    ELSE 'EXTRA'
  END as migration_status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY migration_status, table_name;
```

**期待結果**: 36テーブルが全てEXPECTEDとして表示される

---

## 2. アプリが参照しているが migrations に無いテーブル確認

```sql
-- GAP確認: アプリが参照しているテーブルの存在チェック
SELECT
  t.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
  VALUES
    ('ai_interview_sessions'),
    ('ai_monthly_reports'),
    ('profiles'),
    ('plans'),
    ('features'),
    ('analytics_events'),
    ('job_runs_v2'),
    ('ai_bot_logs'),
    ('monthly_report_jobs'),
    ('materials'),
    ('intrusion_events'),
    ('alert_events'),
    ('site_settings'),
    ('cms_sections'),
    ('translations'),
    ('embeddings')
) AS expected(table_name)
LEFT JOIN information_schema.tables t
  ON t.table_name = expected.table_name
  AND t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE';
```

**期待結果**:
- `EXISTS`: DBにはあるがmigrationファイルが見つからない（要migration追加）
- `MISSING`: DBにもない（アプリのバグか別スキーマ）

---

## 3. カラム定義確認（主要テーブル）

### 3.1 organizations テーブル

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE
    WHEN column_name IN (
      'id', 'name', 'slug', 'legal_form', 'representative_name',
      'founded', 'capital', 'employees', 'description',
      'address_country', 'address_region', 'address_locality',
      'street_address', 'postal_code', 'telephone', 'email',
      'email_public', 'url', 'logo_url', 'same_as', 'gbp_url',
      'industries', 'eeat', 'status', 'owner_user_id', 'partner_id',
      'created_by', 'created_at', 'updated_at', 'feature_flags',
      'entitlements', 'is_published', 'default_locale'
    ) THEN 'EXPECTED'
    ELSE 'EXTRA'
  END as migration_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;
```

**期待カラム数**: 33

### 3.2 services テーブル

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'services'
ORDER BY ordinal_position;
```

**期待カラム**: id, organization_id, name, summary, description, features, price, duration_months, category, media, cta_url, status, created_by, created_at, updated_at

---

## 4. 制約・インデックス確認

### 4.1 CHECK制約一覧

```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;
```

**主要な期待CHECK制約**:
- `organizations`: status IN ('draft','waiting_approval','published','paused','archived')
- `app_users`: role IN ('admin','partner','org_owner','org_editor','viewer')
- `subscriptions`: plan IN ('basic','pro'), status IN ('active','paused','cancelled')

### 4.2 インデックス一覧

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**期待インデックス数**: 67

---

## 5. RLS / ポリシー確認

### 5.1 RLS有効テーブル

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;
```

**期待RLSテーブル数**: 25

### 5.2 ポリシー一覧

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 6. 関数・トリガー確認

### 6.1 関数一覧

```sql
SELECT
  routine_name,
  routine_type,
  security_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**期待関数数**: 44

### 6.2 トリガー一覧

```sql
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**期待トリガー数**: 43

---

## 7. View一覧

```sql
SELECT
  table_name as view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public';
```

**期待View**: `audit_log_readable`, `ai_visibility_summary`

---

## Supabaseアシスタントへの質問テンプレート

### Q1: GAP確認
> 以下のテーブルがDBに存在するか確認してください。存在する場合はカラム定義も含めて教えてください：
> - ai_interview_sessions
> - ai_monthly_reports
> - profiles
> - plans
> - features
> - analytics_events

### Q2: RLS状態確認
> public.organizations テーブルのRLS状態と、設定されているポリシー一覧を教えてください。

### Q3: FK整合性確認
> services.organization_id → organizations.id の外部キー制約が正しく設定されているか確認してください。

### Q4: 関数存在確認
> 以下のRPC関数が存在するか確認してください：
> - get_my_organizations_slim
> - is_site_admin
> - has_org_role
> - check_and_consume_quota

### Q5: インデックス効率確認
> organizations テーブルに設定されているインデックス一覧と、直近のクエリ統計（pg_stat_user_indexes）を教えてください。

---

## 期待サマリー

| カテゴリ | 期待値 |
|---------|--------|
| テーブル数（migrations定義） | 36 |
| テーブル数（アプリ参照） | 166 |
| GAP（要調査） | 約130 |
| RLS有効テーブル | 25 |
| インデックス数 | 67 |
| 関数数 | 44 |
| トリガー数 | 43 |
| View数 | 2 |
| RLSポリシー数 | 19 |

---

## 重要な確認ポイント

1. **GAP 130テーブル**: アプリが参照している166テーブル中、migrationで定義が確認できるのは36テーブルのみ。残りは：
   - Supabase内蔵テーブル（auth.users等）
   - 別途手動作成されたテーブル
   - アプリのバグ（存在しないテーブル参照）

2. **二重監査テーブル**: `audit_logs` と `audit_log` が両方存在する可能性。統合検討が必要。

3. **カラム名不整合**: `org_id` vs `organization_id` がテーブルによって混在。

4. **欠落マイグレーション**: AI Interview系、Reports系のマイグレーションファイルが見つからない。
