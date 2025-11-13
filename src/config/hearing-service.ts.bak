/**
 * ヒアリング代行サービス プラン設定
 * 新4階層プラン体系の定義
 */

import { Star, Zap, Crown, RotateCcw } from 'lucide-react';

export const HEARING_SERVICE_PLANS = {
  light: {
    id: 'light',
    name: 'Light',
    badge: '基本構造化',
    description: '企業の基本情報を短時間でAI最適化',
    price: 30000,
    period: '一回限り',
    duration: '60分×1回',
    icon: Star,
    popular: false,
    color: 'blue',
    features: [
      '企業/サービスの基礎ヒアリング（60分）',
      '登録中の項目（サービス情報・Q&A等）の代行入力（同意に基づく）',
      'JSON-LD構造化適用（Hub側反映）',
      '構造化データ出力と整合性チェック（技術的）',
      'Schema.org準拠のプロフィール構造（JSON-LD）を出力'
    ],
    limitations: [
      'Q&A拡充は含まれません',
      '公開後のブラッシュアップは別途相談'
    ],
    ctaText: 'お問合せ',
    contactParam: 'hearing-light'
  },
  advance: {
    id: 'advance',
    name: 'Advance',
    badge: '戦略構造化',
    description: '採用・PR・B2B向けQ&A拡充で深度ある情報構造',
    price: 70000,
    period: '一回限り',
    duration: '2.5〜3時間（分割可）',
    icon: Zap,
    popular: true,
    color: 'blue',
    features: [
      'ライトヒアリングの全範囲を含む',
      '採用/PR/B2B向けQ&A拡充（テンプレ活用）',
      '文章校正とAIO/SEO視点の整理',
      '公開後の簡易ブラッシュアップ1回まで',
      '採用・B2B向けの情報整理と構造化を実施'
    ],
    limitations: [
      '競合比較分析は含まれません',
    ],
    ctaText: 'お問合せ',
    contactParam: 'hearing-advance'
  },
  full: {
    id: 'full',
    name: 'Full',
    badge: '包括構造化',
    description: 'AI引用を前提とした完全構造化プロフィール',
    price: 120000,
    period: '一回限り',
    duration: '5〜6時間（複数回）',
    icon: Crown,
    popular: false,
    color: 'blue',
    features: [
      'アドバンスヒアリングの全範囲を含む',
      '各カテゴリ（採用/B2B/CSR/ブランド）深掘りQ&A',
      '競合比較分析と情報構造の設計',
      '公開前レビュー＋再編集2回まで',
      'Schema.org準拠のプロフィール構造（JSON-LD）を出力'
    ],
    limitations: [],
    ctaText: 'お問合せ',
    contactParam: 'hearing-full'
  },
  continuous: {
    id: 'continuous',
    name: 'Continuous',
    badge: '運用サポート',
    description: '月次ヒアリング＋更新代行で継続的な最適化',
    price: 30000,
    priceRange: '30,000〜50,000',
    period: '月額',
    duration: '月30〜60分',
    icon: RotateCcw,
    popular: false,
    color: 'blue',
    features: [
      '月30〜60分の定例ヒアリング',
      '情報更新代行（企業情報・サービス情報・Q&A等）',
      '構造化データの更新と技術レポート',
      '価格はカバレッジ/頻度で見積もり',
      '継続的な情報鮮度維持と構造化データの更新'
    ],
    limitations: [
      '詳細な価格は個別見積もり',
      '最低契約期間3ヶ月から'
    ],
    ctaText: 'お問合せ',
    contactParam: 'hearing-continuous'
  }
} as const;

export type HearingServicePlanId = keyof typeof HEARING_SERVICE_PLANS;

/**
 * プランカラー設定
 */
export const getHearingPlanColorClasses = (color: string) => {
  const colors = {
    blue: {
      accent: 'text-[var(--aio-primary)]',
      button: 'bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white',
      ring: 'ring-blue-500'
    },
    purple: {
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      ring: 'ring-purple-500'
    },
    gold: {
      accent: 'text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      ring: 'ring-amber-500'
    },
    green: {
      accent: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 text-white',
      ring: 'ring-green-500'
    }
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

/**
 * 価格フォーマッター
 */
export function formatHearingPrice(plan: typeof HEARING_SERVICE_PLANS[HearingServicePlanId]): string {
  if ('priceRange' in plan && plan.priceRange) {
    return `¥${plan.priceRange}`;
  }
  return `¥${plan.price.toLocaleString()}`;
}

/**
 * お問い合わせURL生成
 */
export function generateContactUrl(planId: HearingServicePlanId): string {
  const plan = HEARING_SERVICE_PLANS[planId];
  return `/contact?plan=${plan.contactParam}`;
}