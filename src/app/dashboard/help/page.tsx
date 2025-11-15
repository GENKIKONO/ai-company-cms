import Link from 'next/link';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ナビゲーション */}
      <DashboardBackLink className="mb-6" />

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">ヘルプ・サポート</h1>
            <p className="text-sm text-gray-500 mt-1">よくある質問とサポート情報</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* FAQ セクション */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">よくある質問</h2>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">企業情報を編集するには？</h3>
                    <p className="text-sm text-gray-600">ダッシュボードの「企業情報を編集」ボタンから編集画面にアクセスできます。</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">サービスを公開するには？</h3>
                    <p className="text-sm text-gray-600">まず企業を公開状態にしてから、各サービスの編集画面で「公開」に設定してください。</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">データをエクスポートできますか？</h3>
                    <p className="text-sm text-gray-600">ダッシュボードの「データ出力」ボタンからCSV形式でデータをダウンロードできます。</p>
                  </div>
                </div>
              </div>

              {/* サポート連絡先 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">サポートが必要ですか？</h3>
                <p className="text-sm text-gray-600 mb-3">
                  上記で解決しない問題については、サポートチームまでお気軽にお問い合わせください。
                </p>
                <div className="flex space-x-4">
                  <a 
                    href="mailto:support@luxucare.com"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    メールで問い合わせ
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
    </div>
  );
}