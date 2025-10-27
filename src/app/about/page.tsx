import { Metadata } from 'next';
import { PrimaryCTA } from '@/design-system';

export const metadata: Metadata = {
  title: 'サービス概要 | AIO Hub AI企業CMS',
  description: 'AIO Hub AI企業CMSのサービス概要。AI技術を活用した企業情報の統合管理プラットフォームについて詳しくご説明します。',
  keywords: ['AI', 'CMS', '企業管理', 'サービス概要', 'DX'],
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'サービス概要',
    description: 'AIO Hub AI企業CMSのサービス概要',
    url: 'https://aiohub.jp/about',
    isPartOf: {
      '@type': 'WebSite',
      name: 'AIO Hub AI企業CMS',
      url: 'https://aiohub.jp'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">
              サービス概要
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              AIO Hub AI企業CMSは、AI技術を活用した企業情報の統合管理プラットフォームです
            </p>
          </div>

          <div className="prose prose-lg mx-auto">
            <section className="hig-section">
              <div className="hig-container">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">主な機能</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    企業情報管理
                  </h3>
                  <p className="text-slate-600">企業の基本情報、サービス、導入事例、FAQを一元管理できます。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    SEO最適化
                  </h3>
                  <p className="text-slate-600">JSON-LD構造化データ自動生成により、検索エンジン最適化を実現します。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AIが読み取りやすい構造で自動出力
                  </h3>
                  <p className="text-slate-600">入力された情報をもとに、AI検索に最適な構造化データ・フィードを自動生成します。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-slate-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    詳細分析
                  </h3>
                  <p className="text-slate-600">アクセス解析とパフォーマンス監視で、データドリブンな改善が可能です。</p>
                </div>
              </div>
              </div>
            </section>

            <section className="hig-section">
              <div className="hig-container">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">技術スタック</h2>
              <ul className="space-y-2">
                <li><strong>フロントエンド:</strong> Next.js 15 (App Router)</li>
                <li><strong>バックエンド:</strong> Supabase (PostgreSQL + Auth + Storage)</li>
                <li><strong>スタイリング:</strong> Tailwind CSS</li>
                <li><strong>型安全性:</strong> TypeScript</li>
              </ul>
              </div>
            </section>

            <div className="text-center mt-12">
              <PrimaryCTA 
                href="/auth/signup"
                size="large"
              >
                無料で始める
              </PrimaryCTA>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}