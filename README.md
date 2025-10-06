# ai-company-cms

## 本番とソースの乖離可視化

### ビルド情報バッジ
画面右上にビルド情報バッジが常時表示されます。これにより本番とソースコードの乖離を確認できます。
- バッジ内容: `commit:{コミットSHA} / deploy:{デプロイメントID}`
- ローカル環境では `commit:local / deploy:dev` と表示

### 診断API

#### /api/diag/ui
本番とソースの乖離状況を診断するAPIです。

**使用方法:**
```bash
# ローカル環境
npm run diag:ui

# 本番環境  
APP_URL=https://yourdomain.com npm run diag:ui

# 直接cURL
curl https://yourdomain.com/api/diag/ui
```

**レスポンス例:**
```json
{
  "commit": "abc123...",
  "deployId": "dpl_xyz...",
  "routes": {
    "root": "src/app/page.tsx",
    "dashboard": "src/app/dashboard/page.tsx"
  },
  "flags": {
    "hasAuthHeader": true,
    "hasSearchCard": false
  }
}
```

#### /api/diag
基本的なビルド情報とコミットSHAを返す軽量診断API。

## Posts API セキュリティ設計

### created_by フィールドの自動設定
postsテーブルの`created_by`フィールドは、アプリケーション側（API Route）で常に現在ログイン中のユーザーIDが自動設定されます。

**重要な注意事項:**
- データベースのDEFAULT値は設定されていません（NOT NULLのみ）
- 直接REST APIを`service_role`キーで叩く場合は、`created_by`を明示的に指定する必要があります
- アプリ経由（認証セッションあり）の場合は自動で設定されます

### API使用例

**アプリ経由（推奨）:**
```bash
# 認証済みセッションでアプリのAPIを使用
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "title": "Test Post",
    "content": "Content here",
    "status": "draft"
  }'
```

**直接REST（service_roleキー使用時）:**
```bash
# service_roleキーで直接Supabase REST APIを使用する場合
curl -X POST https://your-project.supabase.co/rest/v1/posts \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "org-uuid-here",
    "title": "Test Post",
    "content_markdown": "Content here",
    "status": "draft",
    "created_by": "user-uuid-here"
  }'
```

### RLS ポリシー
- INSERT: ユーザーが組織の所有者かつ`created_by`が自分のUUIDの場合のみ許可
- SELECT: 自分の組織の投稿は閲覧可能
- UPDATE/DELETE: 自分が作成した投稿のみ編集・削除可能

### Services/Case Studies/FAQs API セキュリティ設計

**統一セキュリティ仕様:**
すべてのコンテンツテーブル（posts, services, case_studies, faqs）で同一のセキュリティ設計を適用：

- `created_by` UUID NOT NULL カラム（application設定必須）
- RLS ポリシー：`insert_own_org_*` / `read_own_org_*` / UPDATE/DELETE制限
- organization_id と created_by の二重チェック

**API使用例:**

```bash
# Services API
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "name": "Test Service",
    "description": "Service description",
    "price": 10000,
    "duration_months": 12,
    "category": "consulting"
  }'

# Case Studies API  
curl -X POST http://localhost:3000/api/cases \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "title": "Success Story",
    "problem": "Problem description",
    "solution": "Solution implemented",
    "result": "Results achieved",
    "tags": ["ai", "automation"]
  }'

# FAQs API
curl -X POST http://localhost:3000/api/faqs \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "question": "How does it work?",
    "answer": "It works by...",
    "category": "general",
    "sort_order": 1
  }'
```

**マイグレーション適用:**
```sql
-- Supabaseダッシュボードで実行
\i supabase/migrations/20251006_add_created_by_to_posts.sql
\i supabase/migrations/20251006_add_created_by_to_services_cases_faqs.sql
```

## 開発者向け > 監査/検証

このプロジェクトには、RLS（Row Level Security）やAPIエンドポイントの動作を自動検証する仕組みが組み込まれています。

### 監査/検証の実行

```bash
# RLS/スキーマの静的監査
npm run audit:rls

# APIの動作スモークテスト
npm run smoke:api

# まとめて実行
npm run verify:all
```

### 期待される成功出力例

**audit:rls (RLS監査成功例):**
```json
{
  "ok": true,
  "tables": {
    "posts": {
      "hasColumns": true,
      "rls": true,
      "policies": ["insert_own_org_posts", "read_own_org_posts"],
      "foreignKeysOk": true
    },
    "services": {
      "hasColumns": true,
      "rls": true,
      "policies": ["insert_own_org_services", "read_own_org_services"],
      "foreignKeysOk": true
    }
  },
  "errors": []
}
```

**smoke:api (APIテスト成功例):**
```json
{
  "ok": true,
  "cases": [
    {
      "name": "anon-insert-posts",
      "expect": "deny",
      "got": 403,
      "pass": true
    },
    {
      "name": "service-insert-posts-own-org",
      "expect": "allow", 
      "got": 201,
      "pass": true
    }
  ]
}
```

### 失敗時の主な対処

#### RLS関連の問題
- **必須カラム不足**: マイグレーション適用を確認
  ```sql
  -- 必要に応じて実行
  ALTER TABLE posts ADD COLUMN created_by UUID NOT NULL REFERENCES auth.users(id);
  ```

- **RLS無効**: テーブルでRLSを有効化
  ```sql
  ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
  ```

- **ポリシー不足**: 必要なポリシーの作成を確認
  ```sql
  -- INSERT/SELECTポリシーが最低限必要
  CREATE POLICY "insert_own_org_posts" ON posts FOR INSERT WITH CHECK (...);
  CREATE POLICY "read_own_org_posts" ON posts FOR SELECT USING (...);
  ```

#### API関連の問題
- **認証エラー**: 環境変数の設定を確認
  ```bash
  # .env.local の確認
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

- **PostgREST スキーマキャッシュ**: 変更を反映
  ```sql
  SELECT pg_notify('pgrst', 'reload schema');
  ```

### CI/CD での利用

GitHub Actionsワークフロー (`.github/workflows/verify.yml`) が自動的に：

1. **Pull Request時**: RLS/API検証を実行
2. **メインブランチpush時**: 追加の安全性チェックを実行
3. **失敗時**: 詳細なログとアーティファクトを保存

#### 必要なGitHub Secrets:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  
SUPABASE_SERVICE_ROLE_KEY
```

### 開発者用API

開発環境でのクイック確認用:
```bash
curl http://localhost:3000/api/admin/rls-audit
```

### ログファイル

実行結果は `logs/` ディレクトリに保存されます:
- `rls-audit-YYYYMMDD-HHmmss.json` - RLS監査結果
- `smoke-YYYYMMDD-HHmmss.json` - APIテスト結果
- `verify-success/failure-YYYYMMDD-HHmmss.txt` - 統合結果レポート

### SQL手動検査

詳細な手動確認が必要な場合:
```sql
-- Supabaseダッシュボードで実行
\i supabase/sql/verify/rls_check.sql
```

このSQLスクリプトは読み取り専用で、以下を確認できます:
- RLS有効状態
- ポリシー一覧
- 必須カラム存在
- 外部キー制約
- テーブル統計情報