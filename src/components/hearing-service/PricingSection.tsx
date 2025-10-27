'use client';

import { Check, Zap } from 'lucide-react';
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
  const colors = getHearingPlanColorClasses(plan.color);
  const IconComponent = plan.icon;
  
  return (
    <>
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
            <Zap className="w-4 h-4" />
            <span className="jp-text">おすすめ</span>
          </span>
        </div>
      )}
      
      <div className={`card h-full ${plan.popular ? 'ring-2 ' + colors.ring + ' ring-offset-2' : ''}`}>
        {/* プランヘッダー */}
        <div className="text-center mb-6 sm:mb-8">
          {/* バッジ */}
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${colors.accent} bg-opacity-10`}>
              {plan.badge}
            </span>
          </div>
          
          {/* アイコン */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.accent}`} />
          </div>
          
          {/* プラン名・説明 */}
          <h3 className="text-h3 text-neutral-900 mb-2 jp-text">{plan.name}</h3>
          <p className="text-body text-neutral-600 mb-4 jp-text text-pretty">{plan.description}</p>
          
          {/* 価格 */}
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-h1 text-neutral-900 tabular-nums">{formatHearingPrice(plan)}</span>
            <span className="text-body text-neutral-600 jp-text">（税別）</span>
          </div>
          <div className="text-sm text-neutral-600 jp-text">
            {plan.duration} / {plan.period}
          </div>
        </div>

        {/* 機能リスト */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-body text-neutral-700 jp-text text-pretty">{feature}</span>
            </div>
          ))}
          
          {plan.limitations.map((limitation, index) => (
            <div key={index} className="flex items-start gap-3 opacity-70">
              <div className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0 text-center text-sm">×</div>
              <span className="text-body text-neutral-500 jp-text text-pretty">{limitation}</span>
            </div>
          ))}
        </div>

        {/* CTAボタン - Apple HIG 44px準拠 */}
        <Link
          href={generateContactUrl(planId)}
          className={`btn-apple ${colors.button} w-full text-center py-4 px-6 text-lg font-semibold transform hover:scale-105 transition-transform btn-lg`}
          rel="noopener noreferrer"
        >
          <span className="jp-text">{plan.ctaText}</span>
        </Link>
      </div>
    </>
  );
};

export default function PricingSection() {
  const planIds: HearingServicePlanId[] = ['light', 'advance', 'full', 'continuous'];
  
  return (
    <section id="pricing" className="py-24 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            シンプルで
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              透明な料金
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            対話を通じて企業価値を第三者視点で整理し、AIに理解されやすい構造データとして言語化します。
          </p>
        </div>

        {/* 料金プラン */}
        <div className="mb-20">
          {/* Mobile: Carousel */}
          <div className="lg:hidden">
            <div className="flex gap-8 overflow-x-auto pb-6 snap-x snap-mandatory px-4">
              {planIds.map((planId) => (
                <div key={planId} className="relative flex-shrink-0 w-80 snap-center">
                  <PricingCard planId={planId} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {planIds.map((planId) => (
              <div key={planId} className="relative">
                <PricingCard planId={planId} />
              </div>
            ))}
          </div>
        </div>

        {/* 追加情報 */}
        <div className="text-center">
          <div className="bg-white rounded-3xl p-8 lg:p-12 max-w-4xl mx-auto shadow-xl border border-gray-100">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-8">すべてのプランに14日間の満足保証が含まれています</h3>
            <p className="text-lg text-gray-600 mb-8">
              お取り組み開始から約1年で、ChatGPT検索・AI要約での企業情報引用率を改善します。
            </p>
            <p className="text-sm text-gray-500">
              ✓ お見積もりは無料です　✓ お気軽にお問い合わせください　✓ 全国対応
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}