/**
 * LuxuCare CMS 埋め込み機能設定
 * プラン別制限・セキュリティ・キャッシュ戦略
 */

import type { PlanType } from './plans';

// 埋め込みタイプ定義
export type EmbedType = 'widget' | 'iframe' | 'html';
export type EmbedTheme = 'light' | 'dark' | 'auto';
export type EmbedSize = 'small' | 'medium' | 'large';

// TODO: [UNIFICATION_CANDIDATE] Phase 3-B: 埋め込み制限の effective-features 統合
// 現状: 静的 EMBED_LIMITS の3階層 (free/standard/enterprise) 設定
// 提案: plan_features テーブルで embed_widgets, embed_monthly_views 等の機能管理
// 利点: プラン別カスタマイズ、組織別オーバーライド、管理画面での一元設定
// 影響: 既存の3階層マッピング (getEmbedLimits) 維持必須（後方互換性）

/**
 * プラン別埋め込み制限
 */
export const EMBED_LIMITS = {
  free: {
    widgets: 1,                    // Widget作成数上限
    monthlyViews: 1000,           // 月間表示回数
    customCSS: false,             // カスタムCSS許可
    analytics: false,             // 分析機能
    apiKey: false,                // APIキー利用
    whiteLabel: false,            // ブランディング非表示
    cacheTime: 3600,              // キャッシュ時間（秒）
    rateLimitPerMinute: 60,       // 分間リクエスト制限
  },
  standard: {
    widgets: 10,
    monthlyViews: 50000,
    customCSS: true,
    analytics: true,
    apiKey: true,
    whiteLabel: false,
    cacheTime: 900,               // 15分
    rateLimitPerMinute: 300,
  },
  enterprise: {
    widgets: Number.POSITIVE_INFINITY,
    monthlyViews: Number.POSITIVE_INFINITY,
    customCSS: true,
    analytics: true,
    apiKey: true,
    whiteLabel: true,
    cacheTime: 300,               // 5分（最新データ優先）
    rateLimitPerMinute: Number.POSITIVE_INFINITY,
  }
} as const;

/**
 * セキュリティ設定
 */
