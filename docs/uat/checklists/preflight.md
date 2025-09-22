# 🚨 事前チェックリスト（必須）

> **⚠️ この段階で失敗があれば即座に修正が必要です**

## 📋 実行前準備

### 実行環境確認
- [ ] プロジェクトディレクトリに移動済み
- [ ] 正しいブランチ (main/production) をチェックアウト済み
- [ ] Node.js v18.x.x 以上がインストール済み
- [ ] `npm install` 実行済み
- [ ] 本番環境へのアクセス権限確認済み

### 必要なアクセス権限
- [ ] https://aiohub.jp 管理者アクセス
- [ ] Supabase Dashboard アクセス  
- [ ] Stripe Dashboard アクセス（テストモード）
- [ ] Resend Dashboard アクセス
- [ ] 実際に受信可能なメールアドレス準備済み

---

## 🔧 自動検証スクリプト実行

### 環境変数確認
```bash
# 実行コマンド
node scripts/uat/verify-env.mjs

# または手動確認
npm run uat:env-check
```

**確認項目**:
- [ ] ✅ NEXTAUTH_URL = https://aiohub.jp
- [ ] ✅ NEXTAUTH_SECRET (設定済み)
- [ ] ✅ STRIPE_SECRET_KEY (sk_live_... 本番キー)
- [ ] ✅ STRIPE_WEBHOOK_SECRET (whsec_... 本番)
- [ ] ✅ RESEND_API_KEY (re_... 本番認証済み)
- [ ] ✅ NEXT_PUBLIC_SUPABASE_URL (本番URL)
- [ ] ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (本番キー)

**🚨 失敗時の対応**:
```bash
# Vercel Dashboard > Settings > Environment Variables で確認・設定
echo "環境変数 XXX が未設定です。Vercel Dashboard で設定してください。"
```

### DNS・SSL確認
```bash
# 実行コマンド
node scripts/uat/verify-dns.mjs

# または手動確認
curl -I https://aiohub.jp
```

**確認項目**:
- [ ] ✅ DNS解決: aiohub.jp → Vercel IP正常
- [ ] ✅ SSL証明書: 有効期限内、エラーなし
- [ ] ✅ HTTP応答: 200 OK または適切な3xxリダイレクト
- [ ] ✅ セキュリティヘッダー: X-Frame-Options, CSP等設定済み

**🚨 失敗時の対応**:
```bash
# DNS問題
nslookup aiohub.jp
dig aiohub.jp

# SSL問題  
openssl s_client -connect aiohub.jp:443 -servername aiohub.jp
```

### API疎通確認
```bash
# 実行コマンド
node scripts/uat/verify-endpoints.mjs

# または手動確認
curl -s -o /dev/null -w "%{http_code}" https://aiohub.jp/api/health
```

**確認項目**:
- [ ] ✅ `/` (トップページ): 200
- [ ] ✅ `/auth/login` (ログインページ): 200
- [ ] ✅ `/organizations` (企業一覧): 200
- [ ] ✅ `/search` (検索ページ): 200
- [ ] ✅ `/api/stripe/webhook` (Stripe Webhook): 200/405
- [ ] ✅ `/api/auth/callback/email` (認証コールバック): 適切応答

**🚨 失敗時の対応**:
```bash
# 404エラーの場合
echo "ルーティング設定またはデプロイ状況を確認してください"

# 500エラーの場合  
echo "Vercel Function Logs でエラー詳細を確認してください"
```

---

## 🗄️ データベース確認

### Supabase RLS確認
```sql
-- Supabase SQLエディタで実行
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 
    'organizations', 
    'services', 
    'faqs', 
    'case_studies',
    'organization_members'
  )
ORDER BY tablename;
```

**確認項目**:
- [ ] ✅ users: RLS有効
- [ ] ✅ organizations: RLS有効
- [ ] ✅ services: RLS有効
- [ ] ✅ faqs: RLS有効
- [ ] ✅ case_studies: RLS有効
- [ ] ✅ organization_members: RLS有効

**期待結果**: 全テーブルで `rls_enabled = true`

### 認証設定確認
```bash
# Supabase Dashboard > Authentication > Settings で確認
```

**確認項目**:
- [ ] ✅ メール認証: 有効
- [ ] ✅ 確認メールテンプレート: 適切設定
- [ ] ✅ リダイレクトURL: https://aiohub.jp/auth/confirm 設定済み
- [ ] ✅ JWT有効期限: 適切設定（24時間等）
- [ ] ✅ パスワードポリシー: 適切設定

### CORS設定確認
```bash
# Supabase Dashboard > Settings > API で確認
```

**確認項目**:
- [ ] ✅ 許可ドメイン: https://aiohub.jp のみ
- [ ] ✅ ワイルドカード: 本番環境では使用禁止
- [ ] ✅ API キー: 本番用キーが設定済み

---

## 💳 外部サービス確認

### Stripe設定確認
```bash
# Stripe Dashboard で確認
```

