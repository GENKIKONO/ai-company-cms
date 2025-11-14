# GitHub Actions CI Secrets Setup Guide

## 概要
AIOHub プラットフォームのGitHub Actions CI/CDパイプラインに必要な環境変数とシークレットの設定手順。

## 🎯 現在のCI戦略と必要なSecrets

### ⚠️ 重要: 現在のCI設定について

**現在の`.github/workflows/ci-minimal.yml`は最小限のテストのみ実行します:**
- ✅ TypeScript型チェック
- ✅ ESLintコードチェック  
- ✅ シンプルなunit test (DB接続不要)
- ❌ 統合テスト (意図的にスキップ)
- ❌ DB接続が必要なテスト

**そのため、現時点でGitHub Secretsの設定は不要です。**

### 🔧 将来的にフルCI化する場合の必要なシークレット

GitHubリポジトリの Settings > Secrets and variables > Actions で以下のシークレットを設定：

#### 🔐 DB統合テスト用シークレット（現在は不要）

```bash
# Supabase テスト環境（フル統合CI用 - 現在未使用）
TEST_SUPABASE_URL="https://your-test-project.supabase.co"
TEST_SUPABASE_SERVICE_ROLE_KEY="your_test_service_role_key"
TEST_SUPABASE_ANON_KEY="your_test_anon_key"  # 任意

# 本番環境（デプロイ用）
NEXT_PUBLIC_SUPABASE_URL="https://your-prod-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_prod_service_role_key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_prod_anon_key"
```

#### 🔐 セキュリティ関連シークレット

```bash
# JWT・CSRF セキュリティ
CSRF_SECRET="your_256bit_csrf_secret"
JWT_SECRET="your_256bit_jwt_secret" 
API_SIGNATURE_SECRET="your_api_signature_secret"

# 管理者認証
ADMIN_API_SECRET_KEY="your_admin_api_secret"
ENFORCEMENT_CRON_TOKEN="your_enforcement_cron_token"
```

#### 🔐 外部サービス（任意）

```bash
# メール送信（Resend）
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# モニタリング（Sentry）
NEXT_PUBLIC_SENTRY_DSN="https://your_sentry_dsn"

# 通知（Slack）
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"
```

#### 🔐 デプロイ関連

```bash
# Vercel デプロイ（必要に応じて）
VERCEL_TOKEN="your_vercel_deploy_token"
VERCEL_ORG_ID="your_vercel_org_id"  
VERCEL_PROJECT_ID="your_vercel_project_id"
```

## 設定手順

### Step 1: GitHub Repository Settings
1. リポジトリページで **Settings** タブをクリック
2. 左サイドバーで **Secrets and variables** > **Actions** を選択
3. **New repository secret** をクリック

### Step 2: Supabaseテスト環境の準備
```bash
# 1. Supabaseで新しいテストプロジェクト作成
# 2. 本番と同じスキーマを適用
supabase db push --project-ref your-test-project-ref

# 3. Enforcement関数の確認
# 本番と同じ unpublish_org_public_content_for_user 関数が必要
```

### Step 3: シークレット強度確認
```bash
# 強力なランダムキー生成
openssl rand -hex 32  # 256bit key
openssl rand -base64 32  # Base64 encoded key

# Node.jsでランダムキー生成  
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: 設定値の検証
各シークレットを設定後、以下で動作確認：

```yaml
# テストワークフロー例
name: Secrets Verification
on: workflow_dispatch

jobs:
  verify-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Check Supabase Connection
        run: |
          echo "Testing Supabase connection..."
          curl -H "Authorization: Bearer ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}" \
               -H "Content-Type: application/json" \
               "${{ secrets.TEST_SUPABASE_URL }}/rest/v1/profiles?select=count"
```

## CI Workflow調整

### 現在のワークフロー
`.github/workflows/ci-minimal.yml` が以下のシークレットを使用：

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_SITE_URL: 'https://test.aiohub.jp'
  NODE_ENV: 'test'
  LOG_LEVEL: 'warn'
```

### 推奨改善点

#### 1. Environment別の管理
```yaml
# production.yml
environment: production
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

# staging.yml  
environment: staging
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.STAGING_SUPABASE_SERVICE_ROLE_KEY }}
```

#### 2. セキュリティチェックの強化
```yaml
- name: Secrets Security Check
  run: |
    # シークレットの最低文字数チェック
    if [ ${#SUPABASE_SERVICE_ROLE_KEY} -lt 32 ]; then
      echo "❌ SUPABASE_SERVICE_ROLE_KEY too short"
      exit 1
    fi
    
    # 本番キーの混入チェック
    if [[ "$SUPABASE_SERVICE_ROLE_KEY" == eyJ* ]]; then
      echo "⚠️ Potential production key detected"
    fi
```

