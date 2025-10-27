/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, PRICING_CONFIG } from '@/lib/pricing';
import { HIGButton } from '@/components/ui/HIGButton';
import { PLAN_LABELS, formatPriceLabel } from '@/config/planLabels';
import { PrimaryCTA } from '@/design-system';

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
        {/* Mobile: Vertical Stack */}
        <div className="lg:hidden space-y-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-8 ${
                plan.popular
                  ? 'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-transparent'
                  : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                    人気
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                  plan.color === 'blue' ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' :
                  plan.color === 'green' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  'bg-gradient-to-br from-slate-700 to-slate-800'
                }`}>
                  <plan.icon className="w-8 h-8 text-white" />
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
                  {plan.id !== 'free' && (
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
                        feature.included ? 'text-green-500' : 'text-gray-300'
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

              <div className="text-center">
                <PrimaryCTA
                  href={plan.ctaHref}
                  size="large"
                  className={`w-full justify-center ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl font-semibold'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-2xl font-semibold'
                  }`}
                >
                  {plan.ctaText}
                </PrimaryCTA>
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
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                  plan.popular
                    ? 'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-transparent scale-105'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      人気
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
                    plan.color === 'blue' ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' :
                    plan.color === 'green' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    'bg-gradient-to-br from-slate-700 to-slate-800'
                  }`}>
                    <plan.icon className="w-8 h-8 text-white" />
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
                    {plan.id !== 'free' && (
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
                          feature.included ? 'text-green-500' : 'text-gray-300'
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
                  <PrimaryCTA
                    href={plan.ctaHref}
                    size="large"
                    className={`w-full justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl font-semibold'
                        : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-2xl font-semibold'
                    }`}
                  >
                    {plan.ctaText}
                  </PrimaryCTA>
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
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Enterpriseプランについて
            </h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              より大規模な組織や特別な要件をお持ちの企業様には、カスタマイズされたEnterpriseプランをご用意いたします。
              詳細な機能や導入サポートについては、お気軽にお問い合わせください。
            </p>
            
            <PrimaryCTA
              href="/contact"
              size="medium"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl font-semibold"
            >
              お問い合わせ
            </PrimaryCTA>
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