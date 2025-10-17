/**
 * ヒアリング代行専用料金プランコンポーネント
 * アクセシビリティ・モバイル最適化対応
 */

import Link from 'next/link';
import { Check, Star, Zap, Crown, Building2, Phone, Calendar, Users } from 'lucide-react';

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
}

const HEARING_PLANS: HearingPlan[] = [
  {
    id: 'basic_hearing',
    name: 'スタンダード',
    description: '基本的なヒアリング代行',
    price: '55,000円',
    unit: '回',
    icon: Phone,
    popular: false,
    features: [
      { text: 'ヒアリング時間：60分', included: true },
      { text: '事前質問設計', included: true },
      { text: 'ヒアリング実施', included: true },
      { text: '要約レポート作成', included: true },
      { text: '録音データ提供', included: true },
      { text: '追加質問：最大3問', included: true },
      { text: 'フォローアップ相談（30分）', included: false },
      { text: '詳細分析レポート', included: false }
    ],
    ctaText: 'このプランで申し込む',
    ctaHref: '/hearing/apply?plan=basic',
    color: 'blue',
    benefits: [
      '事前準備からレポートまで一貫対応',
      '経験豊富なインタビュアーが担当',
      '最短3日でレポート納品'
    ]
  },
  {
    id: 'premium_hearing',
    name: 'プレミアム',
    description: '詳細分析付きヒアリング代行',
    price: '88,000円',
    unit: '回',
    badge: '人気',
    icon: Crown,
    popular: true,
    features: [
      { text: 'ヒアリング時間：90分', included: true },
      { text: '事前質問設計＋戦略相談', included: true },
      { text: 'ヒアリング実施', included: true },
      { text: '詳細分析レポート作成', included: true, highlight: true },
      { text: '録音データ＋文字起こし', included: true },
      { text: '追加質問：最大5問', included: true },
      { text: 'フォローアップ相談（60分）', included: true, highlight: true },
      { text: '改善提案書付き', included: true, highlight: true }
    ],
    ctaText: 'このプランで申し込む',
    ctaHref: '/hearing/apply?plan=premium',
    color: 'purple',
    benefits: [
      '戦略的な質問設計で深い洞察を獲得',
      '分析結果に基づく改善提案',
      '継続的なサポート体制'
    ]
  },
  {
    id: 'enterprise_hearing',
    name: 'エンタープライズ',
    description: '包括的なヒアリング＆分析',
    price: '165,000円',
    unit: '回',
    icon: Building2,
    popular: false,
    features: [
      { text: 'ヒアリング時間：120分', included: true },
      { text: '事前戦略設計ミーティング', included: true },
      { text: '複数回ヒアリング対応', included: true },
      { text: '総合分析レポート', included: true },
      { text: '全データ＋詳細文字起こし', included: true },
      { text: '追加質問：無制限', included: true },
      { text: '専任コンサルタント', included: true },
      { text: '実装支援（3ヶ月）', included: true }
    ],
    ctaText: 'お問い合わせ',
    ctaHref: '/contact?service=enterprise_hearing',
    color: 'indigo',
    benefits: [
      '包括的な課題分析と解決策提示',
      '実装まで一貫したサポート',
      '専任チームによる手厚いフォロー'
    ]
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
    <section className={`py-16 bg-gray-50 ${className}`} aria-labelledby="pricing-title">
      <div className="container mx-auto px-4">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 id="pricing-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              料金プラン（ヒアリング代行）
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              お客様のニーズに合わせて最適なヒアリングプランをお選びください。
              すべてのプランで録音データと要約レポートをご提供します。
            </p>
          </div>
        )}

        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden">
          <div 
            className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory no-scrollbar"
            style={{ scrollSnapType: 'x mandatory' }}
            role="tablist"
            aria-label="料金プラン選択"
          >
            {HEARING_PLANS.map((plan, index) => (
              <article
                key={plan.id}
                className={`
                  bg-white rounded-xl shadow-lg border-2 transition-all duration-200
                  flex flex-col min-h-[600px] w-[85%] flex-shrink-0 snap-center p-6
                  hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500
                  ${plan.popular 
                    ? 'border-purple-500 relative' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                role="tabpanel"
                aria-labelledby={`plan-${plan.id}-title`}
                tabIndex={index}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                  <div className="mb-4">
                    <plan.icon className={`h-10 w-10 mx-auto text-${plan.color}-600`} />
                  </div>
                  <h3 id={`plan-${plan.id}-title`} className="text-xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-1">
                      /{plan.unit}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex-1 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">含まれる内容</h4>
                  <ul className="space-y-3" role="list">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check
                          className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                            feature.included ? 'text-green-500' : 'text-gray-300'
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
                  </ul>

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
                    className={`
                      hit-44 cta-optimized block w-full text-center py-3 px-6 rounded-lg font-semibold 
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${plan.popular
                        ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                        : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500'
                      }
                    `}
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
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {HEARING_PLANS.map((plan, index) => (
            <article
              key={plan.id}
              className={`
                bg-white rounded-xl shadow-lg border-2 transition-all duration-200
                flex flex-col h-full p-8
                hover:shadow-xl focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500
                ${plan.popular 
                  ? 'border-purple-500 relative' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              role="tabpanel"
              aria-labelledby={`desktop-plan-${plan.id}-title`}
              tabIndex={index}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-sm font-semibold px-4 py-2 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <div className="mb-4">
                  <plan.icon className={`h-12 w-12 mx-auto text-${plan.color}-600`} />
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
                    /{plan.unit}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-8">
                <h4 className="font-semibold text-gray-900 mb-6">含まれる内容</h4>
                <ul className="space-y-4" role="list">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check
                        className={`h-5 w-5 mt-1 mr-3 flex-shrink-0 ${
                          feature.included ? 'text-green-500' : 'text-gray-300'
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
                </ul>

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
                  className={`
                    hit-44 cta-optimized block w-full text-center py-4 px-6 rounded-lg font-semibold 
                    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800 focus:ring-gray-500'
                    }
                  `}
                  role="button"
                  aria-label={`${plan.name}プランを選択`}
                >
                  {plan.ctaText}
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              ご利用の流れ
            </h3>
            <div className="grid md:grid-cols-4 gap-4 text-sm text-blue-800">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                <span>1. お申し込み</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                <span>2. 事前打ち合わせ</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-blue-600" />
                <span>3. ヒアリング実施</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-blue-600" />
                <span>4. レポート納品</span>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-6">
            ※価格は税込。お支払いは銀行振込・クレジットカードに対応。<br />
            詳細なお見積りや導入のご相談は、お気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </section>
  );
}