import { Metadata } from 'next';

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
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              サービス概要
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              AIO Hub AI企業CMSは、AI技術を活用した企業情報の統合管理プラットフォームです
            </p>
          </div>

          <div className="prose prose-lg mx-auto">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">主な機能</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">🏢 企業情報管理</h3>
                  <p className="text-gray-600">企業の基本情報、サービス、導入事例、FAQを一元管理できます。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">🔍 SEO最適化</h3>
                  <p className="text-gray-600">JSON-LD構造化データ自動生成により、検索エンジン最適化を実現します。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">🤖 AIが読み取りやすい構造で自動出力</h3>
                  <p className="text-gray-600">入力された情報をもとに、AI検索に最適な構造化データ・フィードを自動生成します。</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">📊 詳細分析</h3>
                  <p className="text-gray-600">アクセス解析とパフォーマンス監視で、データドリブンな改善が可能です。</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">技術スタック</h2>
              <ul className="space-y-2">
                <li><strong>フロントエンド:</strong> Next.js 15 (App Router)</li>
                <li><strong>バックエンド:</strong> Supabase (PostgreSQL + Auth + Storage)</li>
                <li><strong>スタイリング:</strong> Tailwind CSS</li>
                <li><strong>型安全性:</strong> TypeScript</li>
              </ul>
            </section>

            <div className="text-center mt-12">
              <a 
                href="/auth/signup"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                無料で始める
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}