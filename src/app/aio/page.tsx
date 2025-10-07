import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AIOとは | AIO Hub AI企業CMS',
  description: 'AIO（AI Overviews）とは何か。AI検索に最適化された構造化データについて詳しく解説します。',
  keywords: ['AIO', 'AI Overviews', '構造化データ', 'JSON-LD', 'SEO', 'AI検索'],
};

export default function AIOPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'AIOとは - AI検索に最適化された構造化データ',
    description: 'AIO（AI Overviews）について、実装している構造化データ技術とその効果を解説',
    url: 'https://aiohub.jp/aio',
    datePublished: '2025-01-01',
    dateModified: '2025-01-01',
    author: {
      '@type': 'Organization',
      name: 'AIO Hub',
      url: 'https://aiohub.jp'
    },
    publisher: {
      '@type': 'Organization',
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
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              AIOとは
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              AI検索に最適化された構造化データについて解説します
            </p>
          </div>

          <div className="prose prose-lg mx-auto">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AIO（AI Overviews）について</h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                AIO（AI Overviews）とは、AI検索エンジンが理解しやすい形式でWebサイトの情報を構造化する技術です。
                従来のSEOに加えて、AIによる情報理解と検索結果表示の最適化を実現します。
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">本プラットフォームで実装しているAIO要素</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    JSON-LD構造化データ
                  </h3>
                  <p className="text-gray-600 text-sm">Organization、Service、Article、FAQPageなどのSchema.org準拠データを自動生成</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    サイトマップ
                  </h3>
                  <p className="text-gray-600 text-sm">sitemap.xml、sitemap-images.xml、sitemap-news.xmlを動的生成</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    RSS/Atomフィード
                  </h3>
                  <p className="text-gray-600 text-sm">全記事フィード（/feed.xml）と企業別フィード（/o/[slug]/feed.xml）を提供</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    OpenAPI 3.1
                  </h3>
                  <p className="text-gray-600 text-sm">完全なAPIスキーマを/api/public/openapi.jsonで公開</p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI可読性の特徴</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  <span><strong>セマンティックHTML:</strong> main、nav、footer構造とARIA対応で機械可読性を向上</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  <span><strong>メタデータ最適化:</strong> 各ページのgenerateMetadata()でtitle、description、canonicalを動的設定</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  <span><strong>構造化された情報階層:</strong> 企業→サービス→導入事例→FAQの明確な関係性</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 font-bold mr-2">•</span>
                  <span><strong>キャッシュ戦略:</strong> 公開APIは5分キャッシュで高速レスポンス</span>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">効果</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    AI検索エンジンでの表示率向上
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    リッチリザルト（Rich Results）対応
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    企業情報の正確な理解・抽出
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    音声検索での適切な回答生成
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    検索エンジンクローラーの効率的な情報収集
                  </li>
                </ul>
              </div>
            </section>

            <div className="text-center mt-12 bg-blue-50 p-8 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AIO最適化されたプラットフォームを今すぐ体験
              </h3>
              <p className="text-gray-600 mb-6">
                すべての構造化データが自動生成される企業情報管理システムです
              </p>
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