import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import { getMyOrganizationSafe, getOrganizationStatsSafe } from '@/lib/safeData';
import PublishToggle from './components/PublishToggle';
import TabbedDashboard from './components/TabbedDashboard';

// 強制的に動的SSRにして、認証状態を毎回評価
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardPage() {
  try {
    console.log('[Dashboard] Rendering started');
    
    // リクエストヘッダーを取得
    const reqHeaders = await headers();
    
    // 安全なデータ取得
    const [orgResult, statsResult] = await Promise.all([
      getMyOrganizationSafe(reqHeaders),
      getOrganizationStatsSafe()
    ]);

    const organization = orgResult.data;
    const stats = statsResult.data || { total: 0, draft: 0, published: 0, archived: 0 };

    console.log('[Dashboard] Data loaded:', { 
      hasOrg: !!organization, 
      orgName: organization?.name,
      stats: stats.total 
    });

    // 3段構えのレンダリング分岐

    // 1. 認証状態不明 or エラー時 → サインイン導線
    if (orgResult.error && orgResult.error.includes('401')) {
      console.log('[Dashboard] Unauthorized access');
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
    if (!organization?.id) {
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
              {organization.name} の企業情報管理と公開状況を確認できます
            </p>
            
            {/* ステータス表示 */}
            <div className="flex justify-center items-center gap-6 mb-8 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${organization.is_published ? 'bg-gray-600' : 'bg-gray-400'}`}></span>
                {organization.is_published ? '公開中' : '下書き'}
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
                <p className="text-2xl font-bold text-gray-900">{organization.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  登録日: {new Date(organization.created_at).toLocaleDateString()}
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
                  {organization.is_published ? '公開中' : '下書き'}
                </p>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full mr-2 ${organization.is_published ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                  <p className="text-xs text-gray-400">
                    {organization.is_published ? 'オンライン' : '準備中'}
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
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-400 mt-1">
                  公開中: 0
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              href={`/organizations/${organization.id}`}
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
              href={`/organizations/${organization.id}/services/new`}
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
              organizationId={organization.id}
              isPublished={organization.is_published}
              organizationName={organization.name}
            />

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
          </div>
          
          {/* 追加の便利機能 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                共有リンク
              </button>
              
              <button className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                データ出力
              </button>
              
              <button className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
              </button>
              
              <button className="flex items-center justify-center p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ヘルプ
              </button>
            </div>
          </div>
        </div>

        {/* 企業管理 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">企業管理</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {organization.logo_url ? (
                  <Image
                    src={organization.logo_url}
                    alt={`${organization.name}のロゴ`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-lg">
                      {organization.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {organization.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    最終更新: {new Date(organization.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  organization.is_published 
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {organization.is_published ? '公開中' : '下書き'}
                </span>
                <Link
                  href={`/organizations/${organization.id}`}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 text-sm font-medium"
                >
                  編集
                </Link>
                {organization.is_published && organization.slug && (
                  <Link
                    href={`/o/${organization.slug}`}
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1">127</div>
                <div className="text-sm text-gray-500">ページビュー</div>
                <div className="text-xs text-gray-600 mt-1">+12%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1">24</div>
                <div className="text-sm text-gray-500">問い合わせ</div>
                <div className="text-xs text-gray-600 mt-1">+8%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1">2.4%</div>
                <div className="text-sm text-gray-500">コンバージョン率</div>
                <div className="text-xs text-gray-600 mt-1">-0.2%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700 mb-1">1:23</div>
                <div className="text-sm text-gray-500">平均滞在時間</div>
                <div className="text-xs text-gray-600 mt-1">+15s</div>
              </div>
            </div>
            
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
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">企業情報を更新しました</p>
                  <p className="text-xs text-gray-500">2時間前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">新しいサービスを公開しました</p>
                  <p className="text-xs text-gray-500">1日前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">3件のお問い合わせがありました</p>
                  <p className="text-xs text-gray-500">2日前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">ページビューが増加しています</p>
                  <p className="text-xs text-gray-500">3日前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">プロフィール画像を変更しました</p>
                  <p className="text-xs text-gray-500">1週間前</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                すべてのアクティビティを表示
              </button>
            </div>
          </div>
        </div>

        {/* 統合コンテンツ管理 - タブ式ダッシュボード */}
        <TabbedDashboard 
          organizationId={organization.id}
          organizationSlug={organization.slug}
          organizationName={organization.name}
          isPublished={organization.is_published}
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