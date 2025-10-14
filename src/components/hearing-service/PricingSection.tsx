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

        {/* CTAボタン */}
        <Link
          href={generateContactUrl(planId)}
          className={`btn btn-large w-full text-center ${colors.button}`}
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
    <section id="pricing" className="section bg-subtle">
      <div className="container">
        {/* セクションヘッダー */}
        <div className="mb-12 lg:mb-16">
          <h2 className="text-h2 text-neutral-900 mb-6 text-center text-balance">
            <span className="block jp-text">ヒアリング代行で"AIに選ばれる"企業情報を、短期間で。</span>
          </h2>
          <p className="text-body-large text-center text-neutral-600 mx-auto max-w-3xl jp-text text-pretty">
            AI時代の広報・採用・B2Bに効く情報を、ヒアリングで棚卸し→構造化。<br />
            目的と深度で選べる4つのプランをご用意しました。
          </p>
        </div>

        {/* 料金プラン */}
        <div className="mb-12 lg:mb-16">
          {/* Mobile: Carousel */}
          <div className="lg:hidden">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
              {planIds.map((planId) => (
                <div key={planId} className="relative flex-shrink-0 w-80 snap-center">
                  <PricingCard planId={planId} />
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-16 max-w-7xl mx-auto">
            {planIds.map((planId) => (
              <div key={planId} className="relative">
                <PricingCard planId={planId} />
              </div>
            ))}
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-12 lg:mt-16 text-center">
          <div className="card p-6 lg:p-8 max-w-4xl mx-auto">
            <h3 className="text-h3 text-neutral-900 mb-6 jp-text text-balance">料金に関する補足</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-neutral-700">
              <div className="space-y-4 text-left">
                <h4 className="text-lg font-semibold text-neutral-900 jp-text">含まれるもの</h4>
                <ul className="space-y-2">
                  <li className="text-body jp-text">• 消費税別の価格表示</li>
                  <li className="text-body jp-text">• 事前お見積もり無料</li>
                  <li className="text-body jp-text">• オンライン・対面対応</li>
                  <li className="text-body jp-text">• 成果物の著作権譲渡</li>
                </ul>
              </div>
              <div className="space-y-4 text-left">
                <h4 className="text-lg font-semibold text-neutral-900 jp-text">お支払い・契約</h4>
                <ul className="space-y-2">
                  <li className="text-body jp-text">• 銀行振込・クレジットカード対応</li>
                  <li className="text-body jp-text">• 継続プランはいつでも解約可能</li>
                  <li className="text-body jp-text">• 最低契約期間3ヶ月から（継続プランのみ）</li>
                  <li className="text-body jp-text">• 追加作業は事前お見積もり</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}