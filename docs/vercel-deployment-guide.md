# 🚀 Vercel Production Deployment Guide

**Phase 9: AIOHub → Vercel 本番デプロイ対応ガイド**  
**対象:** `今のコードをそのまま Vercel 本番に乗せても問題なく動く` ための設定要項

---

## 🎯 **CRITICAL CONFIGURATION**

### 1. Environment Variables (必須)

#### 🔥 **CRITICAL** - アプリ起動必須環境変数

```bash
# Vercel Dashboard Environment Variables に設定
NEXT_PUBLIC_APP_URL=https://aiohub.jp
NEXT_PUBLIC_SUPABASE_URL=https://chyicolujwhkycpkxbej.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[...実際のJWTキー...]
SUPABASE_SERVICE_ROLE_KEY=eyJ[...実際のService Roleキー...]
```

#### 🟡 **HIGH PRIORITY** - 主要機能必須

```bash
# Admin Access
ADMIN_EMAIL=admin@luxucare.jp
ADMIN_OPS_PASSWORD=[20文字以上のセキュアパスワード]
JWT_SECRET=[32文字以上のJWTシークレット]

# AI Services
OPENAI_API_KEY=sk-[実際のOpenAIキー]
OPENAI_MODEL=gpt-4o-mini

# Email Service
RESEND_API_KEY=re_[実際のResendキー]
RESEND_FROM_EMAIL=noreply@aiohub.jp

# Error Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://[実際のSentryDSN]

# Stripe Payment
STRIPE_SECRET_KEY=sk_live_[実際のStripeキー]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[実際の公開キー]
```

#### 🟢 **RECOMMENDED** - 補助機能・最適化用

```bash
# Feature Flags
ENABLE_MONITORING=true
ENABLE_AB_TESTING=false
SHOW_BUILD_BANNER=false

# Security
FORCE_HTTPS=true
DISABLE_APP_BASIC_AUTH=false

# Stripe Price IDs (9つのプラン)
STRIPE_NORMAL_BASIC_PRICE_ID=price_[基本プラン]
STRIPE_NORMAL_PRO_PRICE_ID=price_[Proプラン]  
STRIPE_NORMAL_BUSINESS_PRICE_ID=price_[Businessプラン]
STRIPE_EARLY_BASIC_PRICE_ID=price_[早期基本]
STRIPE_EARLY_PRO_PRICE_ID=price_[早期Pro]
STRIPE_EARLY_BUSINESS_PRICE_ID=price_[早期Business]
STRIPE_TEST_BASIC_PRICE_ID=price_[テスト基本]
STRIPE_TEST_PRO_PRICE_ID=price_[テストPro]
STRIPE_TEST_BUSINESS_PRICE_ID=price_[テストBusiness]
```

### 2. Vercel Project Settings

#### Build & Output Settings
```bash
Framework Preset: Next.js
Build Command: npm run build
Output Directory: (Default - Leave blank)
Install Command: npm install
Development Command: npm run dev
```

#### Node.js Version
```bash
Node.js Version: 18.x (推奨)
Package Manager: npm
```

#### Function Configuration (vercel.json)
```json
{
  "functions": {
    "src/app/api/admin/ai-visibility/run/route.ts": {
      "maxDuration": 30
    },
    "src/app/api/cron/daily/route.ts": {
      "maxDuration": 120
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control", 
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## ⚙️ **DEPLOYMENT CONFIGURATION**

### 3. Domain & DNS Setup

#### Custom Domain Configuration
```bash
Domain: aiohub.jp
www Redirect: www.aiohub.jp → aiohub.jp (推奨)
SSL Certificate: Automatic (Vercel managed)
```

#### DNS Records
```dns
# Vercel DNS Settings
A Record: aiohub.jp → 76.76.19.61 (Vercel IP)
CNAME: www.aiohub.jp → cname.vercel-dns.com
```

### 4. Cron Jobs (Vercel Dashboard管理)

**⚠️ IMPORTANT:** cron jobs は Vercel Dashboard で手動設定（vercel.json には含めない）

```bash
# Vercel Dashboard > Cron Jobs で設定
/api/cron/daily: 0 1 * * * (毎日 1:00 AM)
/api/cron/monthly-report: 0 2 1 * * (毎月 1日 2:00 AM)
```

### 5. Security Headers

#### Additional Headers (Optional)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 🔍 **VALIDATION STEPS**

### 6. Pre-Deployment Validation

#### ローカル環境での最終確認
```bash
# 1. 環境変数確認
npm run verify:env

