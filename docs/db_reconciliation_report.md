# DB整合性統合レポート（最終版）

**作成日**: 2024-12-23
**最終更新**: 2024-12-23
**検証方法**: Supabaseアシスタントによる実DB確認
**基準**: 実DBの確定情報を最優先の事実として扱う

> **用語注記（2024-12-25追記）**:
> - 本文書中の `user_organizations` は `organization_members` テーブル/Viewを指します
> - 現行アーキテクチャは `docs/core-architecture.md` を参照

---

## A. 差分サマリー（誤→正、全件）

### A-1. RPC関数

| # | 誤（コード側の認識） | 正（実DB確認結果） | 影響度 | 対応状況 |
|---|---------------------|-------------------|--------|----------|
| 1 | increment_org_interview_stats が存在する | **存在しない** - 新規作成が必要 | 🔴高 | 未対応 |
| 2 | fn_build_monthly_kpis は単一関数 | **public と analytics に重複** - 統一が必要 | 🔴高 | 未対応 |
| 3 | auto_block_ip は void を返す | **uuid を返す** - 仕様統一が必要 | 🟡中 | 未対応 |
| 4 | ai_interview_logs テーブルを参照 | **存在しない** - ai_interview_messages が正 | ✅完了 | コード修正済み |
| 5 | qna_stats テーブルを参照 | **存在しない** - qna_events から集計で代替 | 🟡中 | 代替案あり |

### A-2. テーブル/ビュー

| # | 誤（コード側の認識） | 正（実DB確認結果） | 影響度 | 対応状況 |
|---|---------------------|-------------------|--------|----------|
| 1 | ai_interviews テーブルを参照 | **存在しない** - ai_interview_sessions に移行済み | 🔴高 | 要コード修正 |
| 2 | reports テーブルを参照 | **存在しない** - ai_monthly_reports が現行 | 🔴高 | 要コード修正 |
| 3 | organization_groups テーブルを参照 | **存在しない** - 作成または機能削除が必要 | 🟡中 | 方針決定要 |
| 4 | user_violation_stats テーブルを参照 | **存在しない** - 集計ビュー作成が必要 | 🟢低 | 中期対応 |
| 5 | ai_citation_kpis_daily テーブルを参照 | **存在しない** - マテビュー設計が必要 | 🟢低 | 中期対応 |
| 6 | ai_citation_integrity_daily テーブルを参照 | **存在しない** - マテビュー設計が必要 | 🟢低 | 中期対応 |
| 7 | site_settings テーブルを参照 | **存在しない** - cms_site_settings で代替可能 | 🟢低 | 代替使用可 |

### A-3. 仕様不一致

| # | 項目 | 現状 | 推奨対応 |
|---|------|------|----------|
| 1 | report_jobs vs monthly_report_jobs | 両方存在 | 役割明確化、monthly_report_jobs を正式採用 |
| 2 | auto_block_ip 戻り値 | DB: uuid, コード: void想定 | uuid を公式仕様として統一 |
| 3 | レガシーバックアップ | monthly_reports_legacy と ai_monthly_reports が共存 | ai_monthly_reports が現行、legacy は参照専用 |

---

## B. 確定版インベントリ

### B-1. RPC関数（確定・厳密版）

| スキーマ.関数名 | 引数 | 戻り値 | 状態 |
|----------------|------|--------|------|
| `public.get_plan_features` | `p_org_id uuid` | `jsonb` | ✅確認済 |
| `public.count_report_regenerations` | `p_org_id uuid, p_period_start date, p_period_end date` | `integer` | ✅確認済 |
| `public.increment_used_count` | `p_code text` | `void` | ✅確認済 |
| `public.fn_build_monthly_kpis` | `p_org_id uuid, p_period_start date, p_period_end date` | `jsonb` | ⚠️重複あり |
| `analytics.fn_build_monthly_kpis` | `p_org_id uuid, p_start date, p_end date` | `jsonb` | ⚠️重複（削除候補） |
| `public.log_service_role_action` | `p_job_name text, p_request_id text, p_expected_row_count integer, p_affected_row_count integer, p_error_code text, p_meta jsonb` | `void` | ✅確認済 |
| `public.get_database_stats` | (なし) | `jsonb` | ✅確認済 |
| `public.auto_block_ip` | `target_ip inet, block_reason text, block_duration_minutes integer` | `uuid` | ✅確認済（⚠️uuid返却） |
| `public.check_rate_limit_db` | `limit_key text, window_seconds integer, max_requests integer` | `jsonb` | ✅確認済 |
| `public.enqueue_embedding_job` | `p_org_id uuid, p_source_table text, p_source_id uuid, p_source_field text, p_content_text text, p_chunk_strategy text, p_embedding_model text, p_priority smallint` | `uuid` | ✅確認済 |
| `public.enqueue_cache_invalidation` | `_path text, _source_id uuid` | `void` | ✅確認済 |
| `public.enqueue_cache_invalidation` | `p_scope text, p_path text, p_org_id uuid, p_lang text, p_source_table text, p_source_id uuid` | `void` | ✅オーバーロード |
| `public.increment_org_interview_stats` | 未定義 | 未定義 | 🔴**未実装** |

