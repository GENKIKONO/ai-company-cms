import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUserOrganization } from '@/lib/organizations-server';
import { getOrganizationStatsSafe, getCaseStudiesStatsSafe } from '@/lib/safeData';
import { supabaseServer } from '@/lib/supabase-server';
import PublishToggle from './components/PublishToggle';
import TabbedDashboard from './components/TabbedDashboard';
import PerformanceMetrics from './components/PerformanceMetrics';
import DashboardActions from './components/DashboardActions';
import { hasEntitlementSync } from '@/lib/feature-flags/gate';
import { logger } from '@/lib/utils/logger';

// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    logger.debug('Debug', '[Dashboard] Rendering started');
    logger.debug('Debug', '[VERIFY][MOBILE_UI] Dashboard with mobile optimizations loading');
    
    // 1. まず認証状態をチェック
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    logger.debug('[Dashboard] Auth check', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });

    // 認証状態のエラーまたは未ログインの場合
    if (authError || !user) {
      logger.debug('Debug', '[Dashboard] No authentication - redirecting to login');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="jp-heading text-xl font-semibold text-gray-900 mb-4">サインインしてください</h2>
            <p className="text-gray-600 mb-4">ダッシュボードにアクセスするにはログインが必要です。</p>
            <Link
              href="/auth/login"
              className="w-full bg-[var(--color-blue-600)] hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] text-white font-medium py-2 px-4 rounded-md text-center block"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      );
    }

    // 2. 認証済みユーザーの組織を取得
    const [org, statsResult] = await Promise.all([
      getCurrentUserOrganization(),
      getOrganizationStatsSafe()
    ]);

    logger.debug('[VERIFY] Dashboard fetched organization', {
      hasUser: !!user,
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

    // 3. 認証済みでも組織がない場合 → 企業作成導線
    if (!org || !org.id) {
      logger.debug('Debug', '[Dashboard] Authenticated user but no organization found');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">まず企業を作成しましょう</h2>
            <p className="text-gray-600 mb-4">ダッシュボードを使用するには企業情報の登録が必要です。</p>
            <Link
              href="/organizations/new"
              className="w-full bg-[var(--color-blue-600)] hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] text-white font-medium py-2 px-4 rounded-md text-center block"
              data-testid="create-organization"
            >
              企業を作成
            </Link>
          </div>
        </div>
      );
    }

    // 4. 組織あり → ダッシュボードUI
    logger.debug(`[Dashboard] Rendering dashboard UI for user ${user.id}, org: ${org.id}`);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Modern Hero Section */}
      <section className="relative section-spacing overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.08),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            {/* Organization badge */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 mb-8">
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  alt={`${org.name}のロゴ`}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain rounded"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {org.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-gray-700 font-medium" data-testid="organization-name">
                {org.name}
              </span>
              <div className={`w-2 h-2 rounded-full ${org.is_published ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              ダッシュボード
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              企業情報管理と公開状況を一元的に確認・管理できます
            </p>
            
            {/* Status indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-12">
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${org.is_published ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-700 font-medium">
                    {org.is_published ? '公開中' : '下書き'}
                  </span>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">
                    サービス: {stats.total || 0}件
                  </span>
                </div>
              </div>
              
              <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">
                    公開中: {stats.published || 0}件
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-6 lg:px-8 -mt-16 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">企業情報</p>
              <div className="flex items-center gap-3 mb-2">
                {org.logo_url ? (
                  <Image
                    src={org.logo_url}
                    alt={`${org.name}のロゴ`}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain bg-white rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">
                      {org.name.charAt(0)}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 truncate">{org.name}</h3>
              </div>
              <p className="text-sm text-gray-500">作成済み</p>
            </div>
          </div>

          <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                org.is_published 
                  ? 'bg-gradient-to-br from-green-500 to-green-600' 
                  : 'bg-gradient-to-br from-gray-400 to-gray-500'
              }`}>
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">公開ステータス</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {org.is_published ? '公開中' : '下書き'}
              </h3>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  org.is_published ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <p className="text-sm text-gray-500">
                  {org.is_published ? 'オンライン' : '準備中'}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">サービス数</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.total || 0}</h3>
              <p className="text-sm text-gray-500">
                公開中: <span className="font-semibold text-purple-600">{stats.published || 0}</span>
              </p>
            </div>
          </div>

          <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">導入事例</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{caseStudiesStats.total}</h3>
              <p className="text-sm text-gray-500">
                公開中: <span className="font-semibold text-emerald-600">{caseStudiesStats.published}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8 mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">クイックアクション</h2>
            <p className="text-gray-600 text-lg">よく使用される機能に素早くアクセス</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Link 
              href={`/organizations/${org.id}`}
              data-testid="qa-edit-org"
              className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[var(--bg-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">企業情報を編集</h3>
              <p className="text-sm text-gray-600">基本情報や詳細を更新</p>
            </Link>

            <Link 
              href={`/organizations/${org.id}/services/new`}
              className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">サービス追加</h3>
              <p className="text-sm text-gray-600">新しいサービスを登録</p>
            </Link>

            <PublishToggle 
              organizationId={org.id}
              isPublished={org.is_published}
              organizationName={org.name}
            />

            {/* Public page view */}
            {org.is_published && org.slug ? (
              <Link 
                href={`/o/${org.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">公開ページを見る</h3>
                <p className="text-sm text-gray-600">外部からの見え方を確認</p>
              </Link>
            ) : (
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 opacity-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464l1.414-1.414L12 9.172m-2.122.707l-1.415 1.414M12 9.172l1.878-1.879m2.829 2.829l-1.414 1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-400 mb-2">公開ページを見る</h3>
                <p className="text-sm text-gray-400">
                  {!org.slug ? "スラッグ未設定" : "未公開"}
                </p>
              </div>
            )}

            {/* システム監視 - Feature Gate 適用 */}
            {hasEntitlementSync(org, 'monitoring') ? (
              <Link 
                href="/monitor"
                className="group relative bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">システム監視</h3>
                <p className="text-sm text-gray-600">パフォーマンスを確認</p>
              </Link>
            ) : (
              <Link 
                href="/pricing?feature=monitor"
                className="group relative bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">システム監視</h3>
                <p className="text-sm text-orange-600">スタンダード以上</p>
              </Link>
            )}

            <Link 
              href="/dashboard/embed"
              className="group relative bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Widget埋め込み</h3>
              <p className="text-sm text-gray-600">サイトに企業情報を表示</p>
            </Link>

            <Link 
              href={`/organizations/${org.id}/hearing-request`}
              className="group relative bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m-4 9h10m-5-3L8 13l4-4-4-4" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ヒアリング支援依頼</h3>
              <p className="text-sm text-gray-600">専門ヒアリングを依頼</p>
            </Link>
          </div>
          
          {/* 追加の便利機能 */}
          <DashboardActions organization={org} />
        </div>


        {/* パフォーマンス概要とアクティビティ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* パフォーマンス概要 */}
          <div className="lg:col-span-2 bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">パフォーマンス概要</h2>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm font-medium text-gray-600">過去7日間</span>
              </div>
            </div>
            
            <PerformanceMetrics />
            
            <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900">トップページ</span>
                  </div>
                  <p className="text-gray-600">企業概要</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-gray-900">主要流入</span>
                  </div>
                  <p className="text-gray-600">Google検索</p>
                </div>
              </div>
            </div>
          </div>

          {/* 最近のアクティビティ */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">最近のアクティビティ</h2>
            </div>
            
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">アクティビティ追跡機能を計画中です</p>
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

        {/* サービス紹介 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">サービス紹介</h2>
              <p className="text-gray-600">機能とプランについて詳しく説明します</p>
            </div>
          </div>
          
          <Link
            href="/dashboard/services-info"
            className="group block bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 hover:border-emerald-300 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 mb-1">サービス紹介</h3>
                  <p className="text-sm text-gray-600">機能詳細・プラン比較・料金案内</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
  } catch (error) {
    logger.error('[Dashboard] 予期しないエラー', error instanceof Error ? error : new Error(String(error)));
    // フォールバック UI
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">一時的なエラーが発生しました</h2>
          <p className="text-gray-600 mb-4">数秒後にリロードしてください。</p>
          <Link
            href="/dashboard"
            className="w-full bg-[var(--color-blue-600)] hover:bg-[var(--color-blue-700)] focus:ring-2 focus:ring-[var(--color-blue-300)] text-white font-medium py-2 px-4 rounded-md text-center block"
          >
            再読み込み
          </Link>
        </div>
      </div>
    );
  }
}