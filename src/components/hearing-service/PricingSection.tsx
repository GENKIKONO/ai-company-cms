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
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    purple: {
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700 text-white'
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
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <span className="badge badge-primary">
            <Zap className="w-4 h-4" />
            <span className="jp-text">おすすめ</span>
          </span>
        </div>
      )}
      
      <div className={`card h-full ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}>
        {/* プランヘッダー */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.accent}`} />
          </div>
          <h3 className="text-h3 text-neutral-900 mb-2 jp-text">{plan.name}</h3>
          <p className="text-body text-neutral-600 mb-4 jp-text">{plan.description}</p>
          
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-h1 text-neutral-900 tabular-nums">¥{plan.price}</span>
            <span className="text-body text-neutral-600 jp-text">/ {plan.period}</span>
          </div>
        </div>

        {/* 機能リスト */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-body text-neutral-700 jp-text">{feature}</span>
            </div>
          ))}
          
          {plan.limitations.map((limitation, index) => (
            <div key={index} className="flex items-start gap-3 opacity-70">
              <div className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 flex-shrink-0 text-center text-sm">×</div>
              <span className="text-body text-neutral-500 jp-text">{limitation}</span>
            </div>
          ))}
        </div>

        {/* CTAボタン */}
        <Link
          href="/dashboard"
          className={`btn btn-primary btn-large w-full text-center`}
        >
          <span className="jp-text">{plan.buttonText}</span>
        </Link>
      </div>
    </>
  );
};

export default function PricingSection() {
  return (
    <section id="pricing" className="section bg-subtle">
      <div className="container">
        {/* セクションヘッダー */}
        <div className="mb-12">
          <h2 className="text-h2 text-neutral-900 mb-6 text-center text-balance">
            <span className="block jp-text">シンプルで明確な料金体系</span>
          </h2>
          <p className="text-body-large text-center text-neutral-600 mx-auto jp-text text-pretty">
            単発のヒアリングから継続的な支援まで、お客様のニーズに合わせて選択いただけます。
          </p>
        </div>

        {/* 料金プラン */}
        <div className="mb-12">
          <div className="grid grid-2 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className="relative">
                <PricingCard plan={plan} />
              </div>
            ))}
          </div>
        </div>

        {/* 追加情報 */}
        <div className="mt-12 text-center">
          <div className="card p-6 lg:p-8 max-w-4xl mx-auto">
            <h3 className="text-h3 text-neutral-900 mb-6 jp-text text-balance">料金に関する補足</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-neutral-700">
              <div className="space-y-4 text-left">
                <h4 className="text-lg font-semibold text-neutral-900 jp-text">含まれるもの</h4>
                <ul className="space-y-2">
                  <li className="text-body jp-text">• 消費税込みの価格表示</li>
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
                  <li className="text-body jp-text">• 初回契約は目安3ヶ月から</li>
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