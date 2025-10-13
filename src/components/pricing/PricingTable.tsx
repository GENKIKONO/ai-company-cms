/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, PRICING_CONFIG } from '@/lib/pricing';

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
    id: 'free',
    name: 'Free',
    description: '無料で始めるAI最適化',
    price: PRICING_CONFIG.free.displayPrice,
    icon: Star,
    popular: false,
    features: [
      { text: 'ロゴ・企業情報を構造化公開（JSON‑LD）', included: true },
      { text: 'サービス1件登録', included: true },
      { text: 'Q&A項目：5件まで', included: true },
      { text: 'Hub内構造化のみ（自社サイト埋め込み不可）', included: true },
      { text: 'SEO最適化・構造化データ自動生成', included: true },
      { text: '外部CTA・問い合わせフォーム連携', included: false }
    ],
    ctaText: '無料で始める',
    ctaHref: '/organizations',
    color: 'blue'
  },
  {
    id: 'basic',
    name: 'Basic',
    description: '基本的なAI最適化運用',
    price: PRICING_CONFIG.basic.displayPrice,
    icon: Zap,
    popular: false,
    inheritedFeatures: 'Freeプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：10件まで', included: true },
      { text: 'Q&A項目：20件まで', included: true },
      { text: 'Hub＋自社サイト埋め込み対応', included: true },
      { text: '営業資料添付（最大5個）', included: true },
      { text: '外部リンク表示機能', included: true },
      { text: 'カテゴリタグ検索対応', included: true },
      { text: 'メールサポート', included: true }
    ],
    ctaText: 'このプランで始める',
    ctaHref: '/organizations',
    color: 'green'
  },
  {
    id: 'business',
    name: 'Business',
    description: '本格的なAI最適化運用',
    price: PRICING_CONFIG.business.displayPrice,
    icon: Crown,
    popular: true,
    inheritedFeatures: 'Basicプランのすべての機能に加えて',
    features: [
      { text: 'サービス登録：50件まで', included: true },
      { text: 'Q&A項目：無制限', included: true },
      { text: '営業資料添付（最大20個）', included: true },
      { text: 'Verified法人バッジ', included: true },
      { text: '承認フロー機能', included: true },
      { text: '認証バッジ機能', included: true },
      { text: 'Search Console連携', included: true },
      { text: 'AI解析レポート（基本版）', included: true },
      { text: 'システム監視機能', included: true },
      { text: '優先サポート・個別相談', included: true }
    ],
    ctaText: 'このプランで始める',
    ctaHref: '/organizations',
    color: 'purple'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'エンタープライズ向け完全運用',
    price: PRICING_CONFIG.enterprise.displayPrice,
    icon: Building2,
    popular: false,
    inheritedFeatures: 'Businessプランのすべての機能に加えて',
    features: [
      { text: 'すべての機能無制限', included: true },
      { text: 'SVG対応大サイズロゴ', included: true },
      { text: 'AI解析レポート（拡張版）', included: true },
      { text: 'カスタム機能開発', included: true },
      { text: '専任サポート', included: true },
      { text: 'SLA保証', included: true },
      { text: 'ホワイトラベル対応', included: true },
      { text: 'API優先アクセス', included: true }
    ],
    ctaText: 'お問い合わせ',
    ctaHref: '/contact',
    color: 'indigo'
  }
];

export default function PricingTable() {
  return (
    <section className="section bg-subtle">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-h1 text-neutral-900 mb-6 jp-text">
            シンプルで明確な料金体系
          </h2>
          <p className="text-body-large text-neutral-600 jp-text">
            無料から始めて、必要になったら拡張。最小の入力で、AIに"引用されやすい"企業情報を実現します。
          </p>
        </div>

        {/* All plans in responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 justify-center items-stretch max-w-7xl mx-auto mb-12">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card flex flex-col relative p-6 ${
                plan.popular
                  ? 'border-primary border-2'
                  : 'hover:border-neutral-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="badge badge-primary">
                    人気
                  </span>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-3 -right-3">
                  <span className="badge badge-accent">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-4">
                  <plan.icon className={`h-8 w-8 text-${plan.color}-600`} />
                </div>
                <h3 className="text-h3 text-neutral-900 mb-2 jp-text">{plan.name}</h3>
                <p className="text-body text-neutral-600 mb-4 jp-text">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <span className="text-body text-neutral-400 line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-h1 text-neutral-900">
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-neutral-600 ml-1">/月</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-2 sm:space-y-2.5 flex-1">
                {plan.inheritedFeatures && (
                  <li className="mb-4 pb-3 border-b border-gray-100">
                    <span className="text-body-small text-primary font-medium">
                      {plan.inheritedFeatures}
                    </span>
                  </li>
                )}
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`icon icon-sm shrink-0 mt-0.5 mr-3 ${
                        feature.included ? 'text-success' : 'text-neutral-300'
                      }`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-body-small jp-text ${
                          feature.included ? 'text-neutral-700' : 'text-neutral-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="mt-1 text-body-small text-neutral-500 pl-2 border-l-2 border-neutral-200 jp-text">
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
                  className={`btn w-full ${
                    plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
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
        
        {/* Enterprise consultation note */}
        <div className="text-center mb-8">
          <p className="text-body text-neutral-600 jp-text">
            Enterpriseプランの詳細な機能や導入サポートについては、お気軽にお問い合わせください
          </p>
        </div>

        <div className="mt-12 text-center">
          <p className="text-body-small text-neutral-500 jp-text">
            ※価格は税込。詳細機能についてはお問い合わせください。<br/>
            お支払いはクレジットカード・銀行振込に対応。いつでもプラン変更・解約可能です。
          </p>
        </div>
      </div>
    </section>
  );
}