#### 3. 条件付き実行
```yaml
# enforcement関連ファイル変更時のみ実行
on:
  push:
    paths:
      - 'src/app/api/enforcement/**'
      - 'src/tests/enforcement-*'
      - 'supabase/migrations/*enforcement*'
```

## セキュリティベストプラクティス

### ✅ 推奨事項
1. **環境分離**: テスト環境と本番環境のキーを厳密に分離
2. **最小権限**: CIに必要最小限の権限のみ付与
3. **ローテーション**: 定期的なシークレットキーの更新
4. **監査ログ**: シークレット使用状況の監視

### ❌ 禁止事項
1. **本番キーのCI使用**: 本番のService Role Keyを直接CI環境で使用
2. **ログ出力**: シークレット値をログに出力
3. **プルリクエスト公開**: 外部コントリビューターからのPRでシークレット実行

### 🔍 定期監査
```bash
# 月次チェックリスト
- [ ] 未使用シークレットの削除
- [ ] シークレット有効期限の確認  
- [ ] アクセスログの確認
- [ ] 権限設定の見直し
```

## トラブルシューティング

### よくある問題

#### CI環境での認証エラー
```
Error: Invalid API key or insufficient permissions
```

**対処法**:
1. シークレット名のタイポ確認
2. Service Role Keyの有効性確認
3. Supabase プロジェクトの存在確認

#### テスト実行失敗
```
Error: NEXT_PUBLIC_SUPABASE_URL is required
```

**対処法**:
1. Required secretsが全て設定されているか確認
2. Environment名の一致確認
3. Workflow YMLの環境変数設定確認

#### ネットワークタイムアウト
```
Error: Request timeout after 30s
```

**対処法**:
1. Supabase接続性確認
2. API Rate Limit確認
3. GitHub Actions runner の地理的位置確認

### デバッグ手順
```yaml
# デバッグステップ追加
- name: Debug Environment
  run: |
    echo "Node version: $(node --version)"
    echo "Supabase URL: ${NEXT_PUBLIC_SUPABASE_URL:0:20}..."
    echo "Service Key length: ${#SUPABASE_SERVICE_ROLE_KEY}"
    
- name: Test Supabase Connection
  run: |
    npm install @supabase/supabase-js
    node -e "
      const { createClient } = require('@supabase/supabase-js');
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      client.from('profiles').select('count').then(r => console.log('✅ Connection OK')).catch(e => console.log('❌ Connection failed:', e.message));
    "
```

## 🚀 現在の実装状況と次のステップ

### ✅ 現在完了している項目
- [x] CI workflow作成（軽量版）
- [x] Core enforcement unit tests
- [x] TypeScript/ESLintチェック
- [x] セキュリティスキャン
- [x] ドキュメント整備

### ⚠️ 現在は設定不要
- [ ] GitHub Secrets設定（DBテストが不要なため）
- [ ] テスト用Supabaseプロジェクト作成
- [ ] 統合テストのCI実行

### 🎯 ユーザーがやるべきこと（現在）

1. **CIの動作確認**
   ```bash
   # ローカルで同様のチェックを実行
   npm run typecheck
   npm run lint
   npm run test src/tests/enforcement-auto-unpublish-simple.test.ts
   ```

2. **実DB検証** 
   ```bash
   # 手動でのDB動作確認
   node scripts/rls-verification-test.js
   ```

3. **CI設定完了確認**
   - GitHubリポジトリでActionsタブを確認
   - Enforcementファイル変更時にCIが実行されることを確認

### 🔧 将来的にフルCI化する場合のチェックリスト

#### Phase 1: テスト環境準備
- [ ] テスト用Supabaseプロジェクト作成  
- [ ] unpublish関数のテスト環境配置
- [ ] GitHub Secrets設定

#### Phase 2: CI拡張
- [ ] 統合テストのdescribe.skipを解除
- [ ] CI workflowでのDB接続テスト有効化
- [ ] より詳細なテストカバレッジ

#### Phase 3: 本番運用
- [ ] CI/CD パイプライン完全自動化
- [ ] デプロイメント自動化
- [ ] 継続的モニタリング

---
**作成日**: 2025-11-14  
**バージョン**: 1.0  
**対象ワークフロー**: `.github/workflows/ci-minimal.yml`  
**関連ドキュメント**: `docs/ENVIRONMENT_VARIABLES.md`