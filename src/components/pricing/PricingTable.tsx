'use client';

/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, PRICING_CONFIG } from '@/lib/pricing';
import { PLAN_LABELS, formatPriceLabel } from '@/config/planLabels';
import { isPaidPlan, type PlanType } from '@/config/plans';

interface PlanFeature {
  text: string;
  included: boolean;
  subtext?: string;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  icon: typeof Star;
  popular?: boolean;
  inheritedFeatures?: string;
  features: PlanFeature[];
  ctaText: string;
  ctaHref: string;
  color: string;
  comingSoon?: string[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: PLAN_LABELS.starter,
    description: 'AI最適化CMS体験',
    price: '¥2,980',
    badge: '14日間無料',
    icon: Star,
    popular: false,
    features: [
      { text: 'ロゴ・企業情報を構造化公開（JSON‑LD）', included: true },
      { text: 'サービス登録：5件まで', included: true },
      { text: 'Q&A項目：10件まで', included: true },
      { text: 'Hub内構造化＋自社サイト埋め込み', included: true },
      { text: 'SEO最適化・構造化データ自動生成', included: true },
      { text: 'メールサポート', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'blue'
  },
  {
    id: 'pro',
    name: PLAN_LABELS.pro,
    description: 'AI Visibility・成長分析',
    price: '¥8,000',
    badge: '14日間無料',
    icon: Zap,
    popular: true,
    inheritedFeatures: 'Starterプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：20件まで', included: true },
      { text: 'Q&A項目：50件まで', included: true },
      { text: '営業資料添付（最大10個）', included: true },
      { text: 'AI Visibility分析レポート', included: true },
      { text: '外部リンク表示機能', included: true },
      { text: 'カテゴリタグ検索対応', included: true },
      { text: '優先サポート', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'green'
  },
  {
    id: 'business',
    name: PLAN_LABELS.business,
    description: '分析＋ブランド特化',
    price: '¥15,000',
    badge: '14日間無料',
    icon: Crown,
    popular: false,
    inheritedFeatures: 'Proプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：無制限', included: true },
      { text: 'Q&A項目：無制限', included: true },
      { text: '営業資料添付（無制限）', included: true },
      { text: 'Verified法人バッジ', included: true },
      { text: 'AI解析レポート（拡張版）', included: true },
      { text: 'ブランド分析・競合監視', included: true },
      { text: 'カスタム機能開発相談', included: true },
      { text: '専任サポート・個別相談', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'purple'
  }
];

export default function PricingTable() {
  return (
    <>
      {/* Mobile: Horizontal Scroll */}
      <div className="lg:hidden mobile-scroll">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`aio-surface relative border p-8 pt-10 lg:pt-8 flex flex-col min-h-[600px] min-w-[80%] snap-center lg:min-w-0 ${
              plan.popular
                ? 'border-[5px] border-blue-400 shadow-lg'
                : 'border border-gray-200/60'
            }`}
          >
            {plan.popular && (
              // 意図:
              // 「おすすめ」ラベルをProプランと完全に一体化させ、
              // まるでカードの一部（ヘッダータグ）のように見せる。
              // - 面積を増やして"選ばれている感"を強調
              // - 枠線を太く・濃くしてヒエラルキーを明確化
              // - バッジを3分の1かぶせて、カードと視覚的に連続させる
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-white border-[5px] border-blue-400 px-7 py-3 rounded-full shadow-lg flex items-center gap-3">
                  <Crown className="w-6 h-6 text-blue-700" strokeWidth={2.2} />
                  <span className="text-lg font-bold text-blue-800">おすすめ</span>
                </div>
              </div>
            )}

            <div className="text-center mb-8">
              <div className={`w-16 h-16 mx-auto mb-4 ${plan.popular ? 'mt-6' : 'mt-1'} rounded-2xl flex items-center justify-center shadow-lg ${
                plan.color === 'blue' ? 'bg-[var(--aio-primary)]' :
                plan.color === 'green' ? 'bg-[var(--aio-primary)]' :
                'bg-[var(--aio-primary)]'
              }`}>
                <plan.icon className="w-8 h-8 text-[var(--text-on-primary)]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                {plan.originalPrice && (
                  <span className="text-lg text-gray-400 line-through mr-2">
                    {plan.originalPrice}
                  </span>
                )}
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                {isPaidPlan(plan.id as PlanType) && (
                  <span className="text-gray-600 ml-1">（税別）/月</span>
                )}
                {plan.badge && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      {plan.badge}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.inheritedFeatures && (
                <li className="text-sm text-gray-600 italic border-b border-gray-200 pb-3">
                  {plan.inheritedFeatures}
                </li>
              )}
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check
                    className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                      feature.included ? 'text-green-500' : 'text-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {feature.text}
                    </span>
                    {feature.subtext && (
                      <div className="text-xs text-gray-500 mt-1">
                        {feature.subtext}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="text-center mt-auto">
              <Link
                href={plan.ctaHref}
                className={`inline-flex items-center justify-center w-full px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
                  plan.popular 
                    ? 'bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)]' 
                    : 'bg-[var(--aio-surface)] hover:bg-[var(--aio-muted)] text-[var(--text-primary)] border border-[var(--border-light)]'
                }`}
              >
                {plan.ctaText}
              </Link>
            </div>

            {plan.comingSoon && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                {plan.comingSoon.map((note, index) => (
                  <p key={index} className="text-xs text-gray-500 text-center">{note}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden lg:block mt-10" data-section="pricing-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`aio-surface relative border p-8 pt-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full min-h-[700px] ${
                plan.popular
                  ? 'border-[5px] border-blue-400 shadow-lg scale-105'
                  : 'border border-gray-200/60'
              }`}
            >
              {plan.popular && (
                // 意図:
                // 「おすすめ」ラベルをProプランと完全に一体化させ、
                // まるでカードの一部（ヘッダータグ）のように見せる。
                // - 面積を増やして"選ばれている感"を強調
                // - 枠線を太く・濃くしてヒエラルキーを明確化
                // - バッジを3分の1かぶせて、カードと視覚的に連続させる
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-white border-[5px] border-blue-400 px-7 py-3 rounded-full shadow-lg flex items-center gap-3">
                    <Crown className="w-6 h-6 text-blue-700" strokeWidth={2.2} />
                    <span className="text-lg font-bold text-blue-800">おすすめ</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-4 ${plan.popular ? 'mt-6' : 'mt-1'} rounded-2xl flex items-center justify-center shadow-lg ${
                  plan.color === 'blue' ? 'bg-[var(--aio-primary)]' :
                  plan.color === 'green' ? 'bg-[var(--aio-primary)]' :
                  'bg-[var(--aio-primary)]'
                }`}>
                  <plan.icon className="w-8 h-8 text-[var(--text-on-primary)]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  {plan.originalPrice && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {isPaidPlan(plan.id as PlanType) && (
                    <span className="text-gray-600 ml-1">（税別）/月</span>
                  )}
                  {plan.badge && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        {plan.badge}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.inheritedFeatures && (
                  <li className="text-sm text-gray-600 italic border-b border-gray-200 pb-3">
                    {plan.inheritedFeatures}
                  </li>
                )}
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${
                        feature.included ? 'text-green-500' : 'text-gray-500'
                      }`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="text-xs text-gray-500 mt-1">
                          {feature.subtext}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="text-center mt-auto">
                <Link
                  href={plan.ctaHref}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)]' 
                      : 'bg-[var(--aio-surface)] hover:bg-[var(--aio-muted)] text-[var(--text-primary)] border border-[var(--border-light)]'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>

              {plan.comingSoon && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {plan.comingSoon.map((note, index) => (
                    <p key={index} className="text-xs text-gray-500 text-center">{note}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Enterprise consultation note */}
      <div className="mt-16 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Enterpriseプランについて
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            より大規模な組織や特別な要件をお持ちの企業様には、カスタマイズされたEnterpriseプランをご用意いたします。
            詳細な機能や導入サポートについては、お気軽にお問い合わせください。
          </p>
          
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)]"
          >
            お問い合わせ
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-600 space-y-2">
          <p>
            ※価格は税別表示です。詳細機能についてはお問い合わせください。
          </p>
          <p>
            お支払いはクレジットカード・銀行振込に対応。いつでもプラン変更・解約可能です。
          </p>
        </div>
      </div>
    </>
  );
}