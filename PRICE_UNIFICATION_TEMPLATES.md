# 価格統一ファイルテンプレート

## 1. 基盤: unified-plans.ts

```typescript
// src/config/unified-plans.ts
import { PLAN_PRICES, PLAN_NAMES, PLAN_LIMITS, PLAN_FEATURES } from './plans';

export const UNIFIED_PLAN_CONFIG = {
  trial: {
    id: 'trial',
    name: PLAN_NAMES.trial,
    price: PLAN_PRICES.trial,           // 0
    displayPrice: '無料',
    stripePrice: null,
    limits: PLAN_LIMITS.trial,
    features: PLAN_FEATURES.trial
  },
  starter: {
    id: 'starter', 
    name: PLAN_NAMES.starter,
    price: PLAN_PRICES.starter,         // 2980 ✅
    displayPrice: '¥2,980（税込）',
    stripePrice: PLAN_PRICES.starter * 100, // 298000セント
    limits: PLAN_LIMITS.starter,
    features: PLAN_FEATURES.starter
  },
  pro: {
    id: 'pro',
    name: PLAN_NAMES.pro,
    price: PLAN_PRICES.pro,             // 8000
    displayPrice: '¥8,000（税込）',
    stripePrice: PLAN_PRICES.pro * 100,
    limits: PLAN_LIMITS.pro,
    features: PLAN_FEATURES.pro
  },
  business: {
    id: 'business',
    name: PLAN_NAMES.business,
    price: PLAN_PRICES.business,        // 15000
    displayPrice: '¥15,000（税込）',
    stripePrice: PLAN_PRICES.business * 100,
    limits: PLAN_LIMITS.business,
    features: PLAN_FEATURES.business
  },
  enterprise: {
    id: 'enterprise',
    name: PLAN_NAMES.enterprise,
    price: PLAN_PRICES.enterprise,      // 30000
    displayPrice: '¥30,000〜（税込）',
    stripePrice: PLAN_PRICES.enterprise * 100,
    limits: PLAN_LIMITS.enterprise,
    features: PLAN_FEATURES.enterprise,
    isCustom: true
  }
} as const;

export type UnifiedPlanType = keyof typeof UNIFIED_PLAN_CONFIG;

// JSON-LD生成関数
export function generatePricingJsonLD() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AIO Hub",
    "provider": {
      "@type": "Organization",
      "name": "LuxuCare株式会社"
    },
    "offers": Object.entries(UNIFIED_PLAN_CONFIG)
      .filter(([planType]) => planType !== 'trial')
      .map(([planType, config]) => ({
        "@type": "Offer",
        "name": config.name,
        "price": config.price.toString(),
        "priceCurrency": "JPY",
        "billingPeriod": "P1M", // 月額
        "description": config.features.slice(0, 3).join(', ')
      }))
  };
}

// 価格フォーマッター
export function formatPlanPrice(planType: UnifiedPlanType): string {
  const config = UNIFIED_PLAN_CONFIG[planType];
  return config.displayPrice;
}

// Stripe価格取得
export function getStripePriceAmount(planType: UnifiedPlanType): number | null {
  const config = UNIFIED_PLAN_CONFIG[planType];
  return config.stripePrice;
}
```

## 2. Stripe安全化: stripe-safe.ts

```typescript
// src/lib/stripe-safe.ts
import { stripe } from './stripe';
import { UNIFIED_PLAN_CONFIG, type UnifiedPlanType } from '@/config/unified-plans';
import { logger } from '@/lib/utils/logger';

const SAFE_MODE = process.env.STRIPE_SAFE_MODE === 'true' || process.env.NODE_ENV === 'development';

// 安全なStripe商品作成
export const createAIOHubProductsSafe = async () => {
  if (SAFE_MODE) {
    logger.warn('Stripe Safe Mode: API呼び出しをブロック', {
      mode: process.env.NODE_ENV,
      safeMode: process.env.STRIPE_SAFE_MODE
    });
    return createMockStripeProducts();
  }

  logger.info('Stripe商品作成開始（本番モード）');
  return await createRealStripeProducts();
};

// モック商品作成
function createMockStripeProducts() {
  return Object.entries(UNIFIED_PLAN_CONFIG)
    .filter(([planType]) => planType !== 'trial')
    .map(([planType, config]) => ({
      product: {
        id: `mock_prod_${planType}`,
        name: config.name,
        description: config.features.join(', '),
        metadata: { planType }
      },
      price: {
        id: `mock_price_${planType}`,
        unit_amount: config.stripePrice,
        currency: 'jpy',
        recurring: { interval: 'month' }
      },
      planType: planType as UnifiedPlanType
    }));
}

// 実際のStripe商品作成
async function createRealStripeProducts() {
  const products = [];
  
  for (const [planType, config] of Object.entries(UNIFIED_PLAN_CONFIG)) {
    if (planType === 'trial') continue;
    
    const product = await stripe.products.create({
      name: config.name,
      description: config.features.join(', '),
      metadata: { planType }
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: config.stripePrice!, // 統一設定から取得
      currency: 'jpy',
      recurring: { interval: 'month' }
    });
    
    products.push({ product, price, planType: planType as UnifiedPlanType });
    
    logger.info(`Stripe商品作成完了: ${planType}`, {
      productId: product.id,
      priceId: price.id,
      amount: config.stripePrice
    });
  }
  
  return products;
}

// 環境変数チェック
export function validateStripeEnvironment(): boolean {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Stripe環境変数が不足', { missing });
    return false;
  }
  
  return true;
}
```

## 3. ページ更新: aio/page.tsx差分

```typescript
// src/app/aio/page.tsx (JSON-LD部分のみ)

import { generatePricingJsonLD } from '@/config/unified-plans';

export default function AIOPage() {
  const pricingJsonLD = generatePricingJsonLD();
  
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLD) }}
        />
      </Head>
      
      {/* 既存のページ内容 */}
    </>
  );
}
```

## 4. テスト実行コマンド

```bash
# 価格統一テスト実行
npm test pricing-consistency

# セーフモードでの確認
STRIPE_SAFE_MODE=true npm run dev

# 本番モードテスト（注意: 実際のAPI呼び出し）
NODE_ENV=production npm test stripe-integration
```

## 5. 環境変数設定例

```env
# .env.local
STRIPE_SAFE_MODE=true  # 開発時は必須
NODE_ENV=development

# 本番環境のみ
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```