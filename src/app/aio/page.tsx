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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">📄 JSON-LD構造化データ</h3>
                  <p className="text-gray-600 text-sm">Organization、Service、Article、FAQPageなどのSchema.org準拠データを自動生成</p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">🗺️ サイトマップ</h3>
                  <p className="text-gray-600 text-sm">sitemap.xml、sitemap-images.xml、sitemap-news.xmlを動的生成</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">📡 RSS/Atomフィード</h3>
                  <p className="text-gray-600 text-sm">全記事フィード（/feed.xml）と企業別フィード（/o/[slug]/feed.xml）を提供</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">🔌 OpenAPI 3.1</h3>
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
                  <li>✅ AI検索エンジンでの表示率向上</li>
                  <li>✅ リッチリザルト（Rich Results）対応</li>
                  <li>✅ 企業情報の正確な理解・抽出</li>
                  <li>✅ 音声検索での適切な回答生成</li>
                  <li>✅ 検索エンジンクローラーの効率的な情報収集</li>
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