# Dashboard統一アーキテクチャ改革レポート

**実施日**: 2024年12月24日
**対象**: DB/バックエンドチーム向け

> **用語注記（2024-12-25追記）**:
> - 本文書中の `user_organizations` は `organization_members` テーブルを指します
> - 現行アーキテクチャでは `organization_members` が正式名称です
> - 詳細は `docs/core-architecture.md` を参照

---

## 概要

Dashboardの全ページに `DashboardPageShell` コンポーネントを導入し、認証・認可・組織コンテキストの取得を統一しました。この変更により、フロントエンド側で一貫したアクセス制御が実現されます。

---

## 1. DashboardPageShellの役割

### 1.1 認証チェック
```tsx
// src/components/dashboard/DashboardPageShell.tsx
const { user, organization, isLoading, error, refetch } = useOrganization();

if (!user) {
  redirect('/auth/login');
}
```

**DB関連ポイント**:
- `useOrganization()` フックが `supabase.auth.getUser()` を呼び出す
- 認証失敗時は即座にログインページへリダイレクト
- RLSポリシーの `auth.uid()` と連携

### 1.2 組織コンテキスト取得
```tsx
// useOrganization内部
const { data: userOrg } = await supabase
  .from('user_organizations')
  .select('organization_id, role, organizations(*)')
  .eq('user_id', session.user.id)
  .single();
```

**DB関連ポイント**:
- `user_organizations` テーブルから組織情報を取得
- `role` フィールドでユーザーの権限レベルを判定
- RLSポリシーで `user_id` と `organization_id` の関係が検証される

### 1.3 権限チェック（requiredRole）
```tsx
<DashboardPageShell title="管理画面" requiredRole="admin">
  <AdminContent />
</DashboardPageShell>
```