**確認項目**:
- [ ] ✅ 本番モード: Live mode有効
- [ ] ✅ Webhook エンドポイント: https://aiohub.jp/api/stripe/webhook 設定済み
- [ ] ✅ Webhook イベント: 必要なイベント購読済み
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] ✅ 商品・価格: 本番用プラン設定済み
- [ ] ✅ テストモード切り替え: 可能（UAT用）

### Resend設定確認
```bash
# Resend Dashboard で確認
```

**確認項目**:
- [ ] ✅ ドメイン認証: aiohub.jp または noreply@aiohub.jp 認証済み
- [ ] ✅ DNS設定: SPF, DKIM, DMARC 適切設定
- [ ] ✅ 送信レート制限: 適切設定
- [ ] ✅ API キー: 本番用キー有効

### Vercel設定確認
```bash
# Vercel Dashboard で確認
```

**確認項目**:
- [ ] ✅ カスタムドメイン: aiohub.jp 設定済み
- [ ] ✅ SSL証明書: 自動更新有効
- [ ] ✅ 環境変数: Production環境に設定済み
- [ ] ✅ 関数タイムアウト: 適切設定
- [ ] ✅ 地域設定: 適切なリージョン（日本等）

---

## 📊 ネットワーク・パフォーマンス確認

### 基本パフォーマンス
```bash
# レスポンス時間確認
time curl -s https://aiohub.jp > /dev/null

# TTFBチェック
curl -w "@curl-format.txt" -o /dev/null -s https://aiohub.jp
```

**確認項目**:
- [ ] ✅ DNS解決時間: < 100ms
- [ ] ✅ 接続時間: < 200ms  
- [ ] ✅ TTFB: < 800ms
- [ ] ✅ 総時間: < 2秒

### CDN・キャッシュ確認
```bash
# キャッシュヘッダー確認
curl -I https://aiohub.jp/favicon.ico
curl -I https://aiohub.jp/_next/static/
```

**確認項目**:
- [ ] ✅ 静的ファイル: 適切なCache-Control設定
- [ ] ✅ 圧縮: gzip/brotli有効
- [ ] ✅ CDN: Vercel Edge Network 使用

---

## 🔐 セキュリティ基本確認

### HTTPSセキュリティ
```bash
# セキュリティヘッダー確認
curl -I https://aiohub.jp | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
```

**確認項目**:
- [ ] ✅ HSTS: 有効
- [ ] ✅ X-Frame-Options: DENY または SAMEORIGIN
- [ ] ✅ X-Content-Type-Options: nosniff
- [ ] ✅ Referrer-Policy: 適切設定
- [ ] ✅ CSP: 基本的なポリシー設定

### API認証確認
```bash
# 認証なしでAPI叩いてみる
curl -s https://aiohub.jp/api/organizations | jq
# 期待: 401 Unauthorized
```

**確認項目**:
- [ ] ✅ 未認証API: 適切に401エラー
- [ ] ✅ CORS: 許可ドメインのみアクセス可能
- [ ] ✅ レート制限: 適切設定

---

## ✅ 事前チェック完了判定

### 必須項目チェック
- [ ] 🔧 環境変数: 全て設定済み
- [ ] 🌐 DNS/SSL: 正常応答確認済み  
- [ ] 🔌 API疎通: 全エンドポイント応答確認済み
- [ ] 🗄️ RLS: 全テーブル有効化確認済み
- [ ] 💳 外部サービス: Stripe/Resend設定確認済み
- [ ] 🔐 セキュリティ: 基本設定確認済み

### 判定基準
```bash
if [ 全ての項目がチェック済み ]; then
  echo "✅ 事前チェック完了 - クリティカルテスト進行可能"
  exit 0
else
  echo "❌ 事前チェック失敗 - 問題修正後再実行"
  exit 1
fi
```

---

## 🆘 トラブルシューティング

### よくある問題と対処法

#### 環境変数未設定
```bash
❌ Error: NEXTAUTH_URL is not defined
✅ 対処: Vercel Dashboard > Settings > Environment Variables で設定
```

#### DNS解決失敗
```bash
❌ Error: getaddrinfo ENOTFOUND aiohub.jp
✅ 対処: ネットワーク接続・DNS設定確認
```

#### API疎通失敗
```bash
❌ Error: 404 Not Found /api/stripe/webhook
✅ 対処: デプロイ状況・ルーティング確認
```

#### RLS無効
```bash
❌ RLS disabled on organizations table
✅ 対処: ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
```

#### Webhook設定ミス
```bash
❌ Stripe webhook endpoint not found
✅ 対処: Stripe Dashboard でエンドポイント再設定
```

### エスカレーション連絡先
```markdown
🔴 緊急（インフラ停止級）: [技術責任者]
🟡 重要（設定問題）: [開発チーム]
🟢 一般（確認事項）: [QA担当]
```

---

**🎯 全事前チェックが完了したら、次のステップ『クリティカルテスト』に進んでください。**