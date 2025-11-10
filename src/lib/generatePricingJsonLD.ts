/**
 * JSON-LD 構造化データの動的生成
 * 
 * 統一価格設定 (unified-plans.ts) から価格を読み取り、
 * 一貫したOfferデータを生成することで「表示価格」と「構造化データ価格」の不一致を防ぐ
 */

import { 
  UNIFIED_PLAN_CONFIG, 
  type UnifiedPlanType 
} from '@/config/unified-plans';

/**
 * AIO Hub プラン用 JSON-LD 生成
 * aio/page.tsx で使用
 */
export function generateAIOPricingJsonLD() {
  // trial プランを除く有料プランのみを対象
  const paidPlans = Object.entries(UNIFIED_PLAN_CONFIG)
    .filter(([planType]) => planType !== 'trial') as [UnifiedPlanType, typeof UNIFIED_PLAN_CONFIG[UnifiedPlanType]][];

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AIO Hub - AI情報最適化プラットフォーム",
    "description": "AIが理解しやすい形で企業情報を構造化・整備するサービス",
    "provider": {
      "@type": "Organization",
      "name": "LuxuCare株式会社",
      "url": "https://aiohub.net"
    },
    "category": "Software",
    "serviceType": "AI Information Optimization",
    "offers": paidPlans.map(([planType, config]) => ({
      "@type": "Offer",
      "name": config.name,
      "description": getOfferDescription(planType),
      "price": config.price.toString(), // ✅ 統一設定から自動取得
      "priceCurrency": "JPY",
      "billingIncrement": "P1M", // 月額
      "priceValidUntil": "2025-12-31",
      "availability": "https://schema.org/InStock",
      "category": planType === 'enterprise' ? "Enterprise" : "Standard"
    }))
  };
}

/**
 * ヒアリングサービス用 JSON-LD 生成  
 * hearing-service/page.tsx で使用
 */
export function generateHearingServiceJsonLD() {
  return {
    "@context": "https://schema.org", 
    "@type": "Service",
    "name": "ヒアリング代行サービス",
    "description": "AI最適化のための企業情報整備代行サービス",
    "provider": {
      "@type": "Organization",
      "name": "LuxuCare株式会社",
      "url": "https://aiohub.net"
    },
    "category": "Consulting",
    "serviceType": "Information Optimization Consulting",
    "offers": [
      {
        "@type": "Offer",
        "name": "ライトヒアリング（基本構造化）",
        "description": "企業の基本情報を短時間でAI最適化",
        "price": "30000",
        "priceCurrency": "JPY", 
        "priceValidUntil": "2025-12-31"
      },
      {
        "@type": "Offer",
        "name": "アドバンスヒアリング（戦略構造化）",
        "description": "採用・PR・B2B向けQ&A拡充で深度ある情報構造",
        "price": "70000",
        "priceCurrency": "JPY",
        "priceValidUntil": "2025-12-31"
      },
      {
        "@type": "Offer", 
        "name": "フルヒアリング（包括構造化＋運用設計）",
        "description": "AI引用を前提とした完全構造化プロフィール",
        "price": "120000",
        "priceCurrency": "JPY",
        "priceValidUntil": "2025-12-31"
      },
      {
        "@type": "Offer",
        "name": "継続フォロー（運用＋月次ヒアリング）",
        "description": "月次ヒアリング＋更新代行で継続的な最適化", 
        "price": "30000",
        "priceCurrency": "JPY",
        "billingIncrement": "P1M"
      }
    ]
  };
}

/**
 * プラン別の Offer 説明文生成
 */
function getOfferDescription(planType: UnifiedPlanType): string {
  const descriptions = {
    starter: "基本的なAI最適化運用 - 企業情報の構造化とSEO最適化",
    pro: "高度なAI最適化運用 - 詳細分析レポートと外部連携機能",
    business: "本格的なAI最適化運用 - 無制限機能とVerified認証",
    enterprise: "エンタープライズ向け完全運用 - カスタム開発とSLA保証",
    trial: "14日間無料トライアル"
  };

  return descriptions[planType];
}

/**
 * 汎用的な価格整合性チェック（開発時デバッグ用）
 */
export function validateJsonLDPricing(): boolean {
  console.log('🔍 JSON-LD 価格整合性チェック開始');
  
  const aioJsonLD = generateAIOPricingJsonLD();
  const offers = aioJsonLD.offers;
  
  let isValid = true;
  
  offers.forEach((offer, index) => {
    const offerName = offer.name;
    const offerPrice = parseInt(offer.price);
    
    // 統一設定との比較
    const planEntry = Object.entries(UNIFIED_PLAN_CONFIG)
      .find(([, config]) => config.name === offerName);
    
    if (planEntry) {
      const [planType, config] = planEntry;
      if (config.price !== offerPrice) {
        console.error(`❌ 価格不整合: ${offerName} JSON-LD:${offerPrice} 統一設定:${config.price}`);
        isValid = false;
      } else {
        console.log(`✅ 価格整合性OK: ${offerName} = ¥${offerPrice}`);
      }
    }
  });
  
  console.log(`🔍 チェック結果: ${isValid ? '✅ 全て整合' : '❌ 不整合あり'}`);
  return isValid;
}

// 開発環境でのデバッグ実行
if (process.env.NODE_ENV === 'development') {
  validateJsonLDPricing();
}