**使用されるrole値**:
| requiredRole | 対象ページ | 説明 |
|--------------|-----------|------|
| `admin` | /dashboard/manage/*, billing/new-session | 管理者専用 |
| `editor` | services/edit, case-studies/new, posts/new | 編集権限が必要 |
| `viewer` | その他すべて | 閲覧のみ |

**DB関連ポイント**:
- `user_organizations.role` の値と照合
- 権限不足時はフロントエンドでエラー表示（APIは別途RLSで保護）

---

## 2. 変更されたページ一覧（DB関連）

### 2.1 Admin系ページ（requiredRole="admin"）

これらのページはすべて管理者権限が必要になりました：

| ページ | 参照テーブル |
|--------|-------------|
| `/dashboard/manage/ai-usage` | `ai_usage_logs`, `organizations` |
| `/dashboard/manage/ai-visibility` | `ai_visibility_scores`, `ai_visibility_configs`, `ai_bot_logs` |
| `/dashboard/manage/alerts` | `metrics_*` (MV), `security_incidents` |
| `/dashboard/manage/audit` | `service_role_audit_log`, `ops_audit` |
| `/dashboard/manage/billing-links` | `checkout_links` |
| `/dashboard/manage/contents` | `posts`, `services`, `faqs`, `case_studies` |
| `/dashboard/manage/jobs` | `translation_jobs`, `embedding_jobs` |
| `/dashboard/manage/org-groups` | `org_groups`, `org_group_members`, `org_group_join_requests` |
| `/dashboard/manage/security` | `intrusion_alerts`, `ip_reports`, `blocked_ips` |
| `/dashboard/manage/storage-logs` | `storage_access_logs` |

**RLSへの影響**:
- これらのテーブルへのアクセスは、フロントエンドで `requiredRole="admin"` チェック後に行われる
- ただし、**RLSポリシーでも同様のチェックを維持すること**（defense in depth）

### 2.2 一般ページ（requiredRole="viewer"）

| ページ | 参照テーブル | 操作 |
|--------|-------------|------|
| `/dashboard/interview/**` | `ai_interview_sessions`, `ai_interview_questions` | CRUD |
| `/dashboard/embed/**` | `organizations`, `services` | READ |
| `/dashboard/materials/[id]` | `sales_materials` | READ + DOWNLOAD |
| `/dashboard/ai-reports/**` | `ai_monthly_reports` | READ |
| `/dashboard/analytics/**` | `mv_ai_interview_org_daily_metrics` | READ |

---

## 3. 認証フローの変更

### 3.1 旧フロー
```
ページアクセス → 各ページで個別に認証チェック → データ取得
```
問題点：
- 認証チェックの実装がページごとにバラバラ
- 組織コンテキストの取得方法が不統一
- エラーハンドリングが一貫していない

### 3.2 新フロー
```
ページアクセス
    ↓
DashboardPageShell（統一レイヤー）
    ├─ 認証チェック（useOrganization）
    ├─ 組織コンテキスト取得
    ├─ 権限チェック（requiredRole）
    ├─ ローディング状態管理
    └─ エラーハンドリング
    ↓
子コンポーネント（organization_id を使用してデータ取得）
```

---

## 4. DB側で確認が必要な項目

### 4.1 RLSポリシーの整合性

DashboardPageShellで権限チェックを行っていますが、**RLSポリシーでも同等のチェックを維持**してください：

```sql
-- 例: admin系テーブルのRLSポリシー
CREATE POLICY "admin_only" ON admin_table
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'owner'  -- または 'admin'
  )
);
```

### 4.2 user_organizationsテーブルの重要性

このテーブルが認証の中心になります：

```sql
-- 確認クエリ
SELECT
  user_id,
  organization_id,
  role,
  created_at
FROM user_organizations
WHERE role IN ('owner', 'admin', 'editor', 'viewer');
```

**roleの階層**:
```
owner > admin > editor > viewer
```

フロントエンドでは以下のように判定：
- `requiredRole="admin"` → owner, admin のみ許可
- `requiredRole="editor"` → owner, admin, editor のみ許可
- `requiredRole="viewer"` → すべてのロールで許可

### 4.3 セッション管理

DashboardPageShellは `supabase.auth.getSession()` を使用します：

- セッション切れ時は自動的にログインページへリダイレクト
- リフレッシュトークンの有効期限管理が重要
- `auth.users` と `user_organizations` の整合性を維持すること

---

## 5. 特殊ケース

以下のページはDashboardPageShellを使用せず、独自の認証処理を持ちます：

### 5.1 `/dashboard/page.tsx`（メインダッシュボード）
- `DashboardMain` コンポーネントが複数組織対応やオンボーディングフローを持つ
- `useOrganization()` を内部で直接使用
- 複雑なUXフローのため特別扱い

### 5.2 `/dashboard/analytics/interview/page.tsx`
- サーバーコンポーネントとして実装
- サーバーサイドで `createClient()` を使用して認証
- Materialized View `mv_ai_interview_org_daily_metrics` を参照

---

## 6. 今後の拡張予定

### 6.1 機能フラグ統合（Phase 2）
```tsx
<DashboardPageShell
  title="AI分析"
  requiredRole="viewer"
  featureFlag="ai_analytics"  // 将来実装
>
```

→ `org_feature_flags` テーブルとの連携が必要になる可能性

### 6.2 監査ログ統合（Phase 3）
```tsx
// 重要操作時に自動的にログを記録
<DashboardPageShell auditAction="view_admin_page">
```

→ `ops_audit` テーブルへの自動挿入が検討対象

---

## 7. 確認依頼事項

1. **RLSポリシーの確認**
   - admin系テーブルに適切な権限チェックがあるか
   - `user_organizations.role` を使用した制限が実装されているか

2. **インデックスの確認**
   ```sql
   -- 頻繁に実行されるクエリ
   SELECT * FROM user_organizations
   WHERE user_id = $1;

   -- インデックスがあるか確認
   \d user_organizations
   ```

3. **セッション管理の確認**
   - リフレッシュトークンの有効期限設定
   - 不正セッションの検出ロジック

---

## 変更ファイル一覧（参考）

```
src/app/dashboard/manage/*.tsx (10ファイル)
src/app/dashboard/interview/*.tsx (4ファイル)
src/app/dashboard/embed/*.tsx (2ファイル)
src/app/dashboard/billing/new-session/*.tsx
src/app/dashboard/services/[id]/edit/page.tsx
src/app/dashboard/case-studies/new/page.tsx
src/app/dashboard/ai-reports/[period]/page.tsx
src/app/dashboard/analytics/ai-seo-report/page.tsx
src/app/dashboard/materials/[id]/page.tsx
```

---

**作成者**: Claude (AI Assistant)
**レビュー依頼先**: DB/バックエンドチーム
