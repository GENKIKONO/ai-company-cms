# DB Inventory

**作成日**: 2024-12-28
**目的**: 統合確認用（機能追加ではない）

---

## 概要

DB Inventory は、Supabase Assistant が確定した DB オブジェクトに対して、
コード側に「参照点（query）」が存在することを確認するための管理ページです。

**重要**: このページは機能追加ではなく、統合確認用です。

---

## アクセス

- **URL**: `/admin/db-inventory`
- **権限**: `site_admin` のみ
- **非admin**: 403リダイレクト

---

## 表示内容

### DB オブジェクト

| 項目 | 説明 |
|------|------|
| Name | テーブル/ビュー名 |
| Status | OK / FORBIDDEN_OR_RLS / NO_DATA / ERROR |
| Latest | 最新レコードの created_at または updated_at |

### ステータス定義

| ステータス | 意味 |
|-----------|------|
| OK | 参照成功、データあり |
| FORBIDDEN_OR_RLS | RLS/権限不足で取得失敗（参照点は存在） |
| NO_DATA | テーブルは存在するがデータなし |
| ERROR | クエリエラー |

### Edge Functions

| 項目 | 説明 |
|------|------|
| Name | Edge Function 名 |
| Caller | 呼び出し元ファイル（静的確認結果） |

---

## 安全規則

### 大規模テーブル（count禁止）

以下のテーブルは `count(*)` 禁止、`limit 1` のみ：

- `audit_logs`（親＋月次パーティション）
- `rate_limit_logs`（親）
- `blocked_ips`

### RLS 失敗時の扱い

RLS/権限不足で取得失敗しても、「参照点は存在する」ため未接続扱いにしない。
ステータスは `FORBIDDEN_OR_RLS` として安全に表示。

### Edge Functions の扱い

- 実行しない
- 呼び出しコードの有無のみ静的確認
- 新規実行導線は作らない

---

## 対象オブジェクト一覧

### Views
- v_public_registry

### Tables
- public_organizations_tbl
- products
- tenants
- org_memberships
- projects
- tasks
- comments
- user_profiles
- monthly_report_sections
- service_role_audit
- intrusion_detection_rules
- ip_blocklist
- ai_queries, ai_answers, ai_feedback, ai_retrievals
- ai_sources, ai_sections, ai_chunks, ai_jsonld_versions
- ai_visibility_scores, ai_content_units
- file_metadata
- storage_access_logs
- organization_verifications

### Large/Partitioned Tables
- audit_logs
- rate_limit_logs
- blocked_ips

### Edge Functions
ai-public, ai-interview, admin-content, admin-actions,
admin-audit-view, admin-rescue, admin-tools,
content-api, publish-asset, publish_toggle, publish-disclosure, share-view,
image-process, signed-url,
check-and-consume-quota, unblock_maintenance,
reports, reports-api, reports-worker, reports-get-current,
reports-list, reports-regenerate, reports-jobs, reports-job-detail,
monthly-report-batch, monthly-reports, ai_monthly_report_upsert

---

## 関連ファイル

- `src/app/admin/db-inventory/page.tsx` - 実装
- `docs/core-architecture.md` - アーキテクチャ定義

---

**文書終了**
