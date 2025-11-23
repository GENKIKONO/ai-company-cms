'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { GhostwriterInput } from '@/components/cms/GhostwriterInput';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { supabaseBrowser } from '@/lib/supabase-client';

export default function SettingsPage() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: userOrg } = await supabase
            .from('user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('role', 'owner')
            .single();
          
          if (userOrg) {
            setOrganizationId(userOrg.organization_id);
          }
        }
      } catch (error) {
        // Organization fetch failed - user might not be an owner
      } finally {
        setIsLoading(false);
      }
    };

    getOrganizationId();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* パンくず */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/dashboard" replace className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li className="text-gray-900 font-medium">設定</li>
          </ol>
        </nav>

        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-sm text-gray-500 mt-1">アカウント設定とセキュリティ設定を管理</p>
        </div>

        {/* コンテンツ */}
        <div className="space-y-8">
          {/* サイト設定管理 - 司令塔機能 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">サイト設定管理</h2>
            {isLoading ? (
              <div className="animate-pulse bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-24 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ) : (
              <SiteSettingsForm organizationId={organizationId || ''} />
            )}
          </div>

          {/* AI Ghostwriter - 企業情報自動生成 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">AI企業情報自動生成</h2>
            {isLoading ? (
              <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div>
                    <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                  <div className="h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ) : (
              <GhostwriterInput organizationId={organizationId || ''} />
            )}
          </div>
          {/* セキュリティ設定 */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">セキュリティ設定</h2>
            <ChangePasswordForm />
          </div>

          {/* 今後実装予定の機能 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">今後実装予定の機能</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">開発中の機能</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>プロフィール設定</li>
                      <li>企業情報設定</li>
                      <li>通知設定</li>
                      <li>二要素認証設定</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="flex justify-between items-center">
            <Link
              href="/dashboard"
              replace
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}