import { Metadata } from 'next';
import { LogAnalytics } from '@/lib/api/audit-logger';

export const metadata: Metadata = {
  title: 'API使用状況 - AIO Hub 運用管理',
  description: 'API使用パターン分析とパフォーマンス監視ダッシュボード'
};

/**
 * API使用状況分析ダッシュボード
 * 運用管理者向けの統計・監視画面
 */
export default async function AnalyticsPage() {
  // 過去30日間のデータを取得
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const [apiStats, businessMetrics] = await Promise.all([
    LogAnalytics.getApiUsageStats(startDate, endDate),
    LogAnalytics.getBusinessMetrics(startDate, endDate)
  ]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">API使用状況分析</h1>
          <p className="mt-2 text-gray-600">過去30日間のAPI使用パターンとビジネスメトリクス</p>
        </div>

        {/* 概要統計 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">総リクエスト数</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {apiStats.totalRequests.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">過去30日間</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">アクティブユーザー</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {apiStats.uniqueUsers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">ユニークユーザー</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">平均応答時間</h3>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {apiStats.averageResponseTime}ms
            </p>
            <p className="text-sm text-gray-500 mt-1">目標: 1000ms以下</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">エラー率</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {apiStats.errorRate}%
            </p>
            <p className="text-sm text-gray-500 mt-1">目標: 1%以下</p>
          </div>
        </div>

        {/* 人気エンドポイント */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">人気APIエンドポイント</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      エンドポイント
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      リクエスト数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      平均応答時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      パフォーマンス
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiStats.topEndpoints.map((endpoint, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {endpoint.endpoint}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {endpoint.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {endpoint.avgResponseTime}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          endpoint.avgResponseTime < 200 ? 'bg-green-100 text-green-800' :
                          endpoint.avgResponseTime < 500 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.avgResponseTime < 200 ? '高速' :
                           endpoint.avgResponseTime < 500 ? '普通' : '要改善'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ビジネスメトリクス */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">ビジネスメトリクス</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {businessMetrics.organizationsCreated}
                </p>
                <p className="text-sm text-gray-600">企業作成数</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {businessMetrics.organizationsPublished}
                </p>
                <p className="text-sm text-gray-600">企業公開数</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {businessMetrics.servicesCreated}
                </p>
                <p className="text-sm text-gray-600">サービス作成数</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {businessMetrics.newSignups}
                </p>
                <p className="text-sm text-gray-600">新規ユーザー</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {businessMetrics.subscriptions}
                </p>
                <p className="text-sm text-gray-600">有料登録数</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-600">
                  {businessMetrics.dailyActiveUsers}
                </p>
                <p className="text-sm text-gray-600">日間アクティブユーザー</p>
              </div>
            </div>
          </div>
        </div>

        {/* 時間別アクセス分布 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">時間別アクセス分布</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-12 gap-2">
              {apiStats.hourlyDistribution.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div 
                    className="bg-blue-500 mx-auto mb-2 rounded"
                    style={{
                      height: `${Math.max(hour.requests / 10, 4)}px`,
                      width: '16px'
                    }}
                  ></div>
                  <span className="text-xs text-gray-600">{hour.hour}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4 text-center">
              時間別リクエスト数分布（過去24時間）
            </p>
          </div>
        </div>

        {/* パフォーマンス推奨事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">
            📊 パフォーマンス推奨事項
          </h3>
          <ul className="space-y-2 text-sm text-yellow-700">
            {apiStats.averageResponseTime > 1000 && (
              <li>• 平均応答時間が目標値を超えています。データベースクエリの最適化を検討してください。</li>
            )}
            {apiStats.errorRate > 1 && (
              <li>• エラー率が高くなっています。エラーログを確認し、問題の原因を特定してください。</li>
            )}
            <li>• 定期的な監視により、システムの健全性を維持しています。</li>
            <li>• アクセスパターンを分析し、キャッシュ戦略の最適化を継続してください。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}