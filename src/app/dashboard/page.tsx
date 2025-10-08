import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUserOrganization } from '@/lib/organizations-server';
import { getOrganizationStatsSafe, getCaseStudiesStatsSafe } from '@/lib/safeData';
import PublishToggle from './components/PublishToggle';
import TabbedDashboard from './components/TabbedDashboard';
import PerformanceMetrics from './components/PerformanceMetrics';
import DashboardActions from './components/DashboardActions';

// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    console.log('[Dashboard] Rendering started');
    
    // 🚫 非キャッシュの組織取得に差し替え
    const [org, statsResult] = await Promise.all([
      getCurrentUserOrganization(),
      getOrganizationStatsSafe()
    ]);

    console.log('[VERIFY] Dashboard fetched organization', {
      hasOrg: !!org,
      slug: org?.slug,
      status: org?.status,
    });

    const stats = statsResult.data || { total: 0, draft: 0, published: 0, archived: 0 };

    // 導入事例統計を取得（組織がある場合のみ）
    const caseStudiesResult = org?.id 
      ? await getCaseStudiesStatsSafe(org.id)
      : { data: { total: 0, published: 0 } };
    
    const caseStudiesStats = caseStudiesResult.data || { total: 0, published: 0 };

    // 3段構えのレンダリング分岐

    // 1. 認証状態不明 or エラー時 → サインイン導線  
    if (org === null) {
      console.log('[Dashboard] No authentication or access denied');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">サインインしてください</h2>
            <p className="text-gray-600 mb-4">ダッシュボードにアクセスするにはログインが必要です。</p>
            <Link
              href="/auth/login"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md text-center block"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      );
    }

    // 2. 認証OK & 組織なし → 企業作成導線
    if (!org?.id) {
      console.log('[Dashboard] No organization found');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">まず企業を作成しましょう</h2>
            <p className="text-gray-600 mb-4">ダッシュボードを使用するには企業情報の登録が必要です。</p>
            <Link
              href="/organizations/new"
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md text-center block"
            >
              企業を作成
            </Link>
          </div>
        </div>
      );
    }

    // 3. 組織あり → ダッシュボードUI
    console.log('[Dashboard] Rendering dashboard UI');


  return (
    <div className="min-h-screen bg-white">
      {/* ヒーローセクション */}
      <section className="relative py-16 overflow-hidden bg-gray-50">
        {/* 背景装飾 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gray-300 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gray-200 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              ダッシュボード
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              {org.name} の企業情報管理と公開状況を確認できます
            </p>
            
            {/* ステータス表示 */}
            <div className="flex justify-center items-center gap-6 mb-8 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${org.is_published ? 'bg-gray-600' : 'bg-gray-400'}`}></span>
                {org.is_published ? '公開中' : '下書き'}
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
                サービス: {stats.total || 0}件
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                公開中: {stats.published || 0}件
              </span>
            </div>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">企業情報</p>
                <p className="text-2xl font-bold text-gray-900">{org.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  作成済み
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">公開ステータス</p>
                <p className="text-2xl font-bold text-gray-900">
                  {org.is_published ? '公開中' : '下書き'}
                </p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${org.is_published ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-400">
                    {org.is_published ? 'オンライン' : '準備中'}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">サービス数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  公開中: {stats.published || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">導入事例</p>
                <p className="text-2xl font-bold text-gray-900">{caseStudiesStats.total}</p>
                <p className="text-xs text-gray-400 mt-1">
                  公開中: {caseStudiesStats.published}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">クイックアクション</h2>
            <span className="text-sm text-gray-500">よく使用される機能</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link 
              href={`/organizations/${org.id}`}
              data-testid="qa-edit-org"
              className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <div className="p-3 bg-gray-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">企業情報を編集</p>
                <p className="text-sm text-gray-600">基本情報や詳細を更新</p>
              </div>
            </Link>

            <Link 
              href={`/organizations/${org.id}/services/new`}
              className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
            >
              <div className="p-3 bg-gray-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">サービス追加</p>
                <p className="text-sm text-gray-600">新しいサービスを登録</p>
              </div>
            </Link>

            <PublishToggle 
              organizationId={org.id}
              isPublished={org.is_published}
              organizationName={org.name}
            />

            {/* ✅ 公開ページを見るボタン追加 */}
            {org.slug && org.is_published ? (
              <Link 
                href={`/o/${org.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-300"
              >
                <div className="p-3 bg-green-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900 mb-1">公開ページを見る</p>
                  <p className="text-sm text-gray-600">外部からの見え方を確認</p>
                </div>
              </Link>
            ) : (
              <button 
                className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed transition-all duration-300" 
                title={!org.slug ? "公開スラッグ未設定" : "企業が未公開"}
                disabled
              >
                <div className="p-3 bg-gray-100 rounded-xl mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464l1.414-1.414L12 9.172m-2.122.707l-1.415 1.414M12 9.172l1.878-1.879m2.829 2.829l-1.414 1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-400 mb-1">公開ページを見る</p>
                  <p className="text-sm text-gray-400">
                    {!org.slug ? "スラッグ未設定" : "未公開"}
                  </p>
                </div>
              </button>
            )}

            {/* ✅ システム監視 - プラン制限対応 - FIXED: Real plan data */}
            {(() => {
              const { isSystemMonitoringAllowed } = require('@/config/plans');
              const { getUserPlanClient } = require('@/lib/user-plan');
              const userPlanInfo = getUserPlanClient(org);
              const isAllowed = isSystemMonitoringAllowed(userPlanInfo.plan);
              
              if (isAllowed) {
                return (
                  <Link 
                    href="/monitor"
                    className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                  >
                    <div className="p-3 bg-gray-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 mb-1">システム監視</p>
                      <p className="text-sm text-gray-600">パフォーマンスを確認</p>
                    </div>
                  </Link>
                );
              } else {
                return (
                  <Link 
                    href="/pricing?feature=monitor"
                    className="group flex flex-col items-center p-6 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all duration-300"
                  >
                    <div className="p-3 bg-orange-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900 mb-1">システム監視</p>
                      <p className="text-sm text-orange-600">スタンダード以上</p>
                    </div>
                  </Link>
                );
              }
            })()}

            <Link 
              href={`/organizations/${org.id}/hearing-request`}
              className="group flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="p-3 bg-blue-100 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m-4 9h10m-5-3L8 13l4-4-4-4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 mb-1">ヒアリング支援依頼</p>
                <p className="text-sm text-gray-600">専門ヒアリングを依頼</p>
              </div>
            </Link>
          </div>
          
          {/* 追加の便利機能 */}
          <DashboardActions organization={org} />
        </div>

        {/* 企業管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">企業管理</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">
                    {org.name?.charAt(0) || 'O'}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    作成済み
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  org.is_published 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {org.is_published ? '公開中' : '下書き'}
                </span>
                <Link
                  href={`/organizations/${org.id}`}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-sm font-medium"
                >
                  編集
                </Link>
                {org.is_published && org.slug && (
                  <Link
                    href={`/o/${org.slug}`}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-sm font-medium"
                    target="_blank"
                  >
                    表示
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* パフォーマンス概要とアクティビティ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* パフォーマンス概要 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">パフォーマンス概要</h2>
              <span className="text-sm text-gray-500">過去7日間</span>
            </div>
            
            <PerformanceMetrics />
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">トップページ:</span> 企業概要
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">主要流入:</span> Google検索
                </div>
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">最近のアクティビティ</h2>
            
            <div className="text-center py-8">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">アクティビティ追跡機能は今後実装予定です</p>
            </div>
            
            <DashboardActions organization={org} context="activity" />
          </div>
        </div>

        {/* 統合コンテンツ管理 - タブ式ダッシュボード */}
        <TabbedDashboard 
          organizationId={org.id}
          organizationSlug={org.slug}
          organizationName={org.name}
          isPublished={org.is_published}
        />

        {/* サブスクリプション管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">サービス紹介</h2>
            <p className="text-sm text-gray-500 mt-1">機能とプランについて詳しく説明します</p>
          </div>
          
          <div className="p-6">
            <Link
              href="/dashboard/services-info"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-700">サービス紹介</h3>
                  <p className="text-xs text-gray-500">機能詳細・プラン比較・料金案内</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
  } catch (error) {
    console.error('[Dashboard] 予期しないエラー:', error);
    // フォールバック UI
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">一時的なエラーが発生しました</h2>
          <p className="text-gray-600 mb-4">数秒後にリロードしてください。</p>
          <Link
            href="/dashboard"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md text-center block"
          >
            再読み込み
          </Link>
        </div>
      </div>
    );
  }
}