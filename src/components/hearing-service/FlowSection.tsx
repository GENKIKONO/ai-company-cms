'use client';

import { FileText, MessageCircle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import HorizontalScroller from '@/components/ui/HorizontalScroller';
import StatCard from '@/components/ui/StatCard';

const flowSteps = [
  {
    step: 1,
    title: '申し込み',
    description: '専用フォームから簡単お申し込み。基本情報をご入力いただきます。',
    icon: FileText,
    details: [
      '会社の基本情報入力',
      'ヒアリング希望日選択',
      '重点的に聞きたい内容の選択'
    ],
    color: 'blue'
  },
  {
    step: 2,
    title: 'ヒアリング（60分）',
    description: '専任スタッフが企業の魅力を深掘り。オンライン・対面どちらでも対応可能。',
    icon: MessageCircle,
    details: [
      '事業概要・サービス詳細',
      '競合優位性・差別化ポイント',
      'ターゲット市場・顧客事例'
    ],
    color: 'purple'
  },
  {
    step: 3,
    title: 'AI最適化・公開',
    description: 'ヒアリング内容をAI理解に最適な構造で整理し、CMSに登録・公開します。',
    icon: Sparkles,
    details: [
      'AI理解最適化構造での整理',
      'CMS登録・設定完了',
      '検索性向上・発見性改善'
    ],
    color: 'indigo'
  }
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      step: 'bg-blue-600',
      accent: 'text-blue-600'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'text-purple-600',
      step: 'bg-purple-600',
      accent: 'text-purple-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      icon: 'text-indigo-600',
      step: 'bg-indigo-600',
      accent: 'text-indigo-600'
    }
  };
  return colors[color as keyof typeof colors];
};

export default function FlowSection() {
  return (
    <section className="bg-white" style={{paddingBlock: 'clamp(2.5rem, 4vw, 5rem)'}}>
      <div className="center-col">
        {/* セクションヘッダー */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="measure-lead mx-auto">
            <h2 className="ui-h2 jp-heading text-gray-900 tracking-tight mb-6">
              シンプルな3ステップ
            </h2>
            <p className="copy text-[15px] sm:text-base leading-7 sm:leading-8 text-gray-600">
              複雑な作業は一切不要。専門スタッフがすべて代行し、あなたの企業情報をAI時代に最適な形でお届けします。
            </p>
          </div>
        </div>

        {/* フローステップ */}
        <div className="mb-16 sm:mb-20">
          <HorizontalScroller ariaLabel="ヒアリング代行の流れ" className="lg:grid-cols-3" showHintOnce={true}>
            {flowSteps.map((step, index) => {
              const colors = getColorClasses(step.color);
              const IconComponent = step.icon;
              
              return (
                <div key={step.step} className="step-card relative overflow-visible snap-center min-w-[85%] sm:min-w-0">
                  {/* Step Badge - positioned outside to prevent clipping */}
                  <div className="step-badge absolute -top-4 -left-4 z-10 pointer-events-none">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${colors.step} text-white text-sm font-semibold ring-4 ring-white shadow-md`}>
                      {step.step}
                    </span>
                  </div>
                  
                  {/* Inner card panel with fixed border and ring states */}
                  <div className={`
                    relative rounded-2xl bg-white shadow-sm overflow-hidden h-full p-5 sm:p-6 lg:p-7
                    border border-blue-200/60
                    ring-0 hover:ring-2 hover:ring-blue-300/60
                    focus:ring-2 focus:ring-blue-400/60
                    aria-[selected=true]:ring-2 aria-[selected=true]:ring-blue-500
                    transition-shadow duration-300 group
                  `}>
                    
                    {/* アイコン */}
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-4 sm:mb-6 motion-reduce:transition-none group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 sm:w-8 sm:h-8 ${colors.icon}`} />
                    </div>
                    
                    {/* タイトル・説明 */}
                    <h3 className="jp-heading text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                    <p className="jp-body text-[15px] sm:text-base text-gray-600 mb-4 sm:mb-6 leading-6 sm:leading-7">{step.description}</p>
                    
                    {/* 詳細リスト */}
                    <ul className="space-y-2 sm:space-y-2.5">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2">
                          <CheckCircle className={`w-4 h-4 ${colors.accent} mt-0.5 flex-shrink-0`} />
                          <span className="text-[13px] sm:text-sm text-gray-700 leading-5">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </HorizontalScroller>
        </div>

        {/* Before/After セクション */}
        <div className="section-gap bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <div className="measure-lead mx-auto">
              <h3 className="jp-heading text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                構造化前後の違い
              </h3>
              <p className="copy text-gray-600">
                ヒアリングによってあなたの企業情報がどのように変わるかをご覧ください
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Before */}
            <div className="bg-white rounded-2xl p-6 border-2 border-red-200">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  構造化前
                </span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-gray-100 rounded p-3">
                  "弊社は総合的なITソリューションを提供しています..."
                </div>
                <div className="bg-gray-100 rounded p-3">
                  "様々な業界のお客様にご利用いただいております..."
                </div>
                <div className="bg-gray-100 rounded p-3">
                  "高品質なサービスで満足度向上を実現..."
                </div>
              </div>
              <div className="mt-4 text-xs text-red-600 text-center flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m15 9-6 6"></path>
                  <path d="m9 9 6 6"></path>
                </svg>
                抽象的で検索されにくい
              </div>
            </div>

            {/* After */}
            <div className="bg-white rounded-2xl p-6 border-2 border-green-200">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  構造化後
                </span>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="bg-blue-50 rounded p-3 border-l-4 border-blue-400">
                  <strong>対象業界:</strong> 製造業・小売業・サービス業<br />
                  <strong>主力サービス:</strong> ECサイト構築・在庫管理システム
                </div>
                <div className="bg-purple-50 rounded p-3 border-l-4 border-purple-400">
                  <strong>導入実績:</strong> 中小企業への豊富な導入経験<br />
                  <strong>特徴:</strong> 短期間での効果実現を重視
                </div>
                <div className="bg-indigo-50 rounded p-3 border-l-4 border-indigo-400">
                  <strong>差別化:</strong> ノーコード対応・24時間サポート<br />
                  <strong>価格:</strong> 月額5万円〜・初期費用無料
                </div>
              </div>
              <div className="mt-4 text-xs text-green-600 text-center flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                具体的でAIが理解しやすい
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}