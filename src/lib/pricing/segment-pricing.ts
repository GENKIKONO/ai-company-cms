/**
 * Segment-Based Pricing System
 * ユーザーセグメント別の価格体系を管理
 */

import { logger } from '@/lib/utils/logger';

// ==============================
// Type Definitions
// ==============================

export type UserSegment = 'test_user' | 'early_user' | 'normal_user';
export type PlanTier = 'basic' | 'pro' | 'business';
export type PurchaseIntent = 'first_purchase' | 'upgrade';

export interface AppUserWithSegment {
  id: string;
  email: string;
  full_name?: string;
  segment?: UserSegment;
  // 他の既存フィールドは継承
}

// ==============================
// Environment Variable Mapping
// ==============================

/**
 * Stripe Price IDマッピング
 * segment × tier で9種類の価格を管理
 */
export const STRIPE_PRICES: Record<UserSegment, Record<PlanTier, string>> = {
  test_user: {
    basic: process.env.STRIPE_TEST_BASIC_PRICE_ID || '',
    pro: process.env.STRIPE_TEST_PRO_PRICE_ID || '', 
    business: process.env.STRIPE_TEST_BUSINESS_PRICE_ID || '',
  },
  early_user: {
    basic: process.env.STRIPE_EARLY_BASIC_PRICE_ID || '',
    pro: process.env.STRIPE_EARLY_PRO_PRICE_ID || '',
    business: process.env.STRIPE_EARLY_BUSINESS_PRICE_ID || '',
  },
  normal_user: {
    basic: process.env.STRIPE_NORMAL_BASIC_PRICE_ID || '',
    pro: process.env.STRIPE_NORMAL_PRO_PRICE_ID || '',
    business: process.env.STRIPE_NORMAL_BUSINESS_PRICE_ID || '',
  },
};

// ==============================
// Core Pricing Logic
// ==============================

/**
 * ユーザーセグメントと購入意図に基づいてStripe Price IDを決定
 * 
 * 割引ルール:
 * - test_user: 30%割引（初回購入のみ）
 * - early_user: 20%割引（初回購入のみ）  
 * - upgrade時: 全て通常価格（normal_user用price_id）
 * 
 * @param user ユーザー情報（segmentフィールド含む）
 * @param targetTier 目標プランティア
 * @param intent 購入意図
 * @returns Stripe Price ID
 */
export function getStripePriceIdForUser(
  user: AppUserWithSegment,
  targetTier: PlanTier,
  intent: PurchaseIntent
): string {
  // 遅延初期化
  ensureInitialized();
  
  // upgrade時は常に通常価格を使用
  if (intent === 'upgrade') {
    const normalPrice = STRIPE_PRICES.normal_user[targetTier];
    logger.info('Using normal pricing for upgrade', {
      userId: user.id,
      targetTier,
      intent,
      priceId: normalPrice
    });
    return normalPrice;
  }

  // first_purchase時のみセグメント割引を適用
  if (intent === 'first_purchase') {
    const segment = user.segment || 'normal_user';
    const segmentPrice = STRIPE_PRICES[segment][targetTier];
    
    logger.info('Using segment pricing for first purchase', {
      userId: user.id,
      segment,
      targetTier,
      intent,
      priceId: segmentPrice
    });
    
    return segmentPrice;
  }

  // フォールバック: 通常価格
  const fallbackPrice = STRIPE_PRICES.normal_user[targetTier];
  logger.warn('Using fallback pricing', {
    userId: user.id,
    targetTier,
    intent,
    priceId: fallbackPrice
  });
  
  return fallbackPrice;
}

// ==============================
// Utility Functions
// ==============================

/**
 * セグメントに基づく割引率を取得
 * @param segment ユーザーセグメント
 * @returns 割引率（例: 0.3 = 30%割引）
 */
export function getDiscountRate(segment: UserSegment): number {
  switch (segment) {
    case 'test_user':
      return 0.3; // 30%割引
    case 'early_user':
      return 0.2; // 20%割引
    case 'normal_user':
    default:
      return 0; // 割引なし
  }
}

/**
 * セグメントの表示名を取得
 * @param segment ユーザーセグメント
 * @returns 表示用名称
 */
export function getSegmentDisplayName(segment: UserSegment): string {
  switch (segment) {
    case 'test_user':
      return 'テストユーザー（30%割引）';
    case 'early_user':
      return '初期ユーザー（20%割引）';
    case 'normal_user':
    default:
      return '通常ユーザー';
  }
}

/**
 * 環境変数の設定状況をチェック
 * @returns 設定不足の環境変数リスト
 */
export function validatePriceEnvironmentVariables(): string[] {
  const missingVars: string[] = [];
  
  // 実際の環境変数名と一致させる
  const envVarMapping = {
    'test_user': {
      'basic': 'STRIPE_TEST_BASIC_PRICE_ID',
      'pro': 'STRIPE_TEST_PRO_PRICE_ID',
      'business': 'STRIPE_TEST_BUSINESS_PRICE_ID'
    },
    'early_user': {
      'basic': 'STRIPE_EARLY_BASIC_PRICE_ID', 
      'pro': 'STRIPE_EARLY_PRO_PRICE_ID',
      'business': 'STRIPE_EARLY_BUSINESS_PRICE_ID'
    },
    'normal_user': {
      'basic': 'STRIPE_NORMAL_BASIC_PRICE_ID',
      'pro': 'STRIPE_NORMAL_PRO_PRICE_ID', 
      'business': 'STRIPE_NORMAL_BUSINESS_PRICE_ID'
    }
  };
  
  // 全セグメント・全ティアをチェック
  Object.entries(STRIPE_PRICES).forEach(([segment, tiers]) => {
    Object.entries(tiers).forEach(([tier, priceId]) => {
      if (!priceId) {
        const envVarName = envVarMapping[segment as UserSegment]?.[tier as PlanTier];
        if (envVarName) {
          missingVars.push(envVarName);
        }
      }
    });
  });

  return missingVars;
}

/**
 * 初期化時の環境変数検証
 */
export function initializePricingSystem(): void {
  const missingVars = validatePriceEnvironmentVariables();
  
  if (missingVars.length > 0) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('Segment pricing initialization failed - missing environment variables', {
        missingVars,
        totalMissing: missingVars.length
      });
      throw new Error(`Missing required Stripe price environment variables: ${missingVars.join(', ')}`);
    } else {
      logger.warn('Development mode: Some Stripe price environment variables are missing', {
        missingVars,
        totalMissing: missingVars.length
      });
    }
  } else {
    logger.info('Segment pricing system initialized successfully', {
      segments: Object.keys(STRIPE_PRICES),
      tiers: Object.keys(STRIPE_PRICES.normal_user)
    });
  }
}

// 初期化状態を管理
let isInitialized = false;

/**
 * 遅延初期化関数
 * 実行時にのみ初期化を行い、ビルド時エラーを防ぐ
 */
export function ensureInitialized(): void {
  if (!isInitialized && typeof window === 'undefined') {
    try {
      initializePricingSystem();
      isInitialized = true;
    } catch (error) {
      // ビルド時・テスト時はエラーをログのみに留める
      logger.warn('Pricing system initialization deferred', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}