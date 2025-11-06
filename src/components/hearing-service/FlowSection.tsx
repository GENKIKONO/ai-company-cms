'use client';

import { FileText, MessageCircle, Sparkles, CheckCircle } from 'lucide-react';

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
    ]
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
    ]
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
    ]
  }
];

export default function FlowSection() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-20 section-heading-top">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          シンプルな
          <span className="text-[var(--aio-primary)]">
            3ステップ
          </span>
          で
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          複雑な作業は一切不要。専門スタッフがすべて代行し、あなたの企業情報をAI時代に最適な形でお届けします。
        </p>
      </div>

      <div className="mobile-scroll lg:grid lg:grid-cols-3 lg:gap-12">
        {flowSteps.map((step, index) => {
          const IconComponent = step.icon;
          
          return (
            <div 
              key={step.step} 
              className="min-w-[85%] snap-center lg:min-w-0 relative group"
            >
              {/* 接続線（デスクトップのみ） */}
              {index < flowSteps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-6 w-6 h-0.5 bg-gray-300 z-0"></div>
              )}
              
              <div className="aio-surface relative p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full">
                <div className="text-center mb-6">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--aio-primary)] text-[var(--text-on-primary)] shadow-lg mb-4">
                    <span className="text-2xl font-bold">{step.step}</span>
                  </div>
                  
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--aio-primary)] text-[var(--text-on-primary)] shadow-md -mt-2 ml-4">
                    <IconComponent className="h-6 w-6" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 text-center mb-8 leading-relaxed">
                  {step.description}
                </p>
                
                <ul className="space-y-3">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-[var(--aio-primary)] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16 pb-12 lg:pb-16 text-center">
        <div className="inline-flex items-center justify-center px-6 py-3 bg-blue-50 rounded-full border border-blue-200">
          <CheckCircle className="h-5 w-5 text-[var(--aio-primary)] mr-2" />
          <span className="text-[var(--aio-primary)] font-medium">
            平均3日以内に構造化完了・即座にAI検索対応
          </span>
        </div>
      </div>
    </div>
  );
}