/**
 * P2-5: AI引用ログ可視化ダッシュボード - 新アーキテクチャ版
 * 組織管理者向け：組織の引用データを期間別に表示
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardPageShell, useDashboardPageContext } from '@/components/dashboard';
import {
  DashboardPageHeader,
  DashboardCard,
  DashboardCardHeader,
  DashboardCardContent,
  DashboardButton,
  DashboardAlert,
  DashboardBadge,
  DashboardSelect,
  DashboardLoadingState,
} from '@/components/dashboard/ui';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getCurrentUserClient } from '@/lib/core/auth-state.client';
import { logger } from '@/lib/utils/logger';
import type {
  OrgCitationsPeriodResponse,
  AICitationSource,
  AICitationsApiResponse,
  AICitationsApiErrorResponse,
  PeriodPreset,
  CitationDisplayOptions
} from '@/types/ai-citations';

interface DashboardState {
  organizationId: string | null;
  data: OrgCitationsPeriodResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedPreset: PeriodPreset;
  displayOptions: CitationDisplayOptions;
}

/**
 * 期間プリセットから実際の日付範囲を計算
 */
function getDateRangeFromPreset(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let fromDate: Date;
  switch (preset) {
    case 'last7days':
      fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30days':
      fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last90days':
      fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  const toDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // 明日まで含む
  
  return {
    from: fromDate.toISOString().split('T')[0],
    to: toDate.toISOString().split('T')[0]
  };
}

/**
 * 数値のフォーマット（3桁区切り）
 */
function formatNumber(num: number): string {
  return num.toLocaleString('ja-JP');
}

/**
 * スコアの表示フォーマット
 */
function formatScore(score: number | null): string {
  return score !== null ? score.toFixed(3) : 'N/A';
}

/**
 * 日付の表示フォーマット
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 引用ソースのテーブル行コンポーネント
 */
function CitationSourceRow({ source, index }: { source: AICitationSource; index: number }) {
  return (
    <tr className="border-t border-[var(--color-border)] hover:bg-[var(--color-background-secondary)]">
      <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">
        {index + 1}
      </td>
      <td className="py-3 px-4">
        <div className="space-y-1">
          <div className="hig-text-body-bold hig-jp-body">
            {source.title || 'タイトルなし'}
          </div>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hig-text-caption text-[var(--color-primary)] hover:underline hig-jp-body block truncate max-w-md"
              title={source.url}
            >
              {source.url}
            </a>
          )}
          <div className="hig-text-caption text-[var(--color-text-tertiary)]">
            {source.sourceKey}
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <DashboardBadge variant="default">
          {formatNumber(source.citationsCount)}
        </DashboardBadge>
      </td>
      <td className="py-3 px-4 text-center hig-text-code">
        {formatNumber(source.totalQuotedTokens)}
      </td>
      <td className="py-3 px-4 text-center hig-text-code">
        {formatScore(source.maxScore)}
      </td>
      <td className="py-3 px-4 text-center hig-text-caption text-[var(--color-text-secondary)]">
        {formatDate(source.lastCitedAt)}
      </td>
    </tr>
  );
}

export default function AICitationsDashboardPage() {
  return (
    <DashboardPageShell
      title="AI引用ログダッシュボード"
      requiredRole="admin"
    >
      <AICitationsContent />
    </DashboardPageShell>
  );
}

