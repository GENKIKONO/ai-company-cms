# 🚀 LuxuCare AI企業CMS 本番運用開始チェックリスト

## 📋 必須設定項目

### 1. ドメイン・インフラ設定
- [ ] **Vercelでのカスタムドメイン設定**
  - aiohub.jp → Vercelプロジェクトにドメイン追加
  - DNS設定（A/CNAMEレコード）の確認
  - SSL証明書の自動発行確認

### 2. Supabase本番データベース
- [ ] **基本マイグレーション適用**
  - `001_initial_schema.sql` ✅ (完了済み)
  - `002_rls_policies.sql` ✅ (完了済み)

- [ ] **Stripe連携テーブル追加**
  - `missing_tables.sql` の実行
  - subscriptions, stripe_customers, webhook_events テーブル作成

- [ ] **本番データ検証**
  - `production_verification.sql` の実行
  - テーブル・RLS・権限の確認

### 3. Stripe設定
- [ ] **Webhook エンドポイント設定**
  - Stripeダッシュボードで `https://aiohub.jp/api/stripe/webhook` を登録
  - 以下のイベント選択:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`

- [ ] **商品・価格設定**
  - Stripe商品の作成（初期費用・月額料金）
  - 価格IDの環境変数への設定

### 4. 環境変数の最終確認

#### Vercel環境変数設定:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mfumcxxzxuwbtjhhzqdy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[実際のキー]
SUPABASE_SERVICE_ROLE_KEY=[実際のキー]

# App Settings  
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://aiohub.jp

# Stripe
STRIPE_SECRET_KEY=[実際のキー]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[実際のキー]
STRIPE_WEBHOOK_SECRET=[実際のキー]
STRIPE_MONTHLY_PRICE_ID=[月額プランの価格ID]
STRIPE_SETUP_FEE_PRODUCT_ID=[初期費用商品のID]

# JWT
APPROVAL_JWT_SECRET=[32文字以上のランダム文字列]
```

## 🧪 本番テスト項目

### 基本機能テスト
- [ ] **ランディングページ**: https://aiohub.jp/
- [ ] **認証システム**: https://aiohub.jp/auth/login
- [ ] **企業ディレクトリ**: https://aiohub.jp/organizations
- [ ] **管理画面**: https://aiohub.jp/dashboard

### 認証・権限テスト
- [ ] **Admin ユーザー**: `admin@luxucare.com` / `AdminPass123!`
  - 全データの閲覧・編集・削除
  - ユーザー管理機能
  - 管理画面へのアクセス

- [ ] **Editor ユーザー**: `editor@luxucare.com` / `EditorPass123!`
  - 企業・サービス・事例データの閲覧・編集
  - 削除権限なし
  - 新規作成可能

- [ ] **Viewer ユーザー**: `viewer@luxucare.com` / `ViewerPass123!`
  - 公開データの閲覧のみ
  - 編集・作成権限なし

### Stripe決済テスト
- [ ] **チェックアウトフロー**
  - 決済画面への遷移
  - テストカード決済
  - 成功時のリダイレクト

- [ ] **初期費用付きサブスクリプション**
  - `/dashboard/billing/new-session` へのアクセス（admin のみ）
  - 初期費用ありプランの作成
  - 初期費用なしプランの作成
  - 初期費用情報の表示確認

- [ ] **Webhook動作確認**
  - `checkout.session.completed` イベント処理
  - 決済完了時の組織ステータス更新
  - サブスクリプション情報の保存
  - 初期費用情報の保存
  - 支払い失敗時の処理

### パフォーマンス・セキュリティ
- [ ] **ページ読み込み速度**
- [ ] **SSL証明書**
- [ ] **セキュリティヘッダー**
- [ ] **RLS動作確認**

## ⚠️ 現在確認が必要な項目

### 1. **ドメイン設定未完了**
```
❌ aiohub.jp が解決できない状態
→ ドメイン設定とDNS設定が必要
```

### 2. **Stripe決済テーブル**
```
⚠️ subscriptions, stripe_customers, webhook_events テーブルが未作成
→ missing_tables.sql の実行が必要
```

### 3. **Webhook URL設定**
```
⚠️ Stripeダッシュボードでのwebhook URL未設定
→ https://aiohub.jp/api/stripe/webhook の登録が必要
```

## 📝 完了後の確認手順

1. **基本動作確認**
   ```bash
   curl -I https://aiohub.jp/
   curl -I https://aiohub.jp/api/health
   ```

2. **認証テスト**
   - 各ロールでログイン・操作確認
   - RLS動作の確認

3. **決済フロー**
   - テスト決済の実行
   - Webhook受信の確認

4. **監視・ログ**
   - Vercelデプロイログ
   - Supabaseログ
   - Stripeイベントログ

## 🎯 運用開始判定基準

以下すべてが✅になったら本番運用開始可能:

- [ ] ドメイン疎通確認
- [ ] 全マイグレーション適用完了  
- [ ] 認証・権限動作確認
- [ ] Stripe決済フロー動作確認
- [ ] Webhook正常受信確認
- [ ] パフォーマンス基準クリア
- [ ] セキュリティチェック完了

---

**作成日**: 2025-09-21  
**対象システム**: LuxuCare AI企業CMS (aiohub.jp)  
**担当**: 開発チーム