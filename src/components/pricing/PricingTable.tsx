/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, PRICING_CONFIG } from '@/lib/pricing';
import { HIGButton } from '@/components/ui/HIGButton';

// Dynamic class mapping for Tailwind purge safety
const ICON_COLOR_MAP: Record<string, string> = {
  blue: "text-cyan-600",      // Starter - 水色系
  green: "text-blue-600",     // Pro - 青系
  purple: "text-slate-800",   // Business - 黒系
  indigo: "text-indigo-600",
  gray: "text-slate-600",
};

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
    name: 'Starter',
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
    ctaText: '14日間無料で試す',
    ctaHref: '/auth/signup',
    color: 'blue'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'AI Visibility・成長分析',
    price: '¥8,000',
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
    ctaText: '14日間無料で試す',
    ctaHref: '/auth/signup',
    color: 'green'
  },
  {
    id: 'business',
    name: 'Business',
    description: '分析＋ブランド特化',
    price: '¥15,000',
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
    ctaText: '14日間無料で試す',
    ctaHref: '/auth/signup',
    color: 'purple'
  }
];

export default function PricingTable() {
  return (
    <section className="section section--alt">
      <div className="site-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            シンプルで明確な料金体系
          </h2>
          <p className="text-lg text-secondary max-w-3xl mx-auto">
            無料から始めて、必要になったら拡張。最小の入力で、Schema.org準拠の企業情報構造化を実現します。
          </p>
        </div>

        {/* Mobile: Vertical Stack */}
        <div className="lg:hidden">
          <div className="space-y-6">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`card relative shadow-sm border border-secondary bg-white ${
                  plan.popular
                    ? 'border-accent bg-accent'
                    : 'hover:border-primary hover:shadow-xl'
                } transition-all duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 badge-primary text-sm font-medium rounded-full">
                      人気
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="mb-4">
                    <plan.icon className={`h-8 w-8 ${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">{plan.name}</h3>
                  <p className="text-secondary mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    {plan.originalPrice && (
                      <span className="text-sm text-gray-400 line-through mr-2">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-primary">
                      {plan.price}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="text-secondary ml-1">（税別）/月</span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 space-y-3 flex-1">
                  {plan.inheritedFeatures && (
                    <li className="mb-4 pb-3 border-b border-gray-100">
                      <span className="text-sm text-blue-600 font-medium">
                        {plan.inheritedFeatures}
                      </span>
                    </li>
                  )}
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check
                        className={`h-4 w-4 shrink-0 mt-0.5 mr-3 ${
                          feature.included ? 'text-green-500' : 'text-slate-600'
                        }`}
                      />
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-primary' : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                        {feature.subtext && (
                          <div className="mt-1 text-sm text-secondary pl-2 border-l-2 border-gray-200">
                            {feature.subtext}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <Link
                    href={plan.ctaHref}
                    className="hig-cta-primary w-full"
                  >
                    {plan.ctaText}
                  </Link>
                </div>

                {plan.comingSoon && (
                  <div className="mt-4 text-body-small text-neutral-500">
                    {plan.comingSoon.map((note, index) => (
                      <p key={index}>{note}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card relative flex flex-col shadow-sm border border-secondary bg-white ${
                plan.popular
                  ? 'border-accent bg-accent'
                  : 'hover:border-primary hover:shadow-xl'
              } transition-all duration-200`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 badge-primary text-sm font-medium rounded-full">
                    人気
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-4">
                  <plan.icon className={`h-8 w-8 ${ICON_COLOR_MAP[plan.color] || 'text-slate-600'}`} />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{plan.name}</h3>
                <p className="text-secondary mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <span className="text-sm text-gray-400 line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="ml-1" style={{ color: 'var(--text-secondary)' }}>**（税別）**/月</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-3 flex-1">
                {plan.inheritedFeatures && (
                  <li className="mb-4 pb-3 border-b border-gray-100">
                    <span className="text-sm text-blue-600 font-medium">
                      {plan.inheritedFeatures}
                    </span>
                  </li>
                )}
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`h-4 w-4 shrink-0 mt-0.5 mr-3 ${
                        feature.included ? 'text-green-500' : 'text-slate-600'
                      }`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-primary' : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="mt-1 text-sm text-secondary pl-2 border-l-2 border-gray-200">
                          {feature.subtext}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={plan.ctaHref}
                  className="hig-cta-primary w-full"
                >
                  {plan.ctaText}
                </Link>
              </div>

              {plan.comingSoon && (
                <div className="mt-4 text-sm text-secondary">
                  {plan.comingSoon.map((note, index) => (
                    <p key={index}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Enterprise consultation note */}
        <div className="text-center mb-8">
          <p className="text-secondary">
            Enterpriseプランの詳細な機能や導入サポートについては、お気軽にお問い合わせください
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-secondary">
            ※価格は税別。詳細機能についてはお問い合わせください。<br/>
            お支払いはクレジットカード・銀行振込に対応。いつでもプラン変更・解約可能です。
          </p>
        </div>
      </div>
    </section>
  );
}