# 2. Build確認 
npm run build

# 3. Pre-deployment check
npm run check:predeploy

# 4. Linting
npm run lint

# 5. TypeScript check
npm run typecheck
```

#### Production URL 設定確認
```bash
# .env.production.local (Vercel用)
NEXT_PUBLIC_APP_URL=https://aiohub.jp
SMOKE_BASE_URL=https://aiohub.jp
```

### 7. Post-Deployment Verification

#### 自動化チェック
```bash
# Remote health check
npm run health:production

# Production validation
npm run validate:production

# Remote smoke test
SMOKE_BASE_URL=https://aiohub.jp npm run smoke:test
```

#### Manual Check List
- [ ] https://aiohub.jp/ アクセス確認
- [ ] https://aiohub.jp/o/luxucare 表示確認
- [ ] https://aiohub.jp/api/health ヘルスチェック
- [ ] ログイン・新規登録動作確認
- [ ] ダッシュボード機能確認
- [ ] 管理コンソールアクセス確認

---

## ⚠️ **COMMON ISSUES & SOLUTIONS**

### 8. トラブルシューティング

#### Authentication Issues
```bash
# 症状: ログイン後リダイレクトループ
# 解決: NEXT_PUBLIC_APP_URL がhttps://aiohub.jpに正しく設定されているか確認

# 症状: Supabase connection error
# 解決: NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY の値確認
```

#### Build Issues  
```bash
# 症状: TypeScript build errors
# 解決: 本ディレクトリで `npm run typecheck` 実行してエラー修正

# 症状: Environment variable not found
# 解決: Vercel Dashboard > Environment Variables で設定確認
```

#### Runtime Issues
```bash
# 症状: API routes not working
# 解決: vercel.json の function configuration 確認

# 症状: Cron jobs not executing
# 解決: Vercel Dashboard > Cron Jobs で手動設定（vercel.json削除）
```

### 9. Performance Optimization

#### Image Optimization
```javascript
// next.config.js は既に設定済み
// Vercel は自動で Next.js Image optimization をサポート
```

#### Bundle Analysis
```bash
# Bundle size check
npm run build
npm run analyze # (該当する場合)
```

#### Edge Functions (Optional)
```bash
# 必要に応じて Edge Functions を利用
# 現在の構成ではNode.js Runtime で十分
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### 10. Final Deployment Steps

#### Pre-Deploy
- [ ] 全ての必須環境変数をVercel Dashboardに設定済み
- [ ] `npm run check:predeploy` 全て成功
- [ ] vercel.json 設定確認済み
- [ ] Custom domain 設定済み

#### Deploy
- [ ] GitHub連携でautomatic deployment 設定
- [ ] または `vercel --prod` コマンドでデプロイ実行
- [ ] Build log確認・エラーがないことを確認

#### Post-Deploy
- [ ] https://aiohub.jp アクセス確認
- [ ] `npm run health:production` 実行・成功確認
- [ ] Manual functional checklist 実行
- [ ] Vercel Dashboard で Cron jobs 手動設定

### 11. Rollback Plan

#### Emergency Rollback
```bash
# 前回のデプロイに戻す場合
vercel rollback [deployment-url]

# または Vercel Dashboard > Deployments > Previous deployment > Promote
```

---

## 📞 **SUPPORT CONTACTS**

**Vercel関連問い合わせ:**
- Vercel Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs

**AIOHub固有の問題:**
- 管理者: admin@luxucare.jp
- 技術担当: [技術チーム連絡先]

---

**✅ Deployment Approved by:** _______________  
**📅 Date:** _______________  
**🚀 Status:** [ ] Ready for Production [ ] Needs Review