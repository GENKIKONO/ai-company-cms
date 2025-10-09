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
      { text: 'ロゴアップロード', included: true },
      { text: 'サービス1件登録', included: true },
      { text: '公開/非公開設定', included: true },
      { text: 'AI掲載（基本枠）', included: true },
      { text: 'JSON-LD自動生成', included: true },
      { text: '外部リンク連携', included: false },
      { text: 'ディレクトリ掲載', included: false },
      { text: '上位掲載', included: false }
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
    features: [
      { text: 'Freeプランの全機能', included: true },
      { text: '構造化CMS機能', included: true },
      { text: '企業・サービス・FAQ無制限', included: true },
      { text: '画像1枚アップロード', included: true },
      { text: '外部リンク連携', included: true },
      { text: 'ディレクトリ掲載', included: true },
      { text: '上位掲載', included: false },
      { text: '詳細レポート', included: false }
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
    features: [
      { text: 'Starterプランの全機能', included: true },
      { text: '上位掲載（編集部レビュー）', included: true },
      { text: '構造化テンプレート拡張', included: true },
      { text: '簡易レポート機能', included: true },
      { text: '画像複数アップロード', included: true },
      { text: 'カスタムOGP設定', included: true },
      { text: 'API連携', included: false },
      { text: '複数ブランド管理', included: false }
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
    features: [
      { text: 'Businessプランの全機能', included: true },
      { text: '複数ブランド管理', included: true },
      { text: '担当者権限設定', included: true },
      { text: 'API連携・開発支援', included: true },
      { text: '優先サポート', included: true },
      { text: 'カスタマイズ対応', included: true },
      { text: 'SLA保証', included: true },
      { text: '専属コンサルティング', included: true }
    ],
    ctaText: 'お問い合わせ',
    ctaHref: '/contact',
    color: 'emerald'
  }
];

export default function PricingTable() {
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            シンプルで明確な料金体系
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-gray-600 max-w-3xl mx-auto">
            無料から始めて、必要になったら拡張。<br/>
            最小の入力で、AIに"引用されやすい"企業情報を実現します。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-lg ${
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  {plan.originalPrice && (
                    <span className="text-lg text-gray-400 line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.id !== 'free' && (
                    <span className="text-gray-600 ml-1">/月</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check
                      className={`h-5 w-5 shrink-0 mt-0.5 mr-3 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        feature.included ? 'text-gray-700' : 'text-gray-400'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

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

              {plan.comingSoon && (
                <div className="mt-4 text-xs text-gray-500">
                  {plan.comingSoon.map((note, index) => (
                    <p key={index}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

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