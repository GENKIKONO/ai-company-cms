/**
 * P2-6: CMS統合ダッシュボード - メインページ
 * 複数のコンテンツタイプを統合管理
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { supabaseBrowser } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import type {
  AdminContentListResponse,
  AdminContentListItem,
  AdminContentDashboardState,
  ContentTypeGroup,
  CmsContentStatus,
  AdminContentApiResponse,
  AdminContentApiError
} from '@/types/cms-content';
import {
  CONTENT_TYPE_GROUPS,
  CMS_CONTENT_TYPE_LABELS,
  CMS_CONTENT_STATUS_LABELS,
  CONTENT_SORT_OPTIONS
} from '@/types/cms-content';
import type { CmsGenerationSource } from '@/types/interview-generated';

/**
 * コンテンツタイプ選択サイドバー
 */
function ContentTypeGroupSidebar({
  selectedGroup,
  onGroupSelect
}: {
  selectedGroup: string;
  onGroupSelect: (groupKey: string) => void;
}) {
  return (
    <div className="w-64 bg-white border-r border-[var(--color-border)] p-4">
      <h3 className="hig-text-h4 hig-jp-heading mb-4">コンテンツタイプ</h3>
      <div className="space-y-2">
        {CONTENT_TYPE_GROUPS.map((group) => (
          <button
            key={group.key}
            onClick={() => onGroupSelect(group.key)}
            className={`
              w-full text-left p-3 rounded-lg border transition-colors
              ${selectedGroup === group.key 
                ? 'bg-[var(--color-primary-alpha-10)] border-[var(--color-primary)] text-[var(--color-primary)]' 
                : 'border-[var(--color-border)] hover:bg-[var(--color-background-hover)]'
              }
            `}
          >
            <div className="hig-text-body-bold hig-jp-body">{group.label}</div>
            <div className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
              {group.contentTypes.map(type => CMS_CONTENT_TYPE_LABELS[type]).join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * フィルタとソートバー
 */
function FilterBar({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  onRefresh,
  isLoading,
  aiGeneratedFilter,
  onAiGeneratedFilterChange
}: {
  selectedStatus: CmsContentStatus | 'all';
  onStatusChange: (status: CmsContentStatus | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  aiGeneratedFilter: 'all' | 'ai_only' | 'manual_only';
  onAiGeneratedFilterChange: (filter: 'all' | 'ai_only' | 'manual_only') => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--color-border)]">
      {/* ステータスフィルタ */}
      <div className="flex items-center gap-2">
        <label className="hig-text-caption text-[var(--color-text-secondary)]">ステータス:</label>
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as CmsContentStatus | 'all')}
          className="px-3 py-1 border border-[var(--color-border)] rounded-md hig-text-body"
        >
          <option value="all">すべて</option>
          <option value="draft">下書き</option>
          <option value="published">公開済み</option>
          <option value="archived">アーカイブ</option>
        </select>
      </div>

      {/* AI生成フィルタ */}
      <div className="flex items-center gap-2">
        <label className="hig-text-caption text-[var(--color-text-secondary)]">生成元:</label>
        <select
          value={aiGeneratedFilter}
          onChange={(e) => onAiGeneratedFilterChange(e.target.value as 'all' | 'ai_only' | 'manual_only')}
          className="px-3 py-1 border border-[var(--color-border)] rounded-md hig-text-body"
        >
          <option value="all">すべて</option>
          <option value="ai_only">AI生成のみ</option>
          <option value="manual_only">手動作成のみ</option>
        </select>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <label className="hig-text-caption text-[var(--color-text-secondary)]">検索:</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="タイトルやスラッグで検索..."
          className="flex-1 px-3 py-1 border border-[var(--color-border)] rounded-md hig-text-body"
        />
      </div>

      {/* ソート */}
      <div className="flex items-center gap-2">
        <label className="hig-text-caption text-[var(--color-text-secondary)]">並び替え:</label>
        <select
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1 border border-[var(--color-border)] rounded-md hig-text-body"
        >
          {CONTENT_SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 更新ボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <LoadingSpinner className="w-3 h-3" />
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        更新
      </Button>
    </div>
  );
}

/**
 * AI生成ソースのラベル表示
 */
function getGenerationSourceLabel(generationSource: string): string {
  const labels: Record<string, string> = {
    manual: '手動作成',
    interview_blog: 'AI生成(ブログ)',
    interview_qna: 'AI生成(Q&A)', 
    interview_case_study: 'AI生成(ケース)'
  };
  return labels[generationSource] || generationSource;
}

/**
 * AI生成バッジの色取得
 */
function getGenerationSourceBadgeColor(generationSource: string): string {
  if (generationSource === 'manual') {
    return 'bg-gray-100 text-gray-700';
  }
  return 'bg-purple-100 text-purple-800';
}

/**
 * コンテンツリストアイテム
 */
function ContentListItem({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: AdminContentListItem; 
  onEdit: (item: AdminContentListItem) => void;
  onDelete: (item: AdminContentListItem) => void;
}) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';
  
  const getStatusBadgeVariant = (status: CmsContentStatus): BadgeVariant => {
    const variants: Record<CmsContentStatus, BadgeVariant> = {
      draft: 'secondary',
      published: 'default',
      archived: 'outline'
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="p-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-background-hover)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="hig-text-body-bold hig-jp-body truncate">
              {item.title || 'タイトルなし'}
            </h4>
            <Badge className="text-xs">
              {CMS_CONTENT_TYPE_LABELS[item.content_type]}
            </Badge>
            <Badge variant={getStatusBadgeVariant(item.status)} className="text-xs">
              {CMS_CONTENT_STATUS_LABELS[item.status]}
            </Badge>
            {item.generation_source && item.generation_source !== 'manual' && (
              <Badge 
                variant="outline"
                className={`text-xs ${getGenerationSourceBadgeColor(item.generation_source)}`}
              >
                {getGenerationSourceLabel(item.generation_source)}
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="hig-text-caption text-[var(--color-text-secondary)]">
              スラッグ: {item.slug || 'なし'}
            </div>
            <div className="hig-text-caption text-[var(--color-text-secondary)]">
              テーブル: {item.source_table}
            </div>
            <div className="hig-text-caption text-[var(--color-text-secondary)]">
              作成: {formatDate(item.created_at)}
              {item.updated_at !== item.created_at && (
                <span className="ml-4">更新: {formatDate(item.updated_at)}</span>
              )}
              {item.published_at && (
                <span className="ml-4">公開: {formatDate(item.published_at)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
          >
            編集
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(item)}
          >
            削除
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * メインダッシュボード
 */
export default function AdminContentsDashboard() {
  const [organizationId, setOrganizationId] = useState<string>('');
  const [dashboardState, setDashboardState] = useState<AdminContentDashboardState>({
    selectedGroup: 'all',
    selectedStatus: 'all',
    searchQuery: '',
    currentPage: 1,
    pageSize: 20,
    isLoading: false,
    error: null,
    aiGeneratedFilter: 'all'
  });
  const [sortOption, setSortOption] = useState<string>('updated_desc');

  const [contents, setContents] = useState<AdminContentListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // 組織ID取得
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
        logger.error('Failed to get organization ID:', { error });
        setDashboardState(prev => ({ ...prev, error: '組織情報の取得に失敗しました' }));
      }
    };

    getOrganizationId();
  }, []);

  // データ取得
  const fetchContents = useCallback(async () => {
    if (!organizationId) return;

    setDashboardState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // クエリパラメータ構築
      const params = new URLSearchParams({
        orgId: organizationId,
        page: dashboardState.currentPage.toString(),
        pageSize: dashboardState.pageSize.toString()
      });

      // コンテンツタイプフィルタ
      const selectedGroup = CONTENT_TYPE_GROUPS.find(g => g.key === dashboardState.selectedGroup);
      if (selectedGroup && selectedGroup.key !== 'all') {
        params.set('contentType', selectedGroup.contentTypes.join(','));
      }

      // ステータスフィルタ
      if (dashboardState.selectedStatus !== 'all') {
        params.set('status', dashboardState.selectedStatus);
      }

      // 検索クエリ
      if (dashboardState.searchQuery.trim()) {
        params.set('q', dashboardState.searchQuery.trim());
      }

      // AI生成フィルタ
      if (dashboardState.aiGeneratedFilter !== 'all') {
        params.set('generationSource', dashboardState.aiGeneratedFilter);
      }

      // ソート
      params.set('sort', sortOption);

      const response = await fetch(`/api/my/admin/contents?${params}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        setDashboardState(prev => ({ ...prev, error: errorMessage }));
        return;
      }

      const result: AdminContentApiResponse<AdminContentListResponse> = await response.json();
      
      if (!result.success) {
        const errorMessage = (result as AdminContentApiError).message || 'Failed to fetch contents';
        setDashboardState(prev => ({ ...prev, error: errorMessage }));
        return;
      }

      const successResult = result as AdminContentListResponse;
      setContents(successResult.items);
      setTotalItems(successResult.total);
      setHasMore(successResult.hasMore);

      logger.info('Admin contents fetched successfully', {
        itemsCount: successResult.items.length,
        total: successResult.total,
        page: successResult.page
      });

    } catch (error: any) {
      logger.error('Failed to fetch admin contents:', { error: error.message });
      setDashboardState(prev => ({ 
        ...prev, 
        error: error.message || 'データの取得に失敗しました' 
      }));
    } finally {
      setDashboardState(prev => ({ ...prev, isLoading: false }));
    }
  }, [organizationId, dashboardState.selectedGroup, dashboardState.selectedStatus, dashboardState.searchQuery, dashboardState.currentPage, dashboardState.pageSize, dashboardState.aiGeneratedFilter, sortOption]);

  // データ取得（依存関係変更時）
  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  // イベントハンドラ
  const handleGroupSelect = (groupKey: string) => {
    setDashboardState(prev => ({ 
      ...prev, 
      selectedGroup: groupKey, 
      currentPage: 1 
    }));
  };

  const handleStatusChange = (status: CmsContentStatus | 'all') => {
    setDashboardState(prev => ({ 
      ...prev, 
      selectedStatus: status, 
      currentPage: 1 
    }));
  };

  const handleSearchChange = (query: string) => {
    setDashboardState(prev => ({ 
      ...prev, 
      searchQuery: query, 
      currentPage: 1 
    }));
  };

  const handleSortChange = (newSortOption: string) => {
    setSortOption(newSortOption);
    setDashboardState(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAiGeneratedFilterChange = (filter: 'all' | 'ai_only' | 'manual_only') => {
    setDashboardState(prev => ({ 
      ...prev, 
      aiGeneratedFilter: filter, 
      currentPage: 1 
    }));
  };

  const handleRefresh = () => {
    fetchContents();
  };

  const handleEdit = (item: AdminContentListItem) => {
    // コンテンツタイプに応じて適切な編集ページへナビゲート
    const editRoutes: Record<string, string> = {
      posts: `/dashboard/posts/${item.id}/edit`,
      news: `/dashboard/news/${item.id}/edit`,
      faqs: `/my/faqs/${item.id}/edit`,
      case_studies: `/dashboard/case-studies/${item.id}/edit`,
      qa_entries: `/dashboard/qa/${item.id}/edit`,
      sales_materials: `/dashboard/materials/${item.id}/edit`,
      ai_interview_sessions: `/dashboard/interviews/${item.id}/edit`,
      services: `/dashboard/services/${item.id}/edit`
    };

    const editPath = editRoutes[item.source_table];
    if (editPath) {
      window.location.href = editPath;
    } else {
      // 汎用編集ページへのフォールバック
      window.location.href = `/dashboard/admin/contents/${item.source_table}/${item.id}/edit?orgId=${organizationId}`;
    }

    logger.info('Edit navigation:', { itemId: item.id, sourceTable: item.source_table });
  };

  const handleDelete = async (item: AdminContentListItem) => {
    if (!confirm(`${item.title || 'この項目'}を削除しますか？`)) return;

    try {
      const response = await fetch(
        `/api/my/admin/contents/${item.source_table}/${item.id}?orgId=${organizationId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || '削除に失敗しました';
        logger.error('Failed to delete content:', { error: errorMessage });
        alert('削除に失敗しました: ' + errorMessage);
        return;
      }

      // リストから削除
      setContents(contents.filter(c => c.id !== item.id));
      setTotalItems(prev => prev - 1);

      logger.info('Content deleted successfully:', { itemId: item.id });

    } catch (error: any) {
      logger.error('Failed to delete content:', { error: error.message });
      alert('削除に失敗しました: ' + error.message);
    }
  };

  if (dashboardState.isLoading && contents.length === 0) {
    return (
      <div className="">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
            <span className="ml-2 hig-text-body text-[var(--color-text-secondary)]">
              コンテンツを読み込んでいます...
            </span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="hig-text-h1 hig-jp-heading">コンテンツ管理</h1>
              <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
                すべてのコンテンツタイプを統合管理
              </p>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <DashboardBackLink />

        {/* エラー表示 */}
        {dashboardState.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {dashboardState.error}
              <button 
                onClick={handleRefresh}
                className="ml-2 underline hover:no-underline"
              >
                再試行
              </button>
            </AlertDescription>
          </Alert>
        )}

        {/* メインコンテンツ */}
        <div className="flex gap-6">
          {/* サイドバー */}
          <ContentTypeGroupSidebar
            selectedGroup={dashboardState.selectedGroup}
            onGroupSelect={handleGroupSelect}
          />

          {/* メインエリア */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle className="hig-text-h3 hig-jp-heading">
                  コンテンツ一覧 ({totalItems}件)
                </CardTitle>
              </CardHeader>

              {/* フィルタバー */}
              <FilterBar
                selectedStatus={dashboardState.selectedStatus}
                onStatusChange={handleStatusChange}
                searchQuery={dashboardState.searchQuery}
                onSearchChange={handleSearchChange}
                sortOption={sortOption}
                onSortChange={handleSortChange}
                onRefresh={handleRefresh}
                isLoading={dashboardState.isLoading}
                aiGeneratedFilter={dashboardState.aiGeneratedFilter}
                onAiGeneratedFilterChange={handleAiGeneratedFilterChange}
              />

              <CardContent className="p-0">
                {contents.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="space-y-3">
                      <p className="hig-text-body text-[var(--color-text-secondary)]">
                        コンテンツが見つかりませんでした
                      </p>
                      <p className="hig-text-caption text-[var(--color-text-tertiary)]">
                        フィルタ条件を変更するか、新しいコンテンツを作成してください
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {contents.map((item) => (
                      <ContentListItem
                        key={`${item.source_table}-${item.id}`}
                        item={item}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                    
                    {/* ページネーション */}
                    {hasMore && (
                      <div className="p-4 text-center border-t border-[var(--color-border)]">
                        <Button
                          variant="outline"
                          onClick={() => setDashboardState(prev => ({ 
                            ...prev, 
                            currentPage: prev.currentPage + 1 
                          }))}
                          disabled={dashboardState.isLoading}
                        >
                          さらに読み込む
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}