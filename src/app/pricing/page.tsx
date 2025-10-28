'use client';

import { Metadata } from 'next';
import PricingTable from '@/components/pricing/PricingTable';

export const metadata: Metadata = {
  title: '料金プラン - AI最適化CMSサービス | AIO Hub',
  description: 'AIO HubのAI最適化料金プラン。無料から始められ、本格運用は月額5,000円〜。JSON-LD自動生成とCMS管理で企業情報をAI検索に最適化。',
  keywords: ['料金プラン', 'AIO', 'JSON-LD', '構造化データ', 'AI最適化', 'CMS'],
};

export default function PricingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '料金プラン',
    description: 'AIO Hub AI最適化CMSの料金プラン。無料から企業向けプランまで。',
    url: 'https://aiohub.jp/pricing',
    isPartOf: {
      '@type': 'WebSite',
      name: 'AIO Hub',
      url: 'https://aiohub.jp'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white">
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 section-spacing">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-8 text-sm font-semibold text-gray-700 shadow-lg">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
              料金プラン
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="text-blue-600">
                シンプルで明確な
              </span>
              <br />
              料金体系
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              無料から始めて、必要になったら拡張。<br />
              最小の入力で、Schema.org準拠の企業情報構造化を実現します。
            </p>
          </div>
          
          <PricingTable />
        </div>
      </div>
    </>
  );
}