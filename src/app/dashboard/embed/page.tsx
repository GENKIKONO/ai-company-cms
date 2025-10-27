'use client';

import { useState, useEffect } from 'react';
import { WidgetPreview } from '@/components/embed/WidgetPreview';
import { getCurrentUser } from '@/lib/auth';
import { HIGButton } from '@/design-system';
import { getOrganization } from '@/lib/organizations';
import { Organization, Service } from '@/types/database';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

export default function EmbedPage() {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateEmbedCode();
  }, [organization, widgetOptions]);

  const fetchData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get user's organization
      const orgResult = await fetch('/api/my/organization');
      if (!orgResult.ok) throw new Error('Failed to fetch organization');
      
      const orgData = await orgResult.json();
      const org = orgData.data;
      
      setOrganization(org);

      // Get services
      const servicesResult = await fetch('/api/my/services');
      if (!servicesResult.ok) throw new Error('Failed to fetch services');
      
      const servicesData = await servicesResult.json();
      setServices(servicesData.data || []);

    } catch (error) {
      logger.error('Failed to fetch data', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
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
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      alert('埋め込みコードをコピーしました！');
    } catch (error) {
      logger.error('Failed to copy', error instanceof Error ? error : new Error(String(error)));
      alert('コピーに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--bg-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業情報が見つかりません</h2>
          <Link href="/dashboard" className="mt-4 text-[var(--bg-primary)] hover:text-[var(--bg-primary-hover)]">
            ダッシュボードに戻る
          </Link>
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
              <h1 className="text-3xl font-bold text-gray-900">Widget埋め込み</h1>
              <p className="text-lg text-gray-600 mt-2">
                企業情報をWebサイトに埋め込むためのWidgetコードを生成します
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              ダッシュボードに戻る
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)]"
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
                      className="h-4 w-4 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)] border-gray-300 rounded"
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
                      className="h-4 w-4 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)] border-gray-300 rounded"
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
                      className="h-4 w-4 text-[var(--bg-primary)] focus:ring-[var(--bg-primary)] border-gray-300 rounded"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--bg-primary)]"
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
              <HIGButton
                onClick={copyToClipboard}
                variant="primary"
                size="sm"
              >
                コードをコピー
              </HIGButton>
            </div>
            
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