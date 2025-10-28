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
  const IconComponent = plan.icon;
  
  return (
    <div
      className={`relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/60 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 min-h-[600px] flex flex-col ${
        plan.popular
          ? 'ring-2 ring-blue-500/30 ring-offset-2 ring-offset-transparent scale-105'
          : ''
      }`}
    >
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            人気
          </div>
        </div>
      )}
      
      <div className="text-center mb-8">
        {/* アイコン */}
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg ${
          plan.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
          plan.color === 'purple' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
          plan.color === 'gold' ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
          'bg-gradient-to-br from-green-500 to-green-600'
        }`}>
          <IconComponent className="w-8 h-8 text-white" />
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
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
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
            <Check className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-green-500" />
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
          className="inline-flex items-center justify-center w-full px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] text-white border-none shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
    <section id="pricing" className="section-spacing bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            シンプルで
            <span className="bg-gradient-to-r from-[var(--bg-primary)] to-blue-600 bg-clip-text text-transparent">
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
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {planIds.map((planId) => (
                <div key={planId} className="relative">
                  <PricingCard planId={planId} />
                </div>
              ))}
            </div>
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