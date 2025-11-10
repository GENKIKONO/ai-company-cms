# ai-company-cms

## 🚀 本番デプロイメント

### 必須環境変数（最小6項目）

本番デプロイには以下の6つの環境変数が必須です：

1. **SUPABASE_URL** - Supabase プロジェクト URL
   - 取得場所: Supabase Dashboard > Settings > General > Project URL
   - 例: `https://your-project.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY** - Supabase サービスロールキー
   - 取得場所: Supabase Dashboard > Settings > API > service_role (secret)
   - 用途: サーバーサイドでのRLSバイパス

3. **SUPABASE_ANON_KEY** - Supabase 匿名キー
   - 取得場所: Supabase Dashboard > Settings > API > anon (public)
   - 用途: クライアントサイドでの認証

4. **NEXT_PUBLIC_SUPABASE_URL** - パブリック Supabase URL
   - 値: SUPABASE_URL と同じ値
   - 用途: クライアントサイドでのSupabase接続

5. **NEXT_PUBLIC_APP_URL** - アプリケーション URL
   - 例: `https://aiohub.jp`
   - 用途: API呼び出しとリダイレクト

6. **NEXT_PUBLIC_SITE_URL** - サイト URL
   - 値: NEXT_PUBLIC_APP_URL と同じ値
   - 用途: 内部API呼び出し

### Vercel 環境変数設定手順

1. Vercel Dashboard にログイン
2. プロジェクト選択
3. Settings > Environment Variables
4. **Production** 環境を選択
5. 上記6項目を設定

### デプロイメント運用ルール

- **main ブランチへの push = Production デプロイ**
  - GitHub Actions が自動的に本番環境にデプロイ
  - CI/CD パイプラインで品質チェック実行
  - デプロイ後に自動ヘルスチェック

- **develop ブランチへの push = Staging デプロイ**
  - プレビュー環境での検証

- **手動デプロイ（緊急時のみ）**:
  ```bash
  npm run deploy:production
  ```

### 🔍 デプロイ前検証

```bash
# 環境変数チェック
node scripts/verify-env.mjs

# 本番検証（デプロイ後）
npm run validate:production
```

## 🧩 本番確認手順

AIO Hub を本番環境に安全にデプロイするための確認手順：

### 1. 環境変数設定

**本番環境（Vercel Dashboard > Settings > Environment Variables）:**

```bash
# Basic認証設定（管理画面保護）
DASHBOARD_BASIC_USER=admin
DASHBOARD_BASIC_PASS=your_secure_password

# Basic認証制御（インフラ側認証使用時にtrue）
DISABLE_APP_BASIC_AUTH=false
```

### 2. デプロイ前検証

```bash
# 1. ローカルで本番ビルドテスト
npm run build && npm run start

# 2. デプロイ前設定確認
node scripts/verify-production-readiness.js

# ✅ 全項目クリアでデプロイ実行
```

### 3. デプロイ実行

```bash
# main ブランチへ push（自動デプロイ）
git push origin main

# または手動デプロイ
npm run deploy:production
```

### 4. デプロイ後確認

```bash
# 本番環境動作確認（URL自動検出）
node scripts/check-live-status.js

# または特定URL指定
node scripts/check-live-status.js https://your-domain.com
```

### 5. 確認項目

**公開ページ（Basic認証なし）:**
- ✅ `/` → トップページ正常表示
- ✅ `/pricing` → 料金 ¥2,980/¥8,000/¥15,000 表示
- ✅ `/hearing-service` → 青背景CTA・レイアウト保持

**管理ページ（Basic認証あり）:**
- 🔒 `/dashboard` → ブラウザ認証ダイアログ表示
- 🔒 `/admin` → Basic認証必須
- 🔒 `/api/admin/*` → 401 Unauthorized

### 6. トラブルシューティング

**緊急時のBasic認証無効化:**
```bash
# Vercel Dashboard で即座に無効化
DISABLE_APP_BASIC_AUTH=true
```

**スクリプト出力例:**
```
🔍 環境変数読み込み
✅ [SUCCESS] Basic認証設定確認済み (ユーザー: admin)

🔍 必須ページファイル確認
✅ [SUCCESS] トップページ: src/app/page.tsx
✅ [SUCCESS] 料金ページ: src/app/pricing/page.tsx
✅ [SUCCESS] hearing-serviceページ: src/app/hearing-service/page.tsx

✅ Production ready - 本番環境正常動作確認完了
```

## 運用

### AI可視性監視
- **管理画面**: [/admin/ai-visibility](https://aiohub.jp/admin/ai-visibility)
- **手動実行API**: `POST /api/admin/ai-visibility/run` (認証必要)

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