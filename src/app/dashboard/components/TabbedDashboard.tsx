'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import type { Post, Service, CaseStudy, FAQ } from '@/types/legacy/database';
import { OrganizationPreview } from '@/components/ui/organization-preview';
import { useSuccessToast, useErrorToast } from '@/components/ui/toast';
import { logger } from '@/lib/log';

interface TabbedDashboardProps {
  organizationId: string;
  organizationSlug?: string;
  organizationName: string;
  isPublished: boolean;
}

type TabType = 'overview' | 'posts' | 'services' | 'case-studies' | 'faqs';

interface ContentStats {
  posts: number;
  services: number;
  caseStudies: number;
  faqs: number;
}

export default function TabbedDashboard({ organizationId, organizationSlug, organizationName, isPublished }: TabbedDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [posts, setPosts] = useState<Post[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<Record<TabType, boolean>>({
    overview: false,
    posts: false,
    services: false,
    'case-studies': false,
    faqs: false
  });
  const [stats, setStats] = useState<ContentStats>({
    posts: 0,
    services: 0,
    caseStudies: 0,
    faqs: 0
  });

  const showSuccessToast = useSuccessToast();
  const showErrorToast = useErrorToast();

  const loadContentStats = useCallback(async () => {
    try {
      const [postsRes, servicesRes, caseStudiesRes, faqsRes] = await Promise.all([
        fetch(`/api/my/posts?organizationId=${organizationId}`, { cache: 'no-store' }),
        fetch(`/api/my/services?organizationId=${organizationId}`, { cache: 'no-store' }),
        fetch(`/api/my/case-studies?organizationId=${organizationId}`, { cache: 'no-store' }),
        fetch(`/api/my/faqs?organizationId=${organizationId}`, { cache: 'no-store' })
      ]);

      const [postsData, servicesData, caseStudiesData, faqsData] = await Promise.all([
        postsRes.ok ? postsRes.json() : { data: [] },
        servicesRes.ok ? servicesRes.json() : { data: [] },
        caseStudiesRes.ok ? caseStudiesRes.json() : { data: [] },
        faqsRes.ok ? faqsRes.json() : { data: [] }
      ]);

      setStats({
        posts: postsData.data?.length || 0,
        services: servicesData.data?.length || 0,
        caseStudies: caseStudiesData.data?.length || 0,
        faqs: faqsData.data?.length || 0
      });
    } catch (error) {
      logger.error('Failed to load content stats', { data: error instanceof Error ? error : new Error(String(error)) });
    }
  }, [organizationId]);

  // Load content stats for overview
  const loadTabContent = useCallback(async (tab: TabType) => {
    if (tab === 'overview') return;

    setLoading(prev => ({ ...prev, [tab]: true }));

    try {
      const endpoint = `/api/my/${tab === 'case-studies' ? 'case-studies' : tab}?organizationId=${organizationId}`;
      const response = await fetch(endpoint, { cache: 'no-store' });
      
      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];

        switch (tab) {
          case 'posts':
            setPosts(data);
            break;
          case 'services':
            setServices(data);
            break;
          case 'case-studies':
            setCaseStudies(data);
            break;
          case 'faqs':
            setFaqs(data);
            break;
        }
      }
    } catch (error) {
      logger.error(`Failed to load ${tab}:`, { data: error });
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [organizationId]);

  useEffect(() => {
    loadContentStats();
  }, [loadContentStats]);

  // Load content when tab changes
  useEffect(() => {
    if (activeTab !== 'overview') {
      loadTabContent(activeTab);
    }
  }, [activeTab, loadTabContent]);

  const handleDelete = useCallback(async (type: string, id: string) => {
    if (!confirm(`この${getContentTypeLabel(type)}を削除しますか？`)) return;

    try {
      const endpoint = `/api/my/${type}/${id}?organizationId=${organizationId}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove from state and update stats
      switch (type) {
        case 'posts':
          setPosts(prev => prev.filter(item => item.id !== id));
          setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
          break;
        case 'services':
          setServices(prev => prev.filter(item => item.id !== id));
          setStats(prev => ({ ...prev, services: prev.services - 1 }));
          break;
        case 'case-studies':
          setCaseStudies(prev => prev.filter(item => item.id !== id));
          setStats(prev => ({ ...prev, caseStudies: prev.caseStudies - 1 }));
          break;
        case 'faqs':
          setFaqs(prev => prev.filter(item => item.id !== id));
          setStats(prev => ({ ...prev, faqs: prev.faqs - 1 }));
          break;
      }
      showSuccessToast('削除完了', `${getContentTypeLabel(type)}を削除しました`);
    } catch (error) {
      logger.error(`Failed to delete ${type}:`, { data: error });
      showErrorToast('削除失敗', 'ネットワークエラーが発生しました');
    }
  }, [organizationId, showSuccessToast, showErrorToast]);

  const getContentTypeLabel = (type: string): string => {
    const labels = {
      posts: '記事',
      services: 'サービス',
      'case-studies': '導入事例',
      faqs: 'FAQ'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-[var(--aio-warning-muted)] text-[var(--aio-warning)]',
      published: 'bg-[var(--aio-success-muted)] text-[var(--aio-success)]'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const text = {
      draft: '下書き',
      published: '公開中'
    };
    return text[status as keyof typeof text] || '不明';
  };

  const tabs = [
    { id: 'overview' as TabType, label: '概要', count: null },
    { id: 'posts' as TabType, label: '記事', count: stats.posts },
    { id: 'services' as TabType, label: 'サービス', count: stats.services },
    { id: 'case-studies' as TabType, label: '導入事例', count: stats.caseStudies },
    { id: 'faqs' as TabType, label: 'FAQ', count: stats.faqs }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
          <div className="flex items-center">
            <div className="p-2 bg-[var(--aio-purple-muted)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--aio-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">記事</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.posts}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
          <div className="flex items-center">
            <div className="p-2 bg-[var(--aio-muted)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--aio-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">サービス</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.services}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
          <div className="flex items-center">
            <div className="p-2 bg-[var(--aio-success-muted)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--aio-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">導入事例</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.caseStudies}</p>
            </div>
          </div>
        </div>

        <div className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
          <div className="flex items-center">
            <div className="p-2 bg-[var(--aio-pending-muted)] rounded-lg">
              <svg className="w-5 h-5 text-[var(--aio-pending)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">FAQ</p>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">{stats.faqs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">クイック作成</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={ROUTES.dashboardPostsNew}
            className="flex items-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-lg hover:border-[var(--aio-purple)] hover:bg-[var(--aio-purple-muted)] transition-colors"
          >
            <div className="p-2 bg-[var(--aio-purple-muted)] rounded-lg mr-3">
              <svg className="w-5 h-5 text-[var(--aio-purple)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">新しい記事</span>
          </Link>

          <Link
            href={ROUTES.dashboardServicesNew}
            className="flex items-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-lg hover:border-[var(--aio-primary)] hover:bg-[var(--aio-muted)] transition-colors"
          >
            <div className="p-2 bg-[var(--aio-muted)] rounded-lg mr-3">
              <svg className="w-5 h-5 text-[var(--aio-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">新しいサービス</span>
          </Link>

          <Link
            href={ROUTES.dashboardCaseStudiesNew}
            className="flex items-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-lg hover:border-[var(--status-success)] hover:bg-[var(--aio-success-muted)] transition-colors"
          >
            <div className="p-2 bg-[var(--aio-success-muted)] rounded-lg mr-3">
              <svg className="w-5 h-5 text-[var(--aio-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">新しい導入事例</span>
          </Link>

          <Link
            href={ROUTES.dashboardFaqsNew}
            className="flex items-center p-4 border-2 border-dashed border-[var(--input-border)] rounded-lg hover:border-[var(--status-pending)] hover:bg-[var(--aio-pending-muted)] transition-colors"
          >
            <div className="p-2 bg-[var(--aio-pending-muted)] rounded-lg mr-3">
              <svg className="w-5 h-5 text-[var(--aio-pending)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">新しいFAQ</span>
          </Link>
        </div>
      </div>

      {/* Organization Preview Section */}
      {organizationSlug && (
        <OrganizationPreview 
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          organizationName={organizationName}
          isPublished={isPublished}
        />
      )}
    </div>
  );

  const renderContentList = (type: TabType, items: any[], emptyMessage: string) => {
    if (loading[type]) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
              <div className="h-4 bg-[var(--dashboard-card-border)] rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-[var(--dashboard-card-border)] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="mx-auto h-12 w-12 text-[var(--color-icon-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">コンテンツがありません</h3>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{emptyMessage}</p>
            <div className="mt-6">
              <Link
                href={`/dashboard/${type}/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {getContentTypeLabel(type)}を作成
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {getContentTypeLabel(type)}一覧 ({items.length}件)
          </h3>
          <Link
            href={`/dashboard/${type}/new`}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規作成
          </Link>
        </div>

        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-[var(--dashboard-card-bg)] rounded-lg border border-[var(--dashboard-card-border)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-[var(--color-text-primary)]">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      更新: {new Date(item.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    href={`/dashboard/${type}/${item.id}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-[var(--input-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--dashboard-card-bg)] hover:bg-[var(--aio-surface)]"
                  >
                    編集
                  </Link>
                  {organizationSlug && (
                    <>
                      {item.status === 'published' ? (
                        <Link
                          href={`/o/${organizationSlug}/${type}/${item.id}`}
                          target="_blank"
                          className="inline-flex items-center px-3 py-1 border border-[var(--input-border)] shadow-sm text-sm font-medium rounded-md text-[var(--color-text-secondary)] bg-[var(--dashboard-card-bg)] hover:bg-[var(--aio-surface)]"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          公開表示
                        </Link>
                      ) : (
                        <Link
                          href={`/o/${organizationSlug}/${type}/${item.id}?preview=true`}
                          target="_blank"
                          className="inline-flex items-center px-3 py-1 border border-[var(--aio-pending-border)] shadow-sm text-sm font-medium rounded-md text-[var(--aio-pending)] bg-[var(--aio-pending-surface)] hover:bg-[var(--aio-pending-muted)]"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          プレビュー
                        </Link>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(type, item.id)}
                    className="inline-flex items-center px-3 py-1 border border-[var(--status-error)] shadow-sm text-sm font-medium rounded-md text-[var(--aio-danger)] bg-[var(--dashboard-card-bg)] hover:bg-[var(--aio-danger-muted)]"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[var(--dashboard-card-bg)] rounded-lg shadow-sm border border-[var(--dashboard-card-border)]">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--dashboard-card-border)]">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-[var(--aio-primary)] text-[var(--aio-primary)]'
                  : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--input-border)]'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-[var(--aio-muted)] text-[var(--aio-primary)]' : 'bg-[var(--aio-surface)] text-[var(--color-text-secondary)]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'posts' && renderContentList('posts', posts, '最初の記事を作成してコンテンツマーケティングを始めましょう。')}
        {activeTab === 'services' && renderContentList('services', services, '提供するサービスを追加して、お客様にアピールしましょう。')}
        {activeTab === 'case-studies' && renderContentList('case-studies', caseStudies, '成功事例を追加して、実績をアピールしましょう。')}
        {activeTab === 'faqs' && renderContentList('faqs', faqs, 'よくある質問を追加して、お客様の疑問を解決しましょう。')}
      </div>
    </div>
  );
}