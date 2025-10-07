/**
 * 管理者ダッシュボード
 * 顧客管理・分析閲覧機能
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理者ダッシュボード | LuxuCare CMS',
  description: '顧客管理・分析・運用監視',
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
          <p className="text-gray-600 mt-2">顧客管理・分析・システム監視</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 顧客管理カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">顧客管理</h3>
            </div>
            <p className="text-gray-600 mb-4">ユーザー・組織・プラン状態の管理</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>アクティブユーザー</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>組織数</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>有料プラン</span>
                <span className="font-semibold">—</span>
              </div>
            </div>
          </div>

          {/* 分析閲覧カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">詳細分析・レポート</h3>
            </div>
            <p className="text-gray-600 mb-4">全組織の分析データ閲覧</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>総ページビュー</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ユニークユーザー</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>インプレッション</span>
                <span className="font-semibold">—</span>
              </div>
            </div>
          </div>

          {/* 営業資料管理カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">営業資料管理</h3>
            </div>
            <p className="text-gray-600 mb-4">全組織の営業資料・添付ファイル</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>総ファイル数</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>使用ストレージ</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>今月アップロード</span>
                <span className="font-semibold">—</span>
              </div>
            </div>
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">システム状態</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">API サーバー正常</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">データベース正常</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">ストレージ正常</span>
            </div>
          </div>
        </div>

        {/* 実装注記 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">実装ステータス</h4>
              <p className="text-sm text-yellow-700 mt-1">
                管理者ダッシュボードの基本構造が実装されました。データ集計機能は次フェーズで実装予定です。
                現在は管理者のみアクセス可能な状態で、APIエンドポイントは固定値（—）を返却しています。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}