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
import { useRevealOnScroll } from '@/lib/useRevealOnScroll';

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
    description: 'ビジネス本格活用',
    price: '¥8,000',
    icon: Building2,
    popular: true,
    inheritedFeatures: 'スターター全機能',
    features: [
      { text: 'サービス登録：20件まで', included: true },
      { text: 'Q&A項目：50件まで', included: true },
      { text: '導入事例・実績：10件まで', included: true },
      { text: 'アクセス解析・効果測定', included: true },
      { text: 'カスタムドメイン対応', included: true },
      { text: '優先サポート・電話対応', included: true }
    ],
    ctaText: 'プロで始める',
    ctaHref: '/auth/signup',
    color: 'green'
  },
  {
    id: 'business',
    name: PLAN_LABELS.business,
    description: '大規模展開向け',
    price: '¥15,000',
    icon: Zap,
    popular: false,
    inheritedFeatures: 'プロ全機能',
    features: [
      { text: 'サービス登録：無制限', included: true },
      { text: 'Q&A項目：無制限', included: true },
      { text: '導入事例・実績：無制限', included: true },
      { text: '複数ブランド・子会社管理', included: true },
      { text: '専任サポート担当', included: true },
      { text: 'API連携・Webhook対応', included: true }
    ],
    ctaText: '無料で試す',
    ctaHref: '/auth/signup',
    color: 'purple'
  }
];

// Individual pricing card with reveal animation
function PricingCard({ plan, index, isMobile = false }: { plan: PricingPlan; index: number; isMobile?: boolean }) {
  const { ref, isVisible } = useRevealOnScroll();
  const delayClass = index === 0 ? '' : index === 1 ? 'reveal-delay-100' : index === 2 ? 'reveal-delay-200' : 'reveal-delay-300';

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal-base reveal-up ${delayClass} ${isVisible ? 'is-visible' : ''} glass-card relative p-8 pt-10 ${isMobile ? 'lg:pt-8' : ''} spring-bounce flex flex-col ${isMobile ? 'min-h-[600px] min-w-[80%] snap-center lg:min-w-0' : 'h-full min-h-[700px]'} ${
        plan.popular
          ? `border-[3px] border-blue-400 shadow-premium ${isMobile ? '' : 'scale-105'}`
          : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white border-[5px] border-blue-400 px-7 py-3 rounded-full shadow-lg flex items-center gap-3">
            <Crown className="w-6 h-6 text-blue-700" strokeWidth={2.2} />
            <span className="text-lg font-bold text-blue-800">おすすめ</span>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 ${plan.popular ? 'mt-6' : 'mt-1'} rounded-2xl flex items-center justify-center shadow-lg bg-[var(--aio-primary)]`}>
          <plan.icon className="w-8 h-8 text-[var(--text-on-primary)]" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
          <span className="text-gray-600 ml-1">（税別）</span>
          {plan.badge && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--aio-primary)] text-[var(--text-on-primary)]">
                {plan.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {plan.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-start">
            <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-[var(--aio-primary)]" />
            <span className="text-sm text-gray-900">{feature.text}</span>
          </li>
        ))}
      </ul>

      <div className="text-center mt-auto">
        <Link
          href={plan.ctaHref}
          className={`inline-flex items-center justify-center w-full px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 ${
            plan.popular 
              ? 'bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] border-none shadow-lg hover:shadow-xl'
              : 'bg-[var(--aio-surface)] hover:bg-[var(--aio-muted)] text-[var(--text-primary)] border border-[var(--border-light)]'
          }`}
        >
          {plan.ctaText}
        </Link>
      </div>
    </div>
  );
}

export default function PricingTable() {
  return (
    <>
      {/* Mobile: Horizontal Scroll */}
      <div className="lg:hidden mobile-scroll">
        {PLANS.map((plan, index) => (
          <PricingCard 
            key={plan.id}
            plan={plan}
            index={index}
            isMobile={true}
          />
        ))}
      </div>

      {/* Desktop: Grid Layout */}
      <div className="hidden lg:block mt-10" data-section="pricing-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, index) => (
            <div key={plan.id} className="relative">
              <PricingCard 
                plan={plan}
                index={index}
                isMobile={false}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}