### B-2. ビュー/マテビュー（確定）

| 名前 | 主要カラム | 状態 |
|------|-----------|------|
| `public.user_organizations` | user_id, organization_id, role, name, slug, plan_id, feature_flags, entitlements, is_published, org_created_at | ✅確認済 |
| `public.view_org_plans` | organization_id, plan_id, features | ✅確認済 |
| `public.view_ai_starter_caps_current` | organization_id, monthly_limit, used_count, remaining | ✅確認済 |
| `public.view_report_regen_limit_current` | organization_id, monthly_limit, used_count, remaining | ✅確認済 |
| `public.v_ai_citations_aggregates` | response_id, organization_id, session_id, user_id, model, citations_count, total_weight, max_score, avg_score | ✅確認済 |
| `public.mv_ai_citations_org_period` | organization_id, day_bucket, source_key, citations_count, total_weight (Materialized) | ✅確認済 |

### B-3. 主要テーブル（確定）

| テーブル名 | 状態 | 備考 |
|-----------|------|------|
| ai_monthly_reports | ✅存在 | 現行レポートテーブル |
| monthly_report_jobs | ✅存在 | 現行ジョブテーブル（正式採用） |
| report_jobs | ✅存在 | ⚠️役割整理要（deprecated候補） |
| report_regeneration_logs | ✅存在 | |
| ai_interview_sessions | ✅存在 | ai_interviews の移行先 |
| ai_interview_messages | ✅存在 | ai_interview_logs ではない |
| ai_interview_question_logs | ✅存在 | |
| org_group_invites | ✅存在 | code, used_count, max_uses, expires_at 含む |
| violations | ✅存在 | |
| site_admins | ✅存在 | |
| service_role_audit | ✅存在 | |
| ops_audit | ✅存在 | |
| monthly_reports_legacy | ✅存在 | レガシーバックアップ（参照専用） |
| cms_site_settings | ✅存在 | site_settings の代替 |
| qna_events | ✅存在 | qna_stats の代替データソース |

### B-4. 存在しないテーブル（確定）

