/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, getCampaignStarter, PRICING_CONFIG } from '@/lib/pricing';

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

const campaignStarter = getCampaignStarter();

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
      { text: 'ディレクトリ掲載（最下層・タグ1件）', included: true },
      { text: 'サービス1件登録', included: true },
      { text: '公開 / 非公開の切替', included: true },
      { text: '上位掲載・特集枠は対象外', included: false }
    ],
    ctaText: '無料で始める',
    ctaHref: '/organizations',
    color: 'blue'
  },
  {
    id: 'starter',
    name: 'Starter',
    description: '本格的なAI最適化運用',
    price: formatJPY(campaignStarter.campaign),
    originalPrice: campaignStarter.isCampaign ? formatJPY(campaignStarter.list) : undefined,
    badge: campaignStarter.isCampaign ? '今だけ' : undefined,
    icon: Crown,
    popular: true,
    inheritedFeatures: 'Freeプランのすべての機能に加えて',
    features: [
      { text: 'ディレクトリ掲載（通常順位・タグ複数）', included: true },
      { text: 'サービス上限：10件', included: true },
      { text: 'FAQ・外部リンクの追加', included: true },
      { text: 'JSON-LD構造化データ対応', included: true }
    ],
    ctaText: 'このプランで始める',
    ctaHref: '/organizations',
    color: 'purple'
  },
  {
    id: 'business',
    name: 'Business',
    description: '露出機会の最大化',
    price: PRICING_CONFIG.business.displayPrice,
    icon: Building2,
    popular: false,
    inheritedFeatures: 'Starterのすべての機能に加えて',
    features: [
      { text: '上位掲載（おすすめ・特集枠）', included: true },
      { text: 'ブログCMS（AIO Hub配下で配信）', included: true, subtext: '構造化済みの記事を自動生成・公開でき、AIに"読まれやすい"情報資産を継続的に蓄積' },
      { text: 'タグ複数露出（関連カテゴリでの表示強化）', included: true },
      { text: 'カスタムメタデータ設定', included: true }
    ],
    ctaText: 'このプランで始める',
    ctaHref: '/organizations',
    color: 'indigo',
    comingSoon: ['※上位掲載・詳細分析機能を含みます']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: '大規模運用・API連携',
    price: PRICING_CONFIG.enterprise.displayPrice,
    icon: Zap,
    popular: false,
    inheritedFeatures: 'Businessのすべての機能に加えて',
    features: [
      { text: '複数ブランド管理・承認フロー', included: true },
      { text: 'API / SSO 連携支援・優先サポート / SLA', included: true },
      { text: '専属コンサルティング（情報設計・AIO運用設計）', included: true },
      { text: '個別要件・外部データ連携などの拡張相談に対応', included: true }
    ],
    ctaText: 'お問い合わせ',
    ctaHref: '/contact',
    color: 'emerald'
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