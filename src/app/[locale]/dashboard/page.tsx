'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { trackPageView, trackEvent } from '@/lib/analytics';
import { Organization, AppUser } from '@/types';

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<AppUser['role']>('org_owner');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = supabaseBrowser();
      
      // 認証チェック
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Analytics: ダッシュボードアクセス追跡
      trackPageView({
        url: '/dashboard',
        referrer: document.referrer
      });

      // ユーザー同期（初回ログイン対応）
      await fetch('/api/auth/sync', { method: 'POST' });

      // app_usersからロール情報を取得
      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('role, partner_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User role fetch error:', userError);
        return;
      }

      setUserRole(appUser.role);

      // Analytics: ユーザーロール追跡
      trackEvent({
        name: 'Dashboard Access',
        properties: {
          user_role: appUser.role,
          partner_id: appUser.partner_id || 'none'
        }
      });

      // organizationsを取得
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, slug, status, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (orgsError) {
        console.error('Organizations fetch error:', orgsError);
      } else {
        setOrganizations(orgs || []);
        
        // Analytics: 企業数追跡
        trackEvent({
          name: 'Dashboard Load',
          properties: {
            organizations_count: orgs?.length || 0,
            published_count: orgs?.filter(org => org.status === 'published').length || 0,
            draft_count: orgs?.filter(org => org.status === 'draft').length || 0
          }
        });
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { text: '下書き', color: 'bg-gray-100 text-gray-800' },
      waiting_approval: { text: '承認待ち', color: 'bg-yellow-100 text-yellow-800' },
      published: { text: '公開中', color: 'bg-green-100 text-green-800' },
      paused: { text: '一時停止', color: 'bg-red-100 text-red-800' },
      archived: { text: 'アーカイブ', color: 'bg-gray-100 text-gray-600' },
    };
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="mt-1 text-sm text-gray-500">
                ようこそ、{user?.email} さん ({userRole})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {(userRole === 'admin' || userRole === 'partner_admin') && (
                <button
                  onClick={() => {
                    trackEvent({
                      name: 'Navigation',
                      properties: {
                        action: 'partner_management_click',
                        from_page: 'dashboard'
                      }
                    });
                    router.push('/dashboard/partners');
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  パートナー管理
                </button>
              )}
              <button
                onClick={() => {
                  trackEvent({
                    name: 'Navigation',
                    properties: {
                      action: 'new_organization_click',
                      from_page: 'dashboard'
                    }
                  });
                  router.push('/dashboard/organizations/new');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                新規企業登録
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{organizations.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">総企業数</dt>
                    <dd className="text-lg font-medium text-gray-900">{organizations.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {organizations.filter(org => org.status === 'published').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">公開中</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {organizations.filter(org => org.status === 'published').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {organizations.filter(org => org.status === 'waiting_approval').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">承認待ち</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {organizations.filter(org => org.status === 'waiting_approval').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {organizations.filter(org => org.status === 'draft').length}
                    </span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">下書き</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {organizations.filter(org => org.status === 'draft').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 企業一覧 */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">企業一覧</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              登録されている企業の一覧です
            </p>
          </div>
          
          {organizations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">まだ企業が登録されていません</p>
              <button
                onClick={() => router.push('/dashboard/organizations/new')}
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                最初の企業を登録
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <li key={org.id}>
                  <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {org.name}
                          </p>
                          {getStatusBadge(org.status)}
                        </div>
                        <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                          <span>スラグ: /{org.slug}</span>
                          <span>•</span>
                          <span>更新: {new Date(org.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {org.status === 'published' && (
                        <a
                          href={`/o/${org.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          公開ページ
                        </a>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        編集
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}