'use client';

import { Check, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { 
  HEARING_SERVICE_PLANS, 
  getHearingPlanColorClasses, 
  formatHearingPrice, 
  generateContactUrl,
  type HearingServicePlanId 
} from '@/config/hearing-service';

const PricingCard = ({ planId }: { planId: HearingServicePlanId }) => {
  const plan = HEARING_SERVICE_PLANS[planId];
  const IconComponent = plan.icon;
  
  return (
    <div
      className={`aio-surface relative border hover:shadow-xl transition-all duration-300 h-full flex flex-col ${
        plan.popular
          ? 'border-[5px] border-blue-400 pt-10 pb-8 px-6'
          : 'border border-gray-200/70 p-6'
      }`}
    >
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white border-[5px] border-blue-400 px-7 py-3 rounded-full shadow-lg flex items-center gap-3">
            <Crown className="w-6 h-6 text-blue-700" strokeWidth={2.2} />
            <span className="text-sm font-bold text-blue-800">人気</span>
          </div>
        </div>
      )}
      
      <div className="text-center mb-8">
        {/* アイコン */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg bg-[var(--aio-primary)]">
          <IconComponent className="w-8 h-8 text-[var(--text-on-primary)]" />
        </div>
        
        {/* プラン名・説明 */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>
        
        {/* 価格 */}
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">
            {formatHearingPrice(plan)}
          </span>
          <span className="text-gray-600 ml-1">（税別）</span>
          {plan.badge && (
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-[var(--aio-primary)]">
                {plan.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 機能リスト */}
      <ul className="space-y-4 mb-8 flex-1">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-[var(--aio-primary)]" />
            <span className="text-sm text-gray-900">{feature}</span>
          </li>
        ))}
        
        {plan.limitations.map((limitation, index) => (
          <li key={index} className="flex items-start opacity-70">
            <div className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-center text-sm text-gray-400">×</div>
            <span className="text-sm text-gray-400">{limitation}</span>
          </li>
        ))}
      </ul>

      {/* CTAボタン */}
      <div className="text-center mt-auto">
        <Link
          href={generateContactUrl(planId)}
          className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-bold rounded-xl transition-all duration-300 bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-[var(--text-on-primary)] border-none shadow-lg hover:shadow-xl"
        >
          {plan.ctaText}
        </Link>
      </div>
    </div>
  );
};

export default function PricingSection() {
  const planIds: HearingServicePlanId[] = ['light', 'advance', 'full', 'continuous'];
  
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      {/* セクションヘッダー */}
      <div className="text-center mb-16 section-heading-top">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          シンプルで
          <span className="text-[var(--aio-primary)]">
            透明な料金
          </span>
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          対話を通じて企業価値を第三者視点で整理し、AIに理解されやすい構造データとして言語化します。
        </p>
      </div>

      {/* 料金プラン */}
      <>
        {/* Mobile: Horizontal Scroll */}
        <div className="lg:hidden mobile-scroll pricing-scroll">
          {planIds.map((planId) => (
            <div key={planId} className="min-w-[78%] snap-center lg:min-w-0">
              <PricingCard planId={planId} />
            </div>
          ))}
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden lg:block mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {planIds.map((planId) => (
              <div key={planId} className="relative">
                <PricingCard planId={planId} />
              </div>
            ))}
          </div>
        </div>
      </>

      {/* 追加情報 */}
      <div className="text-center mt-16 max-w-4xl mx-auto space-y-2">
        <p className="text-xl font-bold text-gray-900 mb-4">
          すべてのプランに14日間の無料体験が含まれています
        </p>
        <p className="text-gray-600 mb-6 leading-relaxed">
          お取り組みを通じて、ChatGPT検索・AI要約での企業情報の発見性向上を目指します。
        </p>
        <p className="text-sm text-gray-500">
          ✓ お見積もりは無料です　✓ お気軽にお問い合わせください　✓ 全国対応
        </p>
      </div>
    </div>
  );
}