export const EMBED_SECURITY = {
  // 許可されるCSS属性（XSS防止）
  allowedCSSProperties: [
    'color', 'background', 'background-color', 'background-image',
    'border', 'border-color', 'border-width', 'border-style', 'border-radius',
    'margin', 'padding', 'font-family', 'font-size', 'font-weight',
    'text-align', 'text-decoration', 'line-height', 'width', 'height',
    'max-width', 'max-height', 'min-width', 'min-height',
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'z-index', 'opacity', 'transform', 'transition', 'box-shadow'
  ],
  
  // 禁止されるCSS値（危険なパターン）
  forbiddenCSSPatterns: [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /expression\(/i,
    /url\(/i,
    /@import/i,
    /behavior:/i
  ],
  
  // 最大CSS長
  maxCSSLength: 2000,
  
  // 許可されるOrigin（本番では制限推奨）
  allowedOrigins: ['https://aiohub.jp'], // 本番用：具体的ドメイン指定
  
  // CORS設定
  corsHeaders: {
    'Access-Control-Allow-Origin': 'https://aiohub.jp',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent, X-Requested-With',
    'Access-Control-Max-Age': '86400', // 24時間
  }
} as const;

/**
 * キャッシュ戦略
 */
export const EMBED_CACHE = {
  // CDNキャッシュ時間（秒）
  cdnCache: {
    widget: 3600,        // 1時間
    iframe: 1800,        // 30分
    assets: 86400,       // 24時間（CSS/JS）
  },
  
  // ブラウザキャッシュ時間
  browserCache: {
    widget: 1800,        // 30分
    iframe: 900,         // 15分
    assets: 43200,       // 12時間
  },
  
  // Redis/メモリキャッシュ
  serverCache: {
    organizationData: 900,    // 15分
    jsonLdData: 600,          // 10分
    usageStats: 300,          // 5分
  },
  
  // キャッシュ無効化トリガー
  invalidationTriggers: [
    'organization_updated',
    'services_updated', 
    'posts_updated',
    'manual_refresh'
  ]
} as const;

/**
 * 分析・監視設定
 */
export const EMBED_ANALYTICS = {
  // 追跡するイベント
  trackedEvents: [
    'widget_loaded',      // Widget読み込み
    'widget_clicked',     // Widget内リンククリック
    'iframe_resized',     // iframe高さ変更
    'error_occurred',     // エラー発生
    'api_limit_exceeded'  // API制限超過
  ],
  
  // バッチ処理設定
  batchProcessing: {
    maxBatchSize: 100,
    flushInterval: 30000,  // 30秒
    retryAttempts: 3,
  },
  
  // 保持期間
  dataRetention: {
    dailyStats: 90,        // 90日
    monthlyStats: 365,     // 1年
    rawLogs: 7,           // 7日
  }
} as const;

/**
 * OEM設定（Phase 3用）
 */
export const EMBED_OEM = {
  // APIキー形式
  apiKeyFormat: /^lxc_[a-zA-Z0-9]{32}$/,
  
  // OEMプラン制限
  oemLimits: {
    basic: {
      requests: 10000,     // 月間リクエスト
      organizations: 50,   // 組織数
      customDomain: false,
      whiteLabel: true,
    },
    professional: {
      requests: 100000,
      organizations: 500,
      customDomain: true,
      whiteLabel: true,
    },
    enterprise: {
      requests: Number.POSITIVE_INFINITY,
      organizations: Number.POSITIVE_INFINITY,
      customDomain: true,
      whiteLabel: true,
    }
  }
} as const;

/**
 * ユーティリティ関数
 */

/**
 * プランの埋め込み制限を取得
 */
export function getEmbedLimits(plan: PlanType) {
  // 現行プラン名を埋め込み制限内部キーにマッピング
  // 理由: 埋め込み制限は従来のfree/standard/enterpriseの3階層で管理
  const planMapping: Record<PlanType, keyof typeof EMBED_LIMITS> = {
    trial: 'free',
    starter: 'free', 
    pro: 'standard',
    business: 'standard',
    enterprise: 'enterprise'
  };
  
  const embedPlan = planMapping[plan] || 'free';
  return EMBED_LIMITS[embedPlan];
}

/**
 * CSS安全性チェック
 */
export function isCSSSafe(cssText: string): boolean {
  if (!cssText || cssText.length > EMBED_SECURITY.maxCSSLength) {
    return false;
  }
  
  // 禁止パターンチェック
  for (const pattern of EMBED_SECURITY.forbiddenCSSPatterns) {
    if (pattern.test(cssText)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 埋め込み制限チェック
 */
export function checkEmbedLimit(plan: PlanType, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const limits = getEmbedLimits(plan);
  const limit = limits.widgets;
  const remaining = Math.max(0, limit - currentCount);
  
  return {
    allowed: currentCount < limit,
    limit: limit === Number.POSITIVE_INFINITY ? -1 : limit,
    remaining: limit === Number.POSITIVE_INFINITY ? -1 : remaining
  };
}

/**
 * 月間表示制限チェック
 */
export function checkMonthlyViewLimit(plan: PlanType, currentViews: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const limits = getEmbedLimits(plan);
  const limit = limits.monthlyViews;
  const remaining = Math.max(0, limit - currentViews);
  
  return {
    allowed: currentViews < limit,
    limit: limit === Number.POSITIVE_INFINITY ? -1 : limit,
    remaining: limit === Number.POSITIVE_INFINITY ? -1 : remaining
  };
}

/**
 * キャッシュヘッダー生成
 */
export function generateCacheHeaders(embedType: EmbedType, plan: PlanType): Record<string, string> {
  const limits = getEmbedLimits(plan);
  const cacheTime = limits.cacheTime;
  
  return {
    'Cache-Control': `public, max-age=${cacheTime}, s-maxage=${cacheTime}, stale-while-revalidate=${cacheTime * 2}`,
    'Expires': new Date(Date.now() + cacheTime * 1000).toUTCString(),
    'ETag': `"${Date.now()}-${embedType}-${plan}"`,
    'Vary': 'Accept-Encoding, User-Agent',
  };
}

/**
 * レート制限チェック
 */
export function checkRateLimit(plan: PlanType, requestsInLastMinute: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const limits = getEmbedLimits(plan);
  const limit = limits.rateLimitPerMinute;
  const remaining = Math.max(0, limit - requestsInLastMinute);
  const resetTime = Math.ceil(Date.now() / 60000) * 60000; // 次の分
  
  return {
    allowed: requestsInLastMinute < limit,
    limit: limit === Number.POSITIVE_INFINITY ? -1 : limit,
    remaining: limit === Number.POSITIVE_INFINITY ? -1 : remaining,
    resetTime
  };
}