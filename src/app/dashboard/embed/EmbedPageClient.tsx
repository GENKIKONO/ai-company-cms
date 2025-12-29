'use client';

import { useState, useEffect, useCallback } from 'react';
import { ROUTES } from '@/lib/routes';
import { WidgetPreview } from '@/components/embed/WidgetPreview';
import { getCurrentUserClient as getCurrentUser } from '@/lib/core/auth-state.client';
import { DashboardPageShell } from '@/components/dashboard';
import { DashboardButton } from '@/components/dashboard/ui';
import { getOrganization } from '@/lib/organizations';
import type { Organization, Service } from '@/types/legacy/database';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';
import { OrgQuotaBadge, type SimpleQuotaProps } from '@/components/quota/OrgQuotaBadge';

interface EmbedPageClientProps {
  embedsQuota: SimpleQuotaProps | null;
}

export default function EmbedPageClient({ embedsQuota }: EmbedPageClientProps) {
  return (
    <DashboardPageShell title="埋め込みウィジェット" requiredRole="viewer">
      <EmbedPageContent embedsQuota={embedsQuota} />
    </DashboardPageShell>
  );
}

function EmbedPageContent({ embedsQuota }: EmbedPageClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [widgetOptions, setWidgetOptions] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    size: 'medium' as 'small' | 'medium' | 'large',
    showLogo: true,
    showDescription: true,
    showServices: true,
    customCSS: ''
  });
  const [embedCode, setEmbedCode] = useState('');

  // Phase 4-C: Quota判定フラグ（fail-open設計）
  const isEmbedsLimitReached = 
    !!embedsQuota &&
    !embedsQuota.unlimited &&
    embedsQuota.limit >= 0 &&
    embedsQuota.usedInWindow >= embedsQuota.limit;

  const isEmbedsDisabledByPlan = 
    !!embedsQuota &&
    !embedsQuota.unlimited &&
    embedsQuota.limit === 0;

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const user = await getCurrentUser();
      if (!user) {
        setError('ログインが必要です。再度ログインしてください。');
        return;
      }

      // Get user's organization
      const orgResult = await fetch('/api/my/organization');
      if (!orgResult.ok) {
        const errorData = await orgResult.json().catch(() => ({}));
        logger.error('Organization API error', { 
          data: { 
            status: orgResult.status, 
            statusText: orgResult.statusText, 
            errorData 
          }
        });
        
        if (orgResult.status === 401) {
          setError('認証エラーが発生しました。再度ログインしてください。');
        } else if (orgResult.status === 500) {
          setError('サーバーエラーが発生しました。しばらく待ってから再試行してください。');
        } else {
          setError('組織情報の取得に失敗しました。');
        }
        return;
      }
      
      const orgData = await orgResult.json();
      const org = orgData.data;
      
      if (!org) {
        setError('組織情報が見つかりません。先に企業情報を作成してください。');
        return;
      }
      
      setOrganization(org);

      // Get services
      try {
        const servicesResult = await fetch('/api/my/services');
        if (servicesResult.ok) {
          const servicesData = await servicesResult.json();
          setServices(servicesData.data || []);
        } else {
          logger.warn('Services fetch failed', { data: { status: servicesResult.status } });
          setServices([]);
        }
      } catch (servicesError) {
        logger.warn('Services fetch error', { data: servicesError });
        setServices([]);
      }

    } catch (error) {
      logger.error('Failed to fetch data', { data: error instanceof Error ? error : new Error(String(error)) });
      setError('データの取得中にエラーが発生しました。ページを再読み込みしてください。');
    } finally {
      setLoading(false);
    }
  }, []);

  const retryFetch = () => {
    setLoading(true);
    fetchData();
  };

  const generateEmbedCode = useCallback(() => {
    if (!organization?.slug) {
      setEmbedCode('');
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-company-cms.vercel.app';
    const params = new URLSearchParams({
      theme: widgetOptions.theme,
      size: widgetOptions.size,
      logo: widgetOptions.showLogo.toString(),
      desc: widgetOptions.showDescription.toString(),
      services: widgetOptions.showServices.toString(),
    });

    if (widgetOptions.customCSS) {
      params.set('css', encodeURIComponent(widgetOptions.customCSS));
    }

    const code = `<iframe 
  src="${baseUrl}/api/public/embed/widget/${organization.slug}?${params.toString()}"
  width="100%"
  height="400"
  frameborder="0"
  style="border: 1px solid var(--border-default); border-radius: 8px;">
</iframe>`;
    
    setEmbedCode(code);
  }, [organization, widgetOptions]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      alert('埋め込みコードをコピーしました！');
    } catch (error) {
      logger.error('Failed to copy', { data: error instanceof Error ? error : new Error(String(error)) });
      alert('コピーに失敗しました');
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    generateEmbedCode();
  }, [generateEmbedCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={retryFetch}
              className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] transition-colors"
            >
              再試行
            </button>
            <div>
              <Link href={ROUTES.dashboard} className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm" replace>
                ダッシュボードに戻る
              </Link>
            </div>
            {error.includes('企業情報を作成') && (
              <div>
                <Link href={ROUTES.dashboardCompany} className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] text-sm">
                  企業情報を作成する
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業情報が見つかりません</h2>
          <div className="mt-4 space-y-2">
            <div>
              <button
                onClick={retryFetch}
                className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)]"
              >
                再試行
              </button>
            </div>
            <div>
              <Link href="/dashboard" className="text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]" replace>
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-company-cms.vercel.app';

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Widget埋め込み</h1>
                {/* Phase 4-B: Quota表示 */}
                <OrgQuotaBadge
                  label="埋め込みウィジェット"
                  quota={embedsQuota}
                  className="text-sm"
                />
              </div>
              <p className="text-lg text-gray-600 mt-2">
                企業情報をWebサイトに埋め込むためのWidgetコードを生成します
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {organization.slug ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 設定パネル */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Widget設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    テーマ
                  </label>
                  <select
                    value={widgetOptions.theme}
                    onChange={(e) => setWidgetOptions({
                      ...widgetOptions, 
                      theme: e.target.value as 'light' | 'dark' | 'auto'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  >
                    <option value="light">ライト</option>
                    <option value="dark">ダーク</option>
                    <option value="auto">自動</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サイズ
                  </label>
                  <select
                    value={widgetOptions.size}
                    onChange={(e) => setWidgetOptions({
                      ...widgetOptions, 
                      size: e.target.value as 'small' | 'medium' | 'large'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  >
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    表示項目
                  </label>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showLogo"
                      checked={widgetOptions.showLogo}
                      onChange={(e) => setWidgetOptions({
                        ...widgetOptions, 
                        showLogo: e.target.checked
                      })}
                      className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-gray-300 rounded"
                    />
                    <label htmlFor="showLogo" className="ml-2 text-sm text-gray-700">
                      ロゴを表示
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showDescription"
                      checked={widgetOptions.showDescription}
                      onChange={(e) => setWidgetOptions({
                        ...widgetOptions, 
                        showDescription: e.target.checked
                      })}
                      className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-gray-300 rounded"
                    />
                    <label htmlFor="showDescription" className="ml-2 text-sm text-gray-700">
                      説明文を表示
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showServices"
                      checked={widgetOptions.showServices}
                      onChange={(e) => setWidgetOptions({
                        ...widgetOptions, 
                        showServices: e.target.checked
                      })}
                      className="h-4 w-4 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)] border-gray-300 rounded"
                    />
                    <label htmlFor="showServices" className="ml-2 text-sm text-gray-700">
                      サービスリストを表示
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="customCSS" className="block text-sm font-medium text-gray-700 mb-2">
                    カスタムCSS（オプション）
                  </label>
                  <textarea
                    id="customCSS"
                    rows={4}
                    value={widgetOptions.customCSS}
                    onChange={(e) => setWidgetOptions({
                      ...widgetOptions, 
                      customCSS: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    placeholder=".widget { border-radius: 12px; }"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Widgetの見た目をカスタマイズするCSSを記述できます
                  </p>
                </div>
              </div>
            </div>

            {/* プレビュー */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">プレビュー</h2>
              
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <WidgetPreview
                  organization={organization}
                  services={services}
                  options={widgetOptions}
                  baseUrl={baseUrl}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-21 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  公開スラッグが設定されていません
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Widget埋め込み機能を使用するには、企業情報で公開スラッグを設定してください。
                </p>
                <div className="mt-4">
                  <Link
                    href={`/organizations/${organization.id}`}
                    className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
                  >
                    企業情報を編集
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 埋め込みコード */}
        {embedCode && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">埋め込みコード</h2>
              <DashboardButton
                onClick={copyToClipboard}
                variant="primary"
                size="sm"
                disabled={isEmbedsLimitReached || isEmbedsDisabledByPlan}
              >
                コードをコピー
              </DashboardButton>
            </div>
            
            {/* Phase 4-C: Quota警告表示 */}
            {isEmbedsDisabledByPlan && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">埋め込みウィジェット機能が無効です</h3>
                    <p className="mt-1 text-sm text-red-700">
                      現在のプランでは埋め込みウィジェット機能をご利用いただけません。プランをアップグレードしてください。
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {isEmbedsLimitReached && !isEmbedsDisabledByPlan && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">埋め込み上限に達しました</h3>
                    <p className="mt-1 text-sm text-orange-700">
                      {embedsQuota && `${embedsQuota.usedInWindow}/${embedsQuota.limit} の埋め込みを使用済みです。`}
                      追加で埋め込みコードを生成するには、プランをアップグレードしてください。
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-gray-100 rounded-md p-4 overflow-x-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                <code>{embedCode}</code>
              </pre>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <h3 className="font-medium mb-2">使用方法:</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>上記のコードをコピーします</li>
                <li>埋め込みたいWebページのHTMLに貼り付けます</li>
                <li>必要に応じてwidth、heightを調整します</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}