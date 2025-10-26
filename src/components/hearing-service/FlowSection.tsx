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


export default function FlowSection() {
  return (
    <section className="apple-section apple-section-alt">
      <div className="apple-container">
        {/* セクションヘッダー */}
        <div className="apple-section-header">
          <h2 className="apple-title1">シンプルな3ステップ</h2>
          <p className="apple-body-large apple-text-secondary">
            複雑な作業は一切不要。専門スタッフがすべて代行し、あなたの企業情報をAI時代に最適な形でお届けします。
          </p>
        </div>

        {/* フローステップ - Apple式3カードグリッド */}
        <div className="apple-features-grid">
          {flowSteps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={step.step} className="apple-feature-card">
                {/* ステップアイコン */}
                <div className="apple-feature-icon">
                  <IconComponent />
                </div>
                
                {/* ステップ番号とタイトル */}
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-lg font-bold">
                      {step.step}
                    </span>
                    <h3 className="apple-title3">{step.title}</h3>
                  </div>
                </div>
                
                {/* 説明 */}
                <p className="apple-body apple-text-secondary text-center mb-6">{step.description}</p>
                
                {/* 詳細リスト */}
                <ul className="apple-feature-list">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="apple-feature-item">
                      <CheckCircle className="apple-feature-check" />
                      <span className="apple-body">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}