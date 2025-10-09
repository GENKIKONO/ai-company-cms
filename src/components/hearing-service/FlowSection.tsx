'use client';

import { FileText, MessageCircle, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            シンプルな3ステップ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            複雑な作業は一切不要。専門スタッフがすべて代行し、<br className="hidden md:block" />
            あなたの企業情報をAI時代に最適な形でお届けします。
          </p>
        </div>

        {/* フローステップ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {flowSteps.map((step, index) => {
            const colors = getColorClasses(step.color);
            const IconComponent = step.icon;
            
            return (
              <div key={step.step} className="relative">
                {/* 接続線（デスクトップのみ） */}
                {index < flowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 -right-6 w-12 h-px bg-gray-300">
                    <ArrowRight className="absolute -top-2 right-0 w-4 h-4 text-gray-400" />
                  </div>
                )}
                
                <div className={`relative bg-white border-2 ${colors.border} rounded-2xl p-8 hover:shadow-lg transition-all duration-300 group`}>
                  {/* ステップ番号 */}
                  <div className={`absolute -top-4 left-8 w-8 h-8 ${colors.step} text-white rounded-full flex items-center justify-center font-bold text-sm`}>
                    {step.step}
                  </div>
                  
                  {/* アイコン */}
                  <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`w-8 h-8 ${colors.icon}`} />
                  </div>
                  
                  {/* タイトル・説明 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                  
                  {/* 詳細リスト */}
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 ${colors.accent} mt-0.5 flex-shrink-0`} />
                        <span className="text-sm text-gray-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Before/After セクション */}
        <div className="mt-20 bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 lg:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              構造化前後の違い
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ヒアリングによってあなたの企業情報がどのように変わるかをご覧ください
            </p>
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
              <div className="mt-4 text-xs text-red-600 text-center">
                ❌ 抽象的で検索されにくい
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
              <div className="mt-4 text-xs text-green-600 text-center">
                ✅ 具体的でAIが理解しやすい
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}