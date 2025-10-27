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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12),transparent_60%)]" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-full px-6 py-3 mb-10 text-sm font-semibold text-gray-700 shadow-lg">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
              サービス概要
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI企業CMS
              </span>
              <br />
              プラットフォーム
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-16 leading-relaxed max-w-4xl mx-auto">
              AI技術を活用した企業情報の統合管理プラットフォーム。
              <br />
              構造化データで検索性を飛躍的に向上させます。
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-gradient-to-b from-white via-gray-50/30 to-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  主な機能
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                AI時代に対応した企業情報管理の核となる機能群
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">企業情報管理</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    企業の基本情報、サービス、導入事例、FAQを一元管理できます。
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">SEO最適化</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    JSON-LD構造化データ自動生成により、検索エンジン最適化を実現します。
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">AI最適化出力</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    入力された情報をもとに、AI検索に最適な構造化データ・フィードを自動生成します。
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>

              <div className="group relative bg-white rounded-3xl p-8 border border-gray-200/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">詳細分析</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    アクセス解析とパフォーマンス監視で、データドリブンな改善が可能です。
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-slate-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  技術スタック
                </span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                最新技術による高性能・高信頼性のプラットフォーム
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">FE</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">フロントエンド</h3>
                  <p className="text-gray-600 text-sm">Next.js 15 (App Router)</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">BE</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">バックエンド</h3>
                  <p className="text-gray-600 text-sm">Supabase (PostgreSQL + Auth + Storage)</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">UI</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">スタイリング</h3>
                  <p className="text-gray-600 text-sm">Tailwind CSS</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">TS</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">型安全性</h3>
                  <p className="text-gray-600 text-sm">TypeScript</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              今すぐ始めましょう
            </h2>
            <p className="text-xl mb-12 opacity-90">
              14日間の無料体験で、AI最適化の効果を実感してください
            </p>
            
            <PrimaryCTA 
              href="/auth/signup"
              size="large"
              className="text-xl px-10 py-5 bg-white text-blue-600 hover:bg-gray-50 border-none shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl font-semibold"
            >
              無料で始める
            </PrimaryCTA>
          </div>
        </section>
      </div>
    </>
  );
}