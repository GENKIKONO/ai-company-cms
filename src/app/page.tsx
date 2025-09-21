import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                LuxuCare AI企業CMS
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                ログイン
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                無料で始める
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        {/* ヒーローセクション */}
        <section className="relative py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                企業情報を
                <span className="text-blue-600">スマートに管理</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                LuxuCare AI企業CMSで、企業情報・サービス・導入事例を効率的に管理。
                検索機能やデータ分析で、ビジネスの成長をサポートします。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 text-center">
                  無料で始める
                </Link>
                <Link href="/organizations" className="px-8 py-3 border border-gray-300 text-gray-700 text-lg rounded-lg hover:bg-gray-50 text-center">
                  企業ディレクトリを見る
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 機能紹介 */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                主要機能
              </h2>
              <p className="text-lg text-gray-600">
                企業管理に必要なすべての機能を1つのプラットフォームで
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 企業管理 */}
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  企業管理
                </h3>
                <p className="text-gray-600">
                  企業情報の登録・編集・管理を直感的なインターフェースで効率化
                </p>
              </div>

              {/* サービス管理 */}
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  サービス管理
                </h3>
                <p className="text-gray-600">
                  提供サービスの詳細情報、価格、機能リストを体系的に管理
                </p>
              </div>

              {/* 導入事例管理 */}
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  導入事例管理
                </h3>
                <p className="text-gray-600">
                  成功事例と成果指標を整理し、営業・マーケティングに活用
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 統計情報 */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                プラットフォーム統計
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
                <div className="text-gray-600">登録企業数</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">5,000+</div>
                <div className="text-gray-600">サービス情報</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">2,500+</div>
                <div className="text-gray-600">導入事例</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">50+</div>
                <div className="text-gray-600">業界カテゴリ</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              今すぐ始めましょう
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              無料プランでLuxuCare AI企業CMSの機能をお試しください
            </p>
            <Link href="/auth/signup" className="px-8 py-3 bg-white text-blue-600 text-lg rounded-lg hover:bg-gray-100">
              無料アカウント作成
            </Link>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">LuxuCare AI企業CMS</h3>
              <p className="text-gray-400">
                企業情報管理の新しいスタンダード
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">機能</h4>
              <ul className="space-y-2 text-gray-400">
                <li>企業管理</li>
                <li>サービス管理</li>
                <li>導入事例管理</li>
                <li>統合検索</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">リンク</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/organizations">企業ディレクトリ</Link></li>
                <li><Link href="/search">検索</Link></li>
                <li><Link href="/dashboard">ダッシュボード</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-gray-400">
                <li>ヘルプセンター</li>
                <li>お問い合わせ</li>
                <li>利用規約</li>
                <li>プライバシーポリシー</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LuxuCare株式会社. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}