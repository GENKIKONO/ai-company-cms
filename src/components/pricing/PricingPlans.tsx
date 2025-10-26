/**
 * AI最適化ヒアリング代行サービス料金プランコンポーネント
 * アクセシビリティ・モバイル最適化・自然な価値提案対応
 */

import Link from 'next/link';
import { Check, Star, Zap, Crown, Building2, MessageSquare, Target, Users, Calendar, Phone, Sparkles } from 'lucide-react';
import { PLAN_LABELS } from '@/config/planLabels';

// Dynamic class mapping for Tailwind purge safety
const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  indigo: "text-indigo-600",
  gray: "text-slate-600",
};

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface HearingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  unit: string;
  badge?: string;
  icon: typeof Star;
  popular?: boolean;
  features: PlanFeature[];
  ctaText: string;
  ctaHref: string;
  color: string;
  benefits: string[];
  continuousSupport?: string;
}

const HEARING_PLANS: HearingPlan[] = [
  {
    id: 'standard',
    name: PLAN_LABELS.starter,
    description: '1回ヒアリング＋AI構造化代行',
    price: '50,000円',
    unit: '（税別）',
    icon: MessageSquare,
    popular: false,
    features: [
      { text: 'ヒアリング実施（60分）', included: true },
      { text: '第三者視点での企業価値整理', included: true },
      { text: 'AI/SEO最適化構造データ作成', included: true },
      { text: 'ChatGPT/Gemini対応構造化', included: true, highlight: true },
      { text: 'JSON-LD形式での納品', included: true },
      { text: '最短3日での納品', included: true },
      { text: 'Q&A項目追加', included: false },
      { text: '継続サポート', included: false }
    ],
    ctaText: 'このプランで依頼する',
    ctaHref: '/contact?plan=standard',
    color: 'blue',
    benefits: [
      '対話を通じた企業価値の言語化',
      'AI検索に最適化された構造データ',
      '迅速な納品で素早い効果実現'
    ],
    continuousSupport: 'なし（単発）'
  },
  {
    id: 'business',
    name: PLAN_LABELS.business,
    description: '初回ヒアリング＋2ヶ月継続サポート',
    price: '100,000円',
    unit: '（税別）',
    badge: '人気',
    icon: Target,
    popular: true,
    features: [
      { text: 'ベーシックプランの全内容', included: true },
      { text: '初回ヒアリング（90分）', included: true },
      { text: '月1回フォローアップ（2ヶ月）', included: true, highlight: true },
      { text: 'Q&A項目の段階的拡充', included: true, highlight: true },
      { text: '市場反応に基づく調整', included: true },
      { text: 'AI検索表現の継続改善', included: true },
      { text: '再ヒアリング（1回 33,000円で追加可）', included: true },
      { text: 'メール・チャットサポート', included: true }
    ],
    ctaText: 'このプランで依頼する',
    ctaHref: '/contact?plan=business',
    color: 'purple',
    benefits: [
      '継続的な情報ブラッシュアップ',
      '市場反応を踏まえた表現調整',
      '段階的な価値向上サポート'
    ],
    continuousSupport: '2ヶ月（1回/月フォロー）'
  },
  {
    id: 'enterprise',
    name: PLAN_LABELS.enterprise,
    description: '複数回ヒアリング＋半年伴走支援',
    price: '180,000円〜',
    unit: '（税別）',
    icon: Building2,
    popular: false,
    features: [
      { text: 'ビジネスプランの全内容', included: true },
      { text: '複数回ヒアリング（月1回×6ヶ月）', included: true },
      { text: '事業部門別情報整理', included: true },
      { text: '競合分析・ポジショニング設計', included: true, highlight: true },
      { text: 'AI戦略コンサルティング', included: true, highlight: true },
      { text: '実装支援・運用指導', included: true },
      { text: '専任担当者によるサポート', included: true },
      { text: 'カスタム機能開発相談', included: true }
    ],
    ctaText: '見積もり依頼',
    ctaHref: '/contact?service=enterprise',
    color: 'indigo',
    benefits: [
      '包括的な企業価値戦略支援',
      '長期的な競争力強化',
      '専任チームによる伴走型サポート'
    ],
    continuousSupport: '6ヶ月伴走'
  }
];

interface PricingPlansProps {
  className?: string;
  showTitle?: boolean;
}

