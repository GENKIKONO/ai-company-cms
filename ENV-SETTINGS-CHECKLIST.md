# P0 環境変数・設定最終チェックリスト

## C-1) Vercel Production 環境変数

### **✅ P0で必須**
```bash
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **✅ 決済機能（本番キー必須）**
```bash
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_PUBLIC_KEY=pk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_1...
```

### **❌ P0では未使用（設定不要・空でOK）**
```bash
RESEND_API_KEY=（不要）
RESEND_FROM_EMAIL=（不要）
```

### **🟡 オプション（推奨）**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=https://aiohub.jp
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
```

## C-2) Vercel Preview 環境

**Preview環境も同じ値で統一：**
- `NEXT_PUBLIC_APP_URL=https://aiohub.jp`
- 他の本番環境変数と同値

**重要：** Preview環境で `localhost` が設定されていると、メール内リンクが混在する可能性があります。

## C-3) Supabase Dashboard 設定

### **Authentication → URL Configuration**
```
Site URL: https://aiohub.jp
Redirect URLs: https://aiohub.jp/*
Default redirect URL: https://aiohub.jp
```

### **Authentication → Email Templates**  
```
Template: Confirm signup
Subject: Confirm your signup
Body: {{ .ConfirmationURL }} ← そのまま（Supabase標準）

Custom SMTP Settings: OFF（重要）
```

### **Authentication → Providers**
```
Email: Enabled
Confirm email: Enabled  
Secure email change: Enabled
```

## C-4) 設定差異チェック

### **差異がある場合の修正候補値**

**Vercel で NEXT_PUBLIC_APP_URL が異なる場合：**
```
現在値: http://localhost:3000 または https://preview-domain.vercel.app
↓ 修正候補
修正値: https://aiohub.jp
```

**Supabase Site URL が異なる場合：**
```
現在値: http://localhost:3000
↓ 修正候補  
修正値: https://aiohub.jp
```

**Supabase SMTP が有効な場合：**
```
現在値: Custom SMTP = ON
↓ 修正候補
修正値: Custom SMTP = OFF（Supabase標準使用）
```

## C-5) 検証コマンド（参考）

```bash
# 本番エンドポイント疎通確認
curl -s -o /dev/null -w "%{http_code}" https://aiohub.jp/api/health

# P0外API削除確認（404期待）  
curl -s -o /dev/null -w "%{http_code}" https://aiohub.jp/api/ops/config-check
curl -s -o /dev/null -w "%{http_code}" https://aiohub.jp/api/admin/auth/status
```

---

**⚠️ 重要：上記設定が一致しない場合、localhost混入やメール配信失敗の原因となります。**