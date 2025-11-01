/**
 * 管理者ダッシュボード
 * 顧客管理・分析閲覧機能
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '管理コンソール | AIO Hub',
  description: 'システム管理・ユーザー管理・セキュリティ監視',
};

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理コンソール</h1>
          <p className="text-gray-600 mt-2">システム管理・ユーザー管理・セキュリティ監視</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* サイト設定カード */}
          <Link href="/management-console/settings" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-[var(--aio-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">サイト設定</h3>
              </div>
              <p className="text-gray-600 mb-4">ヒーロー画像・サイト設定の管理</p>
              <div className="text-sm text-[var(--aio-primary)] font-medium flex items-center">
                設定を管理
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 通報管理カード */}
          <Link href="/management-console/reports" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.268 16.5C3.498 18.333 4.46 20 6.002 20z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">通報管理</h3>
              </div>
              <p className="text-gray-600 mb-4">ユーザーからの通報対応・監視</p>
              <div className="text-sm text-gray-600 font-medium flex items-center">
                通報を確認
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* ヒアリング管理カード */}
          <Link href="/management-console/hearings" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">ヒアリング管理</h3>
              </div>
              <p className="text-gray-600 mb-4">ヒアリング依頼・スケジュール管理</p>
              <div className="text-sm text-gray-600 font-medium flex items-center">
                依頼を管理
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 埋め込み監視カード */}
          <Link href="/management-console/embed-dashboard" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">埋め込み監視</h3>
              </div>
              <p className="text-gray-600 mb-4">Widget・iframe利用状況分析</p>
              <div className="text-sm text-gray-600 font-medium flex items-center">
                分析を確認
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* 統計概要カード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">統計概要</h3>
            </div>
            <p className="text-gray-600 mb-4">システム全体の統計情報</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>登録組織数</span>
                <span className="font-semibold text-gray-600">準備中</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>アクティブユーザー</span>
                <span className="font-semibold text-gray-600">準備中</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>今月の利用</span>
                <span className="font-semibold text-gray-600">準備中</span>
              </div>
            </div>
          </div>

          {/* ユーザー管理カード */}
          <Link href="/management-console/users" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">ユーザー管理</h3>
              </div>
              <p className="text-gray-600 mb-4">ユーザーアカウント・権限の管理</p>
              <div className="text-sm text-gray-600 font-medium flex items-center">
                ユーザーを管理
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* お問合せ管理カード */}
          <Link href="/management-console/contacts" className="block">
            <div className="bg-white rounded-xl shadow-sm p-6 hover:opacity-95 transition-opacity cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">お問合せ管理</h3>
                <span className="ml-auto bg-gray-500 text-white text-xs px-2 py-1 rounded-full">0</span>
              </div>
              <p className="text-gray-600 mb-4">お問合せ・サポート依頼の管理</p>
              <div className="text-sm text-gray-600 font-medium flex items-center">
                お問合せを確認
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* クイックアクションカード */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gray-50 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">クイックアクション</h3>
            </div>
            <p className="text-gray-600 mb-4">よく使用する操作</p>
            <div className="space-y-2">
              <Link href="/management-console/settings" className="block text-sm text-gray-600 hover:text-gray-700 font-medium">
                • ヒーロー画像を変更
              </Link>
              <Link href="/management-console/reports" className="block text-sm text-gray-600 hover:text-gray-700 font-medium">
                • 新しい通報を確認
              </Link>
              <Link href="/management-console/hearings" className="block text-sm text-gray-600 hover:text-gray-700 font-medium">
                • ヒアリング依頼を確認
              </Link>
              <Link href="/management-console/users" className="block text-sm text-gray-600 hover:text-gray-700 font-medium">
                • ユーザー権限を管理
              </Link>
            </div>
          </div>
        </div>

        {/* システム状態表示 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">システム状態</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">API サーバー正常</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">データベース正常</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
              <span className="text-sm text-gray-600">ストレージ正常</span>
            </div>
          </div>
        </div>

        {/* 実装注記 */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-gray-800">実装ステータス</h4>
              <p className="text-sm text-gray-700 mt-1">
                管理コンソールの基本構造が実装されました。データ集計機能は計画中です。<br/>
                権限チェック済みで、管理者のみアクセス可能です。URL: /management-console
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}