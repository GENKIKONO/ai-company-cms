/**
 * 共通料金テーブルコンポーネント
 * /aio と /pricing の両方で使用
 */

import Link from 'next/link';
import { Check, Star, Crown, Building2, Zap } from 'lucide-react';
import { formatJPY, getCampaignStarter, PRICING_CONFIG } from '@/lib/pricing';
import HorizontalScroller from '@/components/ui/HorizontalScroller';

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
      { text: 'SNSシェア最適化（OGP対応／順次拡張予定）', included: true }
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
      { text: 'カスタムOGP設定（順次拡張予定）', included: true }
    ],
    ctaText: 'このプランで始める',
    ctaHref: '/organizations',
    color: 'indigo',
    comingSoon: ['※上位掲載・分析は順次拡張予定']
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
    <section className="py-12 sm:py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-6 leading-7 sm:leading-8 tracking-normal break-keep [text-wrap:balance]">
            シンプルで明確な料金体系
          </h2>
          <p className="text-[15px] sm:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto leading-7 sm:leading-8 break-keep [text-wrap:pretty]">
            無料から始めて、必要になったら拡張。
            最小の入力で、AIに"引用されやすい"企業情報を実現します。
          </p>
        </div>

        <HorizontalScroller ariaLabel="料金プラン一覧" className="lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`snap-start min-w-[280px] sm:min-w-0 relative rounded-2xl border-2 bg-white p-4 sm:p-6 shadow-sm transition-all hover:shadow-lg min-h-[500px] sm:min-h-[600px] flex flex-col ${
                plan.popular
                  ? 'border-purple-500 ring-2 ring-purple-500/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-purple-500 px-4 py-1 text-sm font-medium text-white">
                    人気
                  </span>
                </div>
              )}

              {plan.badge && (
                <div className="absolute -top-3 -right-3">
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-4">
                  <plan.icon className={`h-8 w-8 text-${plan.color}-600`} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 leading-7 sm:leading-8 tracking-normal break-keep [text-wrap:balance]">{plan.name}</h3>
                <p className="text-[13px] sm:text-sm text-gray-600 mb-4 leading-6 sm:leading-7 break-keep [text-wrap:pretty]">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <span className="text-base sm:text-lg text-gray-400 line-through mr-2 whitespace-nowrap">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900 whitespace-nowrap">
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-gray-600 ml-1 whitespace-nowrap">/月</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-2 sm:space-y-2.5 flex-1">
                {plan.inheritedFeatures && (
                  <li className="mb-4 pb-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-purple-600">
                      {plan.inheritedFeatures}
                    </span>
                  </li>
                )}
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 mr-2 sm:mr-3 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`}
                    />
                    <div className="flex-1">
                      <span
                        className={`text-[13px] sm:text-[15px] leading-6 sm:leading-7 break-keep [text-wrap:pretty] ${
                          feature.included ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="mt-1 text-xs sm:text-sm text-gray-500 pl-2 border-l-2 border-gray-200 leading-5 break-keep [text-wrap:pretty]">
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
                  className={`block w-full rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors ${
                    plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.ctaText}
                </Link>
              </div>

              {plan.comingSoon && (
                <div className="mt-4 text-xs text-gray-500">
                  {plan.comingSoon.map((note, index) => (
                    <p key={index}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </HorizontalScroller>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 leading-relaxed">
            ※価格は税込。機能の一部は順次拡張予定です。<br/>
            お支払いはクレジットカード・銀行振込に対応。いつでもプラン変更・解約可能です。
          </p>
        </div>
      </div>
    </section>
  );
}