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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center block"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      );
    }

    // 2. 認証OK & 組織なし → 企業作成導線
    if (!organization) {
      console.log('[Dashboard] No organization found');
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">まず企業を作成しましょう</h2>
            <p className="text-gray-600 mb-4">ダッシュボードを使用するには企業情報の登録が必要です。</p>
            <Link
              href="/organizations/new"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center block"
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-lg text-gray-600">
            企業情報の管理と公開状況を確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">企業情報</p>
                <p className="text-2xl font-bold text-gray-900">{organization.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">ステータス</p>
                <p className="text-2xl font-bold text-gray-900">
                  {organization.is_published ? '公開中' : '下書き'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションセクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">クイックアクション</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href={`/organizations/${organization.id}`}
              data-testid="qa-edit-org"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">企業情報を編集</p>
                <p className="text-sm text-gray-600">基本情報や詳細を更新</p>
              </div>
            </Link>

            <PublishToggle 
              organizationId={organization.id}
              isPublished={organization.is_published}
              organizationName={organization.name}
            />

            <button 
              data-testid="qa-report"
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">レポートを表示</p>
                <p className="text-sm text-gray-600">アクセス解析や統計データを確認</p>
              </div>
            </button>
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
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
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
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {organization.is_published ? '公開中' : '下書き'}
                </span>
                <Link
                  href={`/organizations/${organization.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  編集
                </Link>
                {organization.is_published && organization.slug && (
                  <Link
                    href={`/o/${organization.slug}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    target="_blank"
                  >
                    表示
                  </Link>
                )}
              </div>
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
            <h2 className="text-lg font-semibold text-gray-900">サブスクリプション管理</h2>
            <p className="text-sm text-gray-500 mt-1">プランと請求情報を管理します</p>
          </div>
          
          <div className="p-6">
            <Link
              href="/dashboard/billing"
              className="group block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-green-600">サブスクリプション管理</h3>
                  <p className="text-xs text-gray-500">プラン管理・請求・使用量確認</p>
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-center block"
          >
            再読み込み
          </Link>
        </div>
      </div>
    );
  }
}