function AICitationsContent() {
  const { organization } = useDashboardPageContext();
  const [state, setState] = useState<DashboardState>({
    organizationId: null,
    data: null,
    isLoading: false,
    error: null,
    selectedPreset: 'last30days',
    displayOptions: {
      sortBy: 'maxScore',
      sortOrder: 'desc',
      showEmptySources: false
    }
  });

  // 組織IDの取得
  useEffect(() => {
    const getOrganizationId = async () => {
      try {
        const supabase = supabaseBrowser;
        const user = await getCurrentUserClient();
        
        if (!user) {
          setState(prev => ({ 
            ...prev, 
            error: '認証が必要です。ログインしてください。' 
          }));
          return;
        }

        // 組織メンバーシップから組織IDを取得（owner/admin権限チェック含む）
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .in('role', ['owner', 'admin'])
          .single();
        
        if (!membership) {
          setState(prev => ({ 
            ...prev, 
            error: '管理者権限が必要です。この機能にアクセスできません。' 
          }));
          return;
        }

        setState(prev => ({ 
          ...prev, 
          organizationId: membership.organization_id 
        }));
      } catch (error) {
        logger.error('Failed to get organization ID:', { data: error });
        setState(prev => ({ 
          ...prev, 
          error: '組織情報の取得に失敗しました。' 
        }));
      }
    };

    getOrganizationId();
  }, []);

  // データ取得
  const fetchCitationsData = useCallback(async () => {
    if (!state.organizationId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { from, to } = getDateRangeFromPreset(state.selectedPreset);
      const queryParams = new URLSearchParams({
        orgId: state.organizationId,
        from,
        to
      });

      const response = await fetch(`/api/my/ai-citations?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AICitationsApiResponse<OrgCitationsPeriodResponse> = await response.json();
      
      if (!result.success) {
        throw new Error((result as AICitationsApiErrorResponse).message);
      }

      setState(prev => ({ 
        ...prev, 
        data: result.data,
        isLoading: false 
      }));

      logger.info('AI citations data fetched successfully', {
        orgId: state.organizationId,
        period: state.selectedPreset,
        sourcesCount: result.data.sources.length
      });

    } catch (error: any) {
      logger.error('Failed to fetch citations data:', { error: error.message });
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
    }
  }, [state.organizationId, state.selectedPreset]);

  // 組織ID取得後とプリセット変更時にデータ取得
  useEffect(() => {
    fetchCitationsData();
  }, [fetchCitationsData]);

  // 期間変更ハンドラ
  const handlePresetChange = (preset: PeriodPreset) => {
    setState(prev => ({ 
      ...prev, 
      selectedPreset: preset 
    }));
  };

  // 再読込ハンドラ
  const handleRefresh = () => {
    fetchCitationsData();
  };

  // ソート済みソースの計算
  const sortedSources = state.data?.sources
    .filter(source => state.displayOptions.showEmptySources || source.citationsCount > 0)
    .sort((a, b) => {
      const { sortBy, sortOrder } = state.displayOptions;
      let aVal, bVal;

      switch (sortBy) {
        case 'maxScore':
          aVal = a.maxScore ?? -1;
          bVal = b.maxScore ?? -1;
          break;
        case 'citationsCount':
          aVal = a.citationsCount;
          bVal = b.citationsCount;
          break;
        case 'lastCitedAt':
          aVal = new Date(a.lastCitedAt).getTime();
          bVal = new Date(b.lastCitedAt).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }) || [];

  const presetLabels: Record<PeriodPreset, string> = {
    last7days: '直近7日',
    last30days: '直近30日',
    last90days: '直近90日',
    custom: 'カスタム'
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="hig-text-h1 hig-jp-heading mb-2">AI引用ログダッシュボード</h1>
          <p className="hig-text-body text-[var(--color-text-secondary)] hig-jp-body">
            AIが利用した引用元の統計情報を確認できます。
          </p>
        </div>

        {/* エラー表示 */}
        {state.error && (
          <DashboardAlert variant="error" className="mb-6">
            <p>
              {state.error}
              {state.organizationId && (
                <button
                  onClick={handleRefresh}
                  className="ml-2 underline hover:no-underline"
                >
                  再試行
                </button>
              )}
            </p>
          </DashboardAlert>
        )}

        {/* コントロール */}
        <DashboardCard className="mb-6">
          <DashboardCardHeader>
            <h3 className="hig-text-h3 hig-jp-heading">フィルター</h3>
          </DashboardCardHeader>
          <DashboardCardContent>
            <div className="flex items-center gap-4">
              <DashboardSelect
                label="期間"
                value={state.selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value as PeriodPreset)}
                options={Object.entries(presetLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
                className="w-40"
              />

              <DashboardButton
                variant="secondary"
                onClick={handleRefresh}
                loading={state.isLoading}
              >
                更新
              </DashboardButton>
            </div>
          </DashboardCardContent>
        </DashboardCard>

        {/* サマリー */}
        {state.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <DashboardCard>
              <DashboardCardContent>
                <div className="text-center">
                  <div className="hig-text-h2 text-[var(--color-primary)]">
                    {formatNumber(state.data.totals.totalCitations)}
                  </div>
                  <div className="hig-text-caption text-[var(--color-text-secondary)]">
                    総引用回数
                  </div>
                </div>
              </DashboardCardContent>
            </DashboardCard>

            <DashboardCard>
              <DashboardCardContent>
                <div className="text-center">
                  <div className="hig-text-h2 text-[var(--color-primary)]">
                    {formatNumber(state.data.totals.uniqueSources)}
                  </div>
                  <div className="hig-text-caption text-[var(--color-text-secondary)]">
                    引用元数
                  </div>
                </div>
              </DashboardCardContent>
            </DashboardCard>

            <DashboardCard>
              <DashboardCardContent>
                <div className="text-center">
                  <div className="hig-text-h2 text-[var(--color-primary)]">
                    {formatNumber(state.data.totals.totalQuotedTokens)}
                  </div>
                  <div className="hig-text-caption text-[var(--color-text-secondary)]">
                    総引用トークン数
                  </div>
                </div>
              </DashboardCardContent>
            </DashboardCard>

            <DashboardCard>
              <DashboardCardContent>
                <div className="text-center">
                  <div className="hig-text-h2 text-[var(--color-primary)]">
                    {formatNumber(Math.round(state.data.totals.totalWeight))}
                  </div>
                  <div className="hig-text-caption text-[var(--color-text-secondary)]">
                    総重み
                  </div>
                </div>
              </DashboardCardContent>
            </DashboardCard>
          </div>
        )}

        {/* 引用元一覧テーブル */}
        <DashboardCard>
          <DashboardCardHeader>
            <h3 className="hig-text-h3 hig-jp-heading">
              引用元詳細
              {state.data && (
                <span className="ml-2 hig-text-body text-[var(--color-text-secondary)]">
                  ({sortedSources.length}件)
                </span>
              )}
            </h3>
          </DashboardCardHeader>
          <DashboardCardContent>
            {state.isLoading ? (
              <DashboardLoadingState message="データを読み込んでいます" />
            ) : sortedSources.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="py-3 px-4 text-left hig-text-caption text-[var(--color-text-secondary)]">
                        #
                      </th>
                      <th className="py-3 px-4 text-left hig-text-caption text-[var(--color-text-secondary)]">
                        引用元
                      </th>
                      <th className="py-3 px-4 text-center hig-text-caption text-[var(--color-text-secondary)]">
                        引用回数
                      </th>
                      <th className="py-3 px-4 text-center hig-text-caption text-[var(--color-text-secondary)]">
                        トークン数
                      </th>
                      <th className="py-3 px-4 text-center hig-text-caption text-[var(--color-text-secondary)]">
                        最大スコア
                      </th>
                      <th className="py-3 px-4 text-center hig-text-caption text-[var(--color-text-secondary)]">
                        最終引用日時
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSources.map((source, index) => (
                      <CitationSourceRow
                        key={source.sourceKey}
                        source={source}
                        index={index}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : state.data ? (
              <div className="text-center py-12">
                <div className="space-y-2">
                  <p className="hig-text-body text-[var(--color-text-secondary)]">
                    選択した期間に引用データがありません
                  </p>
                  <p className="hig-text-caption text-[var(--color-text-tertiary)]">
                    期間を変更してお試しください
                  </p>
                </div>
              </div>
            ) : null}
          </DashboardCardContent>
        </DashboardCard>
      </div>
    </div>
  );
}