'use client';

import { Check, Star, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

const pricingPlans = [
  {
    name: 'シングルヒアリング',
    description: '1社向け1回限りプラン',
    price: '30,000',
    period: '1回限り',
    icon: Star,
    popular: false,
    features: [
      '60分専門ヒアリング',
      '企業情報のAI最適化構造化',
      'CMS登録・設定完了',
      '基本的なSEO最適化',
      '公開後1週間サポート',
      '成果レポート提供'
    ],
    limitations: [
      '継続的な更新サポートなし',
      '追加ヒアリングは別途料金'
    ],
    color: 'blue',
    buttonText: 'シングルプランで申し込む'
  },
  {
    name: '継続支援プラン',
    description: '継続的な最適化支援',
    price: '50,000',
    period: '月額',
    icon: Crown,
    popular: true,
    features: [
      '初回60分ヒアリング',
      '月1回の情報更新ヒアリング（30分）',
      '継続的なAI最適化',
      'コンテンツ追加・修正無制限',
      '競合分析・市場動向レポート',
      '専任担当者による優先サポート',
      'アクセス解析・改善提案',
      '年4回の戦略見直しミーティング'
    ],
    limitations: [],
    color: 'purple',
    buttonText: '継続プランで申し込む'
  }
];

const getColorClasses = (color: string, popular: boolean = false) => {
  const colors = {
    blue: {
      bg: popular ? 'bg-blue-600' : 'bg-white',
      border: 'border-blue-200',
      text: popular ? 'text-white' : 'text-gray-900',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    purple: {
      bg: popular ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-white',
      border: 'border-purple-200',
      text: popular ? 'text-white' : 'text-gray-900',
      accent: 'text-purple-600',
      button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
    }
  };
  return colors[color as keyof typeof colors];
};

const PricingCard = ({ plan }: { plan: typeof pricingPlans[0] }) => {
  const colors = getColorClasses(plan.color, plan.popular);
  const IconComponent = plan.icon;
  
  return (
    <>
      {/* 人気バッジ */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium ui-flat">
            <Zap className="w-4 h-4" />
            <span className="jp-phrase">おすすめ</span>
          </span>
        </div>
      )}
      
      <div className={`relative ${colors.bg} ${plan.popular ? 'ui-card' : 'ui-card border-2 ' + colors.border} rounded-xl p-4 sm:p-6 lg:p-8 transition-all duration-300 h-full`}>
        {/* プランヘッダー */}
        <div className="text-center mb-6 sm:mb-8">
          <div className={`media-frame w-12 h-12 sm:w-16 sm:h-16 ${plan.popular ? 'bg-white/20' : 'bg-gray-100'} rounded-xl flex items-center justify-center mx-auto mb-4`} style={{'--media-ar': '1/1'} as React.CSSProperties}>
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${plan.popular ? 'text-white' : colors.accent} media-contain`} />
          </div>
          <h3 className={`headline text-xl sm:text-2xl font-bold ${colors.text} mb-2 jp-phrase`}>{plan.name}</h3>
          <p className={`copy measure-body text-[15px] sm:text-base ${plan.popular ? 'text-white/80' : 'text-gray-600'} mb-4 text-center jp-phrase`}>{plan.description}</p>
          
          <div className="flex items-baseline justify-center gap-1 price-nowrap">
            <span className={`text-3xl sm:text-4xl font-bold ${colors.text} tabular-nums`}>¥{plan.price}</span>
            <span className={`text-sm sm:text-base ${plan.popular ? 'text-white/80' : 'text-gray-600'} jp-phrase`}>/ {plan.period}</span>
          </div>
        </div>

        {/* 機能リスト */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-white' : 'text-green-500'} mt-0.5 flex-shrink-0`} />
              <span className={`copy text-[13px] sm:text-sm ${plan.popular ? 'text-white/90' : 'text-gray-700'} jp-phrase`}>{feature}</span>
            </div>
          ))}
          
          {plan.limitations.map((limitation, index) => (
            <div key={index} className="flex items-start gap-3 opacity-70">
              <div className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'text-white' : 'text-gray-400'} mt-0.5 flex-shrink-0 text-center text-sm`}>×</div>
              <span className={`copy text-[13px] sm:text-sm ${plan.popular ? 'text-white/70' : 'text-gray-500'} jp-phrase`}>{limitation}</span>
            </div>
          ))}
        </div>

        {/* CTAボタン */}
        <Link
          href="/dashboard"
          className={`cta-nowrap block w-full text-center px-6 py-3 min-h-[44px] ${colors.button} rounded-lg font-medium transition-colors duration-200`}
        >
          <span className="jp-phrase">{plan.buttonText}</span>
        </Link>
      </div>
    </>
  );
};

export default function PricingSection() {
  return (
    <section id="pricing" className="section-layer section-safe-top section-safe-btm surface-fade-top bg-gray-50 section-gap">
      <div className="container-article section-content">
        {/* セクションヘッダー */}
        <div className="section-gap">
          <h2 className="headline heading-guard-top heading-guard-btm text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center">
            <span className="block jp-phrase">シンプルで明確な料金体系</span>
          </h2>
          <p className="copy measure-lead text-center text-gray-600 mx-auto jp-phrase">
            単発のヒアリングから継続的な支援まで、お客様のニーズに合わせて選択いただけます。
          </p>
        </div>

        {/* 料金プラン */}
        <div className="section-gap">
          <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="relative">
                <PricingCard plan={plan} />
              </div>
            ))}
          </div>
        </div>

        {/* 追加情報 */}
        <div className="section-gap section-safe-top section-safe-btm text-center">
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 ui-flat max-w-4xl mx-auto">
            <h3 className="headline text-lg sm:text-xl font-bold text-gray-900 mb-4 jp-phrase">料金に関する補足</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-[13px] sm:text-sm text-gray-700">
              <div className="space-y-2 text-left">
                <h4 className="headline font-semibold text-gray-900 jp-phrase">含まれるもの</h4>
                <ul className="space-y-1">
                  <li className="copy jp-phrase">• 消費税込みの価格表示</li>
                  <li className="copy jp-phrase">• 事前お見積もり無料</li>
                  <li className="copy jp-phrase">• オンライン・対面対応</li>
                  <li className="copy jp-phrase">• 成果物の著作権譲渡</li>
                </ul>
              </div>
              <div className="space-y-2 text-left">
                <h4 className="headline font-semibold text-gray-900 jp-phrase">お支払い・契約</h4>
                <ul className="space-y-1">
                  <li className="copy jp-phrase">• 銀行振込・クレジットカード対応</li>
                  <li className="copy jp-phrase">• 継続プランはいつでも解約可能</li>
                  <li className="copy jp-phrase">• 初回契約は最低3ヶ月から</li>
                  <li className="copy jp-phrase">• 追加作業は事前お見積もり</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}