| テーブル名 | コード参照箇所 | 対応方針 |
|-----------|---------------|----------|
| ai_interviews | src/app/api/interview/finalize/route.ts | → ai_interview_sessions に置換 |
| ai_interview_logs | src/lib/realtime/constants.ts | → ai_interview_messages（✅修正済み） |
| reports | src/app/api/public/reports/route.ts | → ai_monthly_reports に置換 |
| organization_groups | src/app/api/admin/org-groups/*.ts | 作成 or 機能削除 |
| qna_stats | src/app/api/*/qna-stats/*.ts | qna_events から集計 |
| user_violation_stats | src/app/api/enforcement/*.ts | 集計ビュー作成 |
| ai_citation_kpis_daily | supabase/functions/reports/index.ts | マテビュー設計 |
| ai_citation_integrity_daily | supabase/functions/reports/index.ts | マテビュー設計 |
| site_settings | src/app/api/ops/site-settings/route.ts | cms_site_settings で代替 |

### B-5. Realtime/RLS（確定）

**Realtime設定**:
- `realtime.messages` に private チャンネル前提の RLS ポリシー設定済み
- トピックパターン: `org:%`, `room:%`, `task:%`, `tenant:%`
- `realtime.broadcast_changes` 関数は使用可能
- コード側: `setAuth()` 対応済み（src/lib/realtime/constants.ts）

**RLS有効テーブル**:
- ai_monthly_reports: `is_org_member()` ベース
- monthly_report_jobs: `organization_id` ベース
- organization_members: `user_id = auth.uid()` ベース
- user_organizations (View): 基表の RLS に準拠

### B-6. 管理UI対象テーブル（確定・RLS要件）

以下のテーブルは新規作成された管理ダッシュボード（6ページ）で使用される。

**RLSポリシー確認日**: 2024-12-23（Supabaseアシスタント実行済み）

| ページパス | 対象テーブル | 必要カラム（抜粋） | RLS状態 |
|-----------|-------------|-------------------|---------|
| `/dashboard/admin/ai-usage` | organization_ai_usage | organization_id, interview_count, message_count, citation_count, token_count, updated_at | ✅ `org_ai_usage_admin_read` 追加済 |
| `/dashboard/admin/jobs` | translation_jobs | id, source_table, target_language, status, created_at, completed_at | ✅ `translation_jobs_admin_read` 追加済 |
| `/dashboard/admin/jobs` | embedding_jobs | id, organization_id, source_table, status, priority, created_at | ✅ `embedding_jobs_admin_read` 追加済 |
| `/dashboard/admin/audit` | service_role_audit | id, job_name, request_id, expected_row_count, affected_row_count, error_code, created_at | ⚠️ `is_admin()` ベース（統一検討） |
| `/dashboard/admin/audit` | ops_audit | id, action, actor_id, target_type, target_id, details, created_at | ⚠️ 認証ユーザー全員SELECT可（要確認） |
| `/dashboard/admin/security` | intrusion_detection_alerts | id, rule_id, source_ip, severity, description, detected_at, status | ⚠️ `is_admin()` ベース（統一検討） |
| `/dashboard/admin/security` | ip_reports | id, ip_address, reason, reporter_id, status, created_at | ⚠️ 要確認 |
| `/dashboard/admin/security` | ip_blocklist | id, ip_address, reason, blocked_at, expires_at, is_active | ⚠️ `is_admin()` ベース（統一検討） |
| `/dashboard/admin/storage-logs` | storage_access_logs | id, bucket_id, object_path, action, user_id, ip_address, status_code, created_at | ✅ `storage_access_logs_admin_read` 追加済 |
| `/dashboard/admin/ai-visibility` | ai_visibility_scores | id, organization_id, source_key, score, visibility_type, measured_at | ⚠️ 実質ALL許可（引き締め可能） |
| `/dashboard/admin/ai-visibility` | ai_visibility_config | id, organization_id, enabled, check_interval_hours, notification_threshold, updated_at | ✅ `ai_visibility_config_admin_read` 追加済 |
| `/dashboard/admin/ai-visibility` | ai_bot_logs | id, bot_name, user_agent, request_path, status_code, created_at | ⚠️ 要確認 |

**管理者アクセス方式**:
- `site_admins` テーブルに登録されたユーザーが管理者
- RLS ポリシーで `site_admins.user_id = auth.uid()` を検証
- または RLS 無効化（service_role 専用テーブル）

**RLSポリシー追加済み（2024-12-23）**:
- `translation_jobs_admin_read` - site_admins参照
- `embedding_jobs_admin_read` - site_admins参照
- `storage_access_logs_admin_read` - site_admins参照
- `org_ai_usage_admin_read` - site_admins参照（従来の所属組織制限に加えて横断閲覧を追加）
- `ai_visibility_config_admin_read` - site_admins参照

**残課題（RLS統一検討）**:
- `service_role_audit`, `intrusion_detection_alerts`, `ip_blocklist`: 現在 `is_admin()` ベース → `site_admins` に統一するか検討
- `ops_audit`: 認証ユーザー全員にSELECT可 → 社内限定UI以外に露出しない設計か再確認
- `ai_visibility_scores`: 実質ALL許可に近い条件 → UI要件に応じて引き締め可能

---

## C. 影響範囲と修正指示

### C-1. 型定義修正

| ファイル | 型名/変更内容 | 方向 |
|---------|-------------|------|
| `src/types/rpc.ts` | `AutoBlockIpResult` | 追加: `{ id: string }` (uuid返却対応) |
| `src/types/rpc.ts` | `IncrementOrgInterviewStatsArgs` | 追加: 関数作成後に型定義 |
| `src/lib/realtime/constants.ts` | `REALTIME_TABLES.AI_INTERVIEW_MESSAGES` | ✅修正済 (ai_interview_logs→ai_interview_messages) |
| `src/lib/realtime/constants.ts` | `REALTIME_TABLES.QNA_EVENTS` | ✅修正済 (qna_stats→qna_events) |

### C-2. 呼び出し先の変更

| 変更前 | 変更後 | 対象ファイル |
|--------|--------|-------------|
| ai_interviews | ai_interview_sessions | `src/app/api/interview/finalize/route.ts`, `supabase/functions/example-finalize/index.ts` |
| reports | ai_monthly_reports | `src/app/api/public/reports/route.ts` |
| site_settings | cms_site_settings | `src/app/api/ops/site-settings/route.ts` |

### C-3. 実装追加: increment_org_interview_stats

**ファイル**: DB（Supabase SQL Editor で作成）

```sql
-- increment_org_interview_stats 関数の推奨実装
CREATE OR REPLACE FUNCTION public.increment_org_interview_stats(
  p_org_id uuid,
  p_interview_count integer DEFAULT 1,
  p_message_count integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organization_ai_usage
  SET
    interview_count = COALESCE(interview_count, 0) + p_interview_count,
    message_count = COALESCE(message_count, 0) + p_message_count,
    updated_at = now()
  WHERE organization_id = p_org_id;

  -- 行が存在しない場合は挿入
  IF NOT FOUND THEN
    INSERT INTO organization_ai_usage (
      organization_id,
      interview_count,
      message_count,
      citation_count,
      token_count,
      updated_at
    )
    VALUES (
      p_org_id,
      p_interview_count,
      p_message_count,
      0,
      0,
      now()
    );
  END IF;
END;
$$;

-- 権限設定
GRANT EXECUTE ON FUNCTION public.increment_org_interview_stats TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_org_interview_stats FROM anon, authenticated;
```

### C-4. 重複関数の扱い: fn_build_monthly_kpis

**現状**: `public.fn_build_monthly_kpis` と `analytics.fn_build_monthly_kpis` が重複

**推奨方針**: `public` に統一

**移行手順**:
1. コード側で呼び出しが `public` スキーマを使用していることを確認
2. `analytics.fn_build_monthly_kpis` を削除

```sql
-- analytics スキーマの重複関数を削除
DROP FUNCTION IF EXISTS analytics.fn_build_monthly_kpis(uuid, date, date);
```

### C-5. auto_block_ip の戻り値方針

**現状**: DB は `uuid` を返却、コード側は `void` 想定の可能性

**推奨方針**: `uuid` を公式仕様として統一

**コード修正**:
```typescript
// src/types/rpc.ts に追加
export interface AutoBlockIpArgs {
  target_ip: string;
  block_reason: string;
  block_duration_minutes: number;
}

export interface AutoBlockIpResult {
  id: string; // uuid
}
```

### C-6. report_jobs vs monthly_report_jobs の役割整理

**推奨方針**:
- `monthly_report_jobs` を正式採用
- `report_jobs` は deprecated 化

**移行案**:
1. 新規コードは `monthly_report_jobs` のみ使用
2. `report_jobs` への書き込みを停止
3. 既存参照は維持（read-only）
4. 移行完了後に `report_jobs` を archive テーブルへ

### C-7. 管理UI 6ページのRLS要件

**管理者ロール定義**:
- `site_admins` テーブルに登録されたユーザー

**必要なポリシー（各テーブルに適用）**:

```sql
-- 管理UI対象テーブル用の共通ポリシーテンプレート

-- 1. organization_ai_usage
CREATE POLICY "admin_select_organization_ai_usage"
ON organization_ai_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 2. translation_jobs
CREATE POLICY "admin_select_translation_jobs"
ON translation_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 3. embedding_jobs
CREATE POLICY "admin_select_embedding_jobs"
ON embedding_jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 4. service_role_audit
CREATE POLICY "admin_select_service_role_audit"
ON service_role_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 5. ops_audit
CREATE POLICY "admin_select_ops_audit"
ON ops_audit
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 6. intrusion_detection_alerts
CREATE POLICY "admin_select_intrusion_detection_alerts"
ON intrusion_detection_alerts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 7. ip_reports
CREATE POLICY "admin_select_ip_reports"
ON ip_reports
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 8. ip_blocklist
CREATE POLICY "admin_select_ip_blocklist"
ON ip_blocklist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 9. storage_access_logs
CREATE POLICY "admin_select_storage_access_logs"
ON storage_access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 10. ai_visibility_scores
CREATE POLICY "admin_select_ai_visibility_scores"
ON ai_visibility_scores
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 11. ai_visibility_config
CREATE POLICY "admin_select_ai_visibility_config"
ON ai_visibility_config
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);

-- 12. ai_bot_logs
CREATE POLICY "admin_select_ai_bot_logs"
ON ai_bot_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM site_admins
    WHERE site_admins.user_id = auth.uid()
  )
);
```

**パフォーマンス用インデックス（推奨）**:

```sql
-- site_admins の高速検索用
CREATE INDEX IF NOT EXISTS idx_site_admins_user_id ON site_admins(user_id);

-- 管理UI での並び替え/フィルタ用
CREATE INDEX IF NOT EXISTS idx_org_ai_usage_updated_at ON organization_ai_usage(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_created_at ON translation_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_created_at ON embedding_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_role_audit_created_at ON service_role_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_audit_created_at ON ops_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intrusion_alerts_detected_at ON intrusion_detection_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_reports_created_at ON ip_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_blocklist_blocked_at ON ip_blocklist(blocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_logs_created_at ON storage_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_visibility_scores_measured_at ON ai_visibility_scores(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_bot_logs_created_at ON ai_bot_logs(created_at DESC);
```

---

## D. ToDo

### D-1. 即時対応（ブロッカー解消）

| # | タスク | 担当 | 優先度 |
|---|--------|------|--------|
| 1 | `increment_org_interview_stats` RPC関数をDBに作成（C-3のSQL使用） | DB | 🔴最高 |
| 2 | `ai_interviews` → `ai_interview_sessions` の参照修正（対象ファイル: finalize/route.ts, example-finalize/index.ts） | コード | 🔴最高 |
| 3 | `reports` → `ai_monthly_reports` の参照修正（対象ファイル: public/reports/route.ts） | コード | 🔴高 |
| 4 | `fn_build_monthly_kpis` の重複解消（C-4のSQL使用、analyticsを削除） | DB | 🔴高 |
| 5 | 管理UI対象テーブル12件のRLSポリシー作成（C-7のSQL使用） | DB | 🔴高 |
| 6 | 管理UI対象テーブルのインデックス作成（C-7のSQL使用） | DB | 🟡中 |

### D-2. 短期対応（仕様統一）

| # | タスク | 担当 | 優先度 |
|---|--------|------|--------|
| 1 | `auto_block_ip` 戻り値の仕様決定・ドキュメント化（uuid を公式とする） | 設計 | 🟡中 |
| 2 | `AutoBlockIpResult` 型を `src/types/rpc.ts` に追加 | コード | 🟡中 |
| 3 | `report_jobs` vs `monthly_report_jobs` の役割明確化・コード内コメント追加 | 設計/コード | 🟡中 |
| 4 | `site_settings` → `cms_site_settings` の置換確認 | コード | 🟢低 |
| 5 | `organization_groups` の要否判断（機能削除または作成） | 設計 | 🟡中 |

### D-3. 中期対応（新規実装）

| # | タスク | 担当 | 優先度 |
|---|--------|------|--------|
| 1 | `qna_stats` ビュー作成（`qna_events` ベース） | DB | 🟢低 |
| 2 | `user_violation_stats` 集計ビュー作成 | DB | 🟢低 |
| 3 | `ai_citation_kpis_daily` マテビュー設計・作成 | DB | 🟢低 |
| 4 | `ai_citation_integrity_daily` マテビュー設計・作成 | DB | 🟢低 |
| 5 | `organization_groups` テーブル作成（要否確定後） | DB | 🟡中 |
| 6 | 管理UIでのエクスポート/検索のパフォーマンス検証 | コード/DB | 🟢低 |
| 7 | 管理UIへのCSVエクスポート機能追加 | コード | 🟢低 |

---

## E. 付録

### E-1. 管理UI対象テーブル存在確認プロンプト（Supabase用）

```
以下のテーブルが存在し、管理UIからアクセス可能な状態であることを確認してください：

1. organization_ai_usage
2. translation_jobs
3. embedding_jobs
4. service_role_audit
5. ops_audit
6. intrusion_detection_alerts
7. ip_reports
8. ip_blocklist
9. storage_access_logs
10. ai_visibility_scores
11. ai_visibility_config
12. ai_bot_logs

各テーブルについて：
1. 存在するか（Y/N）
2. RLSが有効か（Y/N）
3. site_admins を参照する SELECT ポリシーがあるか（Y/N）

ない場合、本レポートのC-7セクションにあるSQLで作成してください。
```

### E-2. increment_org_interview_stats 作成確認プロンプト（Supabase用）

```
以下のRPC関数が存在するか確認してください：

public.increment_org_interview_stats(
  p_org_id uuid,
  p_interview_count integer,
  p_message_count integer
) returns void

存在しない場合、本レポートのC-3セクションにあるSQLで作成してください。
```

### E-3. fn_build_monthly_kpis 重複解消プロンプト（Supabase用）

```
以下の重複関数を確認し、analytics スキーマの方を削除してください：

- public.fn_build_monthly_kpis（残す）
- analytics.fn_build_monthly_kpis（削除する）

削除SQL:
DROP FUNCTION IF EXISTS analytics.fn_build_monthly_kpis(uuid, date, date);
```

---

**レポート終了**
