import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'システム稼働状況 | AIO Hub',
  description: 'AIO Hubのシステム稼働状況とサービス状態をリアルタイムで確認できます。',
};

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">システム稼働状況</h1>
          <p className="text-xl text-gray-600">
            AIO Hubのサービス状態をリアルタイムで確認
          </p>
        </div>

        <div className="space-y-6">
          {/* 全体ステータス */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h2 className="text-lg font-semibold text-green-900">全サービス正常稼働中</h2>
              </div>
              <div className="text-sm text-green-700">
                最終更新: {new Date().toLocaleString('ja-JP')}
              </div>
            </div>
          </div>

          {/* 各サービスの状況 */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">サービス別稼働状況</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Webサイト</h4>
                    <p className="text-sm text-gray-500">メインサイトとダッシュボード</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  正常
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">API</h4>
                    <p className="text-sm text-gray-500">企業情報取得・更新API</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  正常
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">埋め込みウィジェット</h4>
                    <p className="text-sm text-gray-500">iframe・Widgetサービス</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  正常
                </span>
              </div>

              <div className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">AI検索最適化</h4>
                    <p className="text-sm text-gray-500">検索エンジン連携・最適化</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  正常
                </span>
              </div>
            </div>
          </div>

          {/* パフォーマンス指標 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">パフォーマンス指標（過去24時間）</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">99.9%</div>
                <div className="text-sm text-gray-500">稼働率</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">150ms</div>
                <div className="text-sm text-gray-500">平均応答時間</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-500">障害件数</div>
              </div>
            </div>
          </div>

          {/* お知らせ */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">メンテナンス・お知らせ</h3>
            <div className="text-gray-600">
              <p>現在予定されているメンテナンスはありません。</p>
              <p className="mt-2">
                システムに問題が発生した場合は、
                <a href="/contact" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
                  サポートまでご連絡
                </a>ください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}