export default function PricingPlans({ 
  className = '', 
  showTitle = true 
}: PricingPlansProps) {
  return (
    <section 
      className={`section--alt ${className}`} 
      aria-labelledby="pricing-title"
      data-component="PricingPlans"
    >
      <div className="site-container">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 id="pricing-title" className="text-3xl md:text-4xl font-bold text-primary mb-4">
              料金プラン（AI最適化ヒアリング代行）
            </h2>
            <p className="text-lg text-secondary max-w-3xl mx-auto">
              対話を通じて企業価値を第三者視点で整理し、
              ChatGPT・Gemini・Google AIに理解されやすい構造データとして言語化します。
            </p>
          </div>
        )}

        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden">
          <div className="hscroll">
            {HEARING_PLANS.map((plan, index) => (
              <article
                key={plan.id}
                className={`
                  card relative max-h-[480px] overflow-hidden shadow-sm border border-slate-200 bg-white transition-all duration-200
                  hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500
                  ${plan.popular 
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50' 
                    : 'hover:border-gray-300'
                  }
                `}
                role="tabpanel"
                aria-labelledby={`plan-${plan.id}-title`}
                tabIndex={index}
                style={{ scrollSnapAlign: 'center' }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-purple-600 text-white shadow-lg">
                      <Sparkles className="w-4 h-4 mr-1.5" aria-hidden="true" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <plan.icon className={`h-10 w-10 mx-auto ${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                  </div>
                  <h3 id={`plan-${plan.id}-title`} className="text-xl font-bold text-primary mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-secondary text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">
                      {plan.price}
                    </span>
                    <span className="text-secondary ml-1">
                      {plan.unit}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">含まれる内容</h4>
                  <ul className="space-y-3" role="list">
                    {plan.features.slice(0, 3).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check
                          className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                            feature.included ? 'text-green-500' : 'text-slate-600'
                          }`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-sm ${
                            feature.included 
                              ? feature.highlight 
                                ? 'text-gray-900 font-medium' 
                                : 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="flex items-start">
                        <Check className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500" aria-hidden="true" />
                        <span className="text-sm text-gray-600">
                          他 {plan.features.length - 3} 項目を含む
                        </span>
                      </li>
                    )}
                  </ul>

                  {/* Continuous Support Info */}
                  {plan.continuousSupport && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="text-sm font-semibold text-blue-900 mb-1">継続支援</h5>
                      <p className="text-sm text-blue-800">{plan.continuousSupport}</p>
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">主な特徴</h4>
                    <ul className="space-y-2" role="list">
                      {plan.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="text-sm text-gray-600 flex items-start">
                          <Star className="h-4 w-4 mt-0.5 mr-2 text-yellow-500 flex-shrink-0" aria-hidden="true" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-auto">
                  <Link
                    href={plan.ctaHref}
                    className="btn-apple btn-apple-primary w-full text-center py-4 px-6 text-lg font-semibold transform hover:scale-105 transition-transform"
                    style={{ minHeight: '56px', fontSize: '18px' }}
                    role="button"
                    aria-label={`${plan.name}プランを選択`}
                  >
                    {plan.ctaText}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto pt-8">
          {HEARING_PLANS.map((plan, index) => (
            <article
              key={plan.id}
              className={`
                bg-white rounded-xl shadow-sm border border-slate-200 transition-all duration-200
                flex flex-col h-full p-8
                hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500
                ${plan.popular 
                  ? 'border-purple-500 relative' 
                  : 'hover:border-gray-300'
                }
              `}
              role="tabpanel"
              aria-labelledby={`desktop-plan-${plan.id}-title`}
              tabIndex={index}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-purple-600 text-white shadow-lg">
                    <Sparkles className="w-4 h-4 mr-1.5" aria-hidden="true" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <plan.icon className={`h-12 w-12 mx-auto ${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                </div>
                <h3 id={`desktop-plan-${plan.id}-title`} className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {plan.unit}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-8">
                <h4 className="font-semibold text-gray-900 mb-6">含まれる内容</h4>
                <ul className="space-y-4" role="list">
                  {plan.features.slice(0, 3).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check
                        className={`h-5 w-5 mt-1 mr-3 flex-shrink-0 ${
                          feature.included ? 'text-green-500' : 'text-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={`${
                          feature.included 
                            ? feature.highlight 
                              ? 'text-gray-900 font-medium' 
                              : 'text-gray-700'
                            : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="flex items-start">
                      <Check className="h-5 w-5 mt-1 mr-3 flex-shrink-0 text-green-500" aria-hidden="true" />
                      <span className="text-gray-600">
                        他 {plan.features.length - 3} 項目を含む
                      </span>
                    </li>
                  )}
                </ul>

                {/* Continuous Support Info */}
                {plan.continuousSupport && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">継続支援</h5>
                    <p className="text-blue-800">{plan.continuousSupport}</p>
                  </div>
                )}

                {/* Benefits */}
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-900 mb-4">主な特徴</h4>
                  <ul className="space-y-3" role="list">
                    {plan.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="text-gray-600 flex items-start">
                        <Star className="h-4 w-4 mt-1 mr-2 text-yellow-500 flex-shrink-0" aria-hidden="true" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-auto">
                <Link
                  href={plan.ctaHref}
                  className="btn-apple btn-apple-primary w-full text-center py-4 px-6 text-lg font-semibold transform hover:scale-105 transition-transform"
                  style={{ minHeight: '56px', fontSize: '18px' }}
                  role="button"
                  aria-label={`${plan.name}プランを選択`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}