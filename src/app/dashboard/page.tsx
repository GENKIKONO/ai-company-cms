'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, auth } from '@/lib/auth';
import { getOrganizations, createOrganization, getOrganizationStats } from '@/lib/organizations';
import { type AppUser, type Organization } from '@/types/database';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, archived: 0 });
  const [loading, setLoading] = useState(true);

  // 認証確認とデータ取得
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          // 未認証の場合、ログインページにリダイレクト
          window.location.href = '/login';
          return;
        }
        
        setUser(currentUser);
        
        // 企業データと統計を取得
        const [orgsResult, statsResult] = await Promise.all([
          getOrganizations({ limit: 10 }),
          getOrganizationStats()
        ]);

        if (orgsResult.data) {
          setOrganizations(orgsResult.data);
        }
        if (statsResult.data) {
          setStats(statsResult.data);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleCreateOrganization = () => {
    router.push('/organizations/new');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const text = {
      draft: '下書き',
      published: '公開中',
      archived: 'アーカイブ'
    };
    return text[status as keyof typeof text] || '不明';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                AIO Hub AI企業CMS
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-blue-600 font-medium">
                  ダッシュボード
                </Link>
                <Link href="/organizations" className="text-gray-500 hover:text-gray-700">
                  企業ディレクトリ
                </Link>
                <Link href="/dashboard/billing" className="text-gray-500 hover:text-gray-700">
                  サブスクリプション
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                こんにちは、{user?.full_name || user?.email}さん
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
          <p className="text-lg text-gray-600">
            企業情報の管理と公開状況を確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総企業数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">下書き</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
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
                <p className="text-sm font-medium text-gray-600">公開中</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">アーカイブ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.archived}</p>
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
            <button
              onClick={handleCreateOrganization}
              className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">新しい企業を追加</p>
                <p className="text-sm text-gray-600">企業情報を登録して公開します</p>
              </div>
            </button>

            <Link href="/organizations" className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">企業を検索</p>
                <p className="text-sm text-gray-600">公開済み企業を検索・閲覧します</p>
              </div>
            </Link>

            <button className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
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

        {/* 最近の企業一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最近の企業</h2>
              <Link href="/organizations" className="text-sm text-blue-600 hover:text-blue-700">
                すべて表示
              </Link>
            </div>
          </div>
          
          {organizations.length === 0 ? (
            <div className="p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">企業がありません</h3>
              <p className="mt-2 text-gray-500">
                最初の企業を追加して始めましょう
              </p>
              <Link
                href="/organizations/new"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block text-center"
              >
                企業を追加
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {organizations.slice(0, 5).map((org) => (
                <div key={org.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={`${org.name}のロゴ`}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {org.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          {org.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          更新日: {new Date(org.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(org.status)}`}>
                        {getStatusText(org.status)}
                      </span>
                      <Link
                        href={`/organizations/${org.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        編集
                      </Link>
                      {org.status === 'published' && (
                        <Link
                          href={`/o/${org.slug}`}
                          className="text-sm text-green-600 hover:text-green-700"
                          target="_blank"
                        >
                          表示
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

    </div>
  );
}