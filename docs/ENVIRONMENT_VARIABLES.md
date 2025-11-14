# Environment Variables Documentation

## 概要

AI Hub プラットフォームで使用される環境変数の一覧と設定方法。本番環境運用時に必要な環境変数を分類し、適切な設定を確保する。

## 必須環境変数（Production Ready）

### Supabase 関連
```bash
# Supabase 基本設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cookie設定
SUPABASE_COOKIE_DOMAIN=.yourdomain.com  # 本番ドメインに合わせて設定
```

### アプリケーション基本設定
```bash
# アプリケーションURL（Enforcement APIなどで使用）
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# 環境設定
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### セキュリティ関連
```bash
# CSRF保護
CSRF_SECRET=your_very_secure_random_string_here

# JWT認証
JWT_SECRET=your_jwt_secret_key_here

# API署名（AI Visibility等で使用）
API_SIGNATURE_SECRET=your_api_signature_secret
AI_VISIBILITY_SECRET=your_ai_visibility_secret

# Cookie設定
COOKIE_DOMAIN=.yourdomain.com
NEXT_PUBLIC_COOKIE_DOMAIN=.yourdomain.com
```

### 管理者認証関連（Enforcement System）
```bash
# 管理者アクセス制御
ADMIN_ALLOWED_IPS=192.168.1.100,10.0.0.50  # カンマ区切りで許可IP
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_EMAILS=admin1@yourdomain.com,admin2@yourdomain.com
ADMIN_API_SECRET_KEY=your_admin_api_secret

# Enforcement System
ENFORCEMENT_CRON_TOKEN=your_enforcement_cron_token
```

### メール送信（Resend）
```bash
# Resend API設定（通知メール用）
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_WEBHOOK_SECRET=whsec_your_resend_webhook_secret
```

### ログ・モニタリング
```bash
# ログレベル設定
LOG_LEVEL=info  # debug, info, warn, error

# モニタリング有効化
ENABLE_MONITORING=true

# Sentry（エラー監視）
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn_here

# Plausible（アナリティクス）
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com
```

## 任意環境変数（機能拡張）

### 通知・連携
```bash
# Slack通知（管理者アラート用）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_DEFAULT_CHANNEL=#alerts

# 管理者監査ログ
ENABLE_ADMIN_AUDIT_DB=true
```

### キャッシュ・パフォーマンス
```bash
# Redis（セッション管理・キャッシュ）
REDIS_URL=redis://your_redis_instance_url

# リバリデーション
REVALIDATE_TOKEN=your_revalidation_token

# Cron処理
CRON_SECRET=your_cron_secret_token
```

### 支払い関連（Payment機能除外のため設定不要）
```bash
# ⚠️ Payment機能は本プロジェクトでは除外されているため設定不要
# STRIPE_* 関連の環境変数は設定しなくても動作する
```

### AI Visibility 機能
```bash
# AI Bot detection & logging
AI_VISIBILITY_SIGNING_ENABLED=true
```

## 環境別設定例

### 開発環境 (.env.local)
```bash
# Supabase（開発用プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key

# 開発環境設定
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development
LOG_LEVEL=debug

# セキュリティ（開発用）
CSRF_SECRET=dev_csrf_secret
JWT_SECRET=dev_jwt_secret

# 管理者設定（開発用）
ADMIN_EMAIL=admin@localhost
ADMIN_ALLOWED_IPS=127.0.0.1,::1
```

### 本番環境（Vercel推奨）
```bash
# Supabase（本番用プロジェクト）
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# 本番環境設定
NEXT_PUBLIC_SITE_URL=https://aiohub.jp
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NODE_ENV=production
LOG_LEVEL=info

# セキュリティ（本番用強固なキー）
CSRF_SECRET=your_very_secure_random_256_bit_key
JWT_SECRET=your_very_secure_jwt_key

# 管理者設定（本番用IP制限）
ADMIN_EMAIL=admin@aiohub.jp
ADMIN_ALLOWED_IPS=your.office.ip.address

# メール送信（本番用Resend）
RESEND_API_KEY=re_your_production_api_key
RESEND_FROM_EMAIL=noreply@aiohub.jp

# モニタリング（本番用）
ENABLE_MONITORING=true
NEXT_PUBLIC_SENTRY_DSN=https://your_production_sentry_dsn
```

## セキュリティガイドライン

### 🔒 強固なシークレット生成
```bash
# Node.js で安全なランダム文字列を生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL で安全なランダム文字列を生成
openssl rand -hex 32
```

### 🔒 IP制限の設定
```bash
# ADMIN_ALLOWED_IPS は必ず本番環境で設定
# カンマ区切りで複数IP許可可能
ADMIN_ALLOWED_IPS=203.0.113.100,203.0.113.101,198.51.100.50
```

### 🔒 JWT/CSRF SECRET
```bash
# 最低256bit（32文字）以上の文字列を使用
# 英数字+記号を含む強固なキーを設定
CSRF_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_SECRET=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6
```

## 環境変数チェックリスト

### 本番環境デプロイ前確認

#### ✅ 必須項目
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - 本番Supabaseプロジェクト
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 本番anonキー  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - 本番サービスロールキー
- [ ] `NEXT_PUBLIC_SITE_URL` - 本番ドメインURL
- [ ] `CSRF_SECRET` - 256bit以上のランダム文字列
- [ ] `JWT_SECRET` - 256bit以上のランダム文字列

#### ✅ セキュリティ項目
- [ ] `ADMIN_ALLOWED_IPS` - 管理者アクセス許可IP設定
- [ ] `ADMIN_EMAIL` - 管理者メールアドレス
- [ ] `API_SIGNATURE_SECRET` - API署名用シークレット
- [ ] 全シークレットキーが開発環境と異なることを確認

#### ✅ 機能項目
- [ ] `RESEND_API_KEY` - メール送信機能
- [ ] `LOG_LEVEL=info` - 本番ログレベル
- [ ] `ENABLE_MONITORING=true` - モニタリング有効化

#### ✅ Enforcement System
- [ ] `ENFORCEMENT_CRON_TOKEN` - 自動デッドライン処理用
- [ ] `ADMIN_API_SECRET_KEY` - 管理者API認証用

## トラブルシューティング

### よくある問題

#### 問題: Enforcement APIで権限エラー
```bash
# 確認項目
echo $SUPABASE_SERVICE_ROLE_KEY  # サービスロールキーの確認
echo $ADMIN_EMAIL               # 管理者メールの確認
echo $ADMIN_ALLOWED_IPS         # 許可IPの確認
```

#### 問題: Cookie/認証エラー
```bash
# 確認項目  
echo $COOKIE_DOMAIN              # Cookieドメインの確認
echo $SUPABASE_COOKIE_DOMAIN     # Supabase Cookieドメインの確認
echo $CSRF_SECRET                # CSRFシークレットの確認
```

#### 問題: メール送信エラー
```bash
# 確認項目
echo $RESEND_API_KEY            # Resend APIキーの確認
echo $RESEND_FROM_EMAIL         # 送信元メールアドレスの確認
```

## 関連ファイル

- **設定例**: `.env.example` (リポジトリルート)
- **Next.js設定**: `next.config.js`
- **ミドルウェア**: `src/middleware.ts`
- **Supabase設定**: `src/lib/supabase-server.ts`

---

**作成日**: 2025-11-14  
**バージョン**: 1.0  
**最終更新**: 2025-11-14  
**対象**: Production Ready Deployment (Payment機能除外)