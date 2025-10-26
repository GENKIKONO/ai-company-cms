'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useState, useEffect } from 'react';
import { 
  HIGCard,
  HIGCardHeader,
  HIGCardTitle,
  HIGCardContent,
  HIGCardGrid
} from '@/components/ui/HIGCard';
import { HIGButton } from '@/components/ui/HIGButton';
import { 
  BarChart3, 
  Download, 
  Eye, 
  MessageSquare,
  Calendar,
  RefreshCw,
  FileText,
  Filter,
  TrendingUp,
  Users,
  Hash,
  Building
} from 'lucide-react';
import {
  QAStatsResponse,
  QAStatsFilters,
  getPresetDateRange,
  validateDateRange
} from '@/lib/qna-stats';

export default function CompanyQAStatsPage() {
  // State管理
  const [stats, setStats] = useState<QAStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'daily' | 'byQNA' | null>(null);
  
  // フィルター状態
  const [filters, setFilters] = useState<QAStatsFilters>(() => {
    const defaultRange = getPresetDateRange('30d');
    return {
      from: defaultRange.from,
      to: defaultRange.to
    };
  });

  // 期間プリセット
  const [selectedPreset, setSelectedPreset] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // データ取得
  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.qnaId) params.set('qnaId', filters.qnaId);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);

      const response = await fetch(`/api/my/qna-stats?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setStats(result);
      
    } catch (err) {
      console.error('Failed to load Q&A stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Q&A stats');
    } finally {
      setLoading(false);
    }
  };

  // プリセット期間変更
  const handlePresetChange = (preset: '7d' | '30d' | '90d') => {
    setSelectedPreset(preset);
    const range = getPresetDateRange(preset);
    setFilters(prev => ({
      ...prev,
      from: range.from,
      to: range.to
    }));
  };

  // カスタム期間変更
  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    const newFilters = { ...filters, [field]: value };
    const validation = validateDateRange(newFilters.from || '', newFilters.to || '');
    
    if (validation.valid) {
      setSelectedPreset('custom');
      setFilters(newFilters);
    }
  };

  // CSVエクスポート
  const handleExport = async (type: 'daily' | 'byQNA') => {
    try {
      setExporting(type);

      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.categoryId) params.set('categoryId', filters.categoryId);
      params.set('type', type);

      const response = await fetch(`/api/my/qna-stats/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // ファイルダウンロード処理
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // ファイル名をContent-Dispositionヘッダーから取得
      const disposition = response.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || 
                      `my-qna-stats-${type}-${Date.now()}.csv`;
      
      a.download = decodeURIComponent(filename);
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(null);
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-[var(--color-background-secondary)] rounded w-1/3"></div>
            <HIGCardGrid columns={3} gap="lg">
              {[...Array(3)].map((_, i) => (
                <HIGCard key={i} className="h-32">
                  <div className="h-full bg-[var(--color-background-secondary)] rounded"></div>
                </HIGCard>
              ))}
            </HIGCardGrid>
            <div className="h-96 bg-[var(--color-background-secondary)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="hig-text-h1 text-[var(--color-text-primary)] flex items-center gap-3">
              <Building className="h-8 w-8 text-[var(--color-primary)]" />
              Q&A統計分析
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              あなたの企業のQ&A閲覧・注目度統計
            </p>
          </div>
          <div className="flex gap-3">
            <HIGButton
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={loadStats}
              loading={loading}
            >
              更新
            </HIGButton>
          </div>
        </div>

        {/* フィルター */}
        <HIGCard>
          <HIGCardHeader>
            <HIGCardTitle level={2}>
              <Filter className="h-5 w-5 inline mr-2" />
              期間フィルター
            </HIGCardTitle>
          </HIGCardHeader>
          <HIGCardContent>
            <div className="space-y-4">
              {/* プリセット期間 */}
              <div>
                <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                  期間プリセット
                </label>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d'] as const).map((preset) => (
                    <HIGButton
                      key={preset}
                      variant={selectedPreset === preset ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handlePresetChange(preset)}
                    >
                      {preset === '7d' && '過去7日間'}
                      {preset === '30d' && '過去30日間'}
                      {preset === '90d' && '過去90日間'}
                    </HIGButton>
                  ))}
                </div>
              </div>

              {/* カスタム期間 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                    開始日
                  </label>
                  <input
                    type="date"
                    value={filters.from || ''}
                    onChange={(e) => handleCustomDateChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                             bg-[var(--color-background)] text-[var(--color-text-primary)]
                             focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="hig-text-caption text-[var(--color-text-secondary)] block mb-2">
                    終了日
                  </label>
                  <input
                    type="date"
                    value={filters.to || ''}
                    onChange={(e) => handleCustomDateChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg 
                             bg-[var(--color-background)] text-[var(--color-text-primary)]
                             focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </HIGCardContent>
        </HIGCard>

        {/* エラー表示 */}
        {error && (
          <HIGCard variant="filled" className="border-l-4 border-l-[var(--color-error)]">
            <HIGCardContent>
              <p className="text-[var(--color-error)]">{error}</p>
            </HIGCardContent>
          </HIGCard>
        )}

        {stats && (
          <>
            {/* KPI カード */}
            <HIGCardGrid columns={3} gap="lg">
              <HIGCard variant="elevated">
                <HIGCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="hig-text-caption text-[var(--color-text-secondary)]">総閲覧数</p>
                      <p className="hig-text-h2 text-[var(--color-primary)] mt-1">
                        {stats.totals.views.toLocaleString()}
                      </p>
                      <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                        {filters.from && filters.to && `${filters.from} ～ ${filters.to}`}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>

              <HIGCard variant="elevated">
                <HIGCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="hig-text-caption text-[var(--color-text-secondary)]">対象Q&A数</p>
                      <p className="hig-text-h2 text-[var(--color-secondary)] mt-1">
                        {stats.totals.entries.toLocaleString()}
                      </p>
                      <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                        あなたの企業のQ&A
                      </p>
                    </div>
                    <Hash className="h-8 w-8 text-[var(--color-secondary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>

              <HIGCard variant="elevated">
                <HIGCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="hig-text-caption text-[var(--color-text-secondary)]">平均閲覧数</p>
                      <p className="hig-text-h2 text-[var(--color-tertiary)] mt-1">
                        {stats.totals.entries > 0 
                          ? (stats.totals.views / stats.totals.entries).toFixed(1)
                          : '0.0'
                        }
                      </p>
                      <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                        1Q&Aあたり
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-[var(--color-tertiary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>
            </HIGCardGrid>

            {/* CSVエクスポート */}
            <HIGCard>
              <HIGCardHeader>
                <HIGCardTitle level={2}>
                  <Download className="h-5 w-5 inline mr-2" />
                  データエクスポート
                </HIGCardTitle>
              </HIGCardHeader>
              <HIGCardContent>
                <div className="flex flex-wrap gap-4">
                  <HIGButton
                    variant="secondary"
                    leftIcon={<FileText className="h-4 w-4" />}
                    onClick={() => handleExport('daily')}
                    loading={exporting === 'daily'}
                    disabled={!!exporting}
                  >
                    日別統計をCSVでエクスポート
                  </HIGButton>
                  
                  <HIGButton
                    variant="secondary"
                    leftIcon={<FileText className="h-4 w-4" />}
                    onClick={() => handleExport('byQNA')}
                    loading={exporting === 'byQNA'}
                    disabled={!!exporting}
                  >
                    Q&A別統計をCSVでエクスポート
                  </HIGButton>
                </div>
                <p className="hig-text-caption text-[var(--color-text-secondary)] mt-3">
                  ※ あなたの企業のQ&Aデータのみエクスポートされます
                </p>
              </HIGCardContent>
            </HIGCard>

            {/* 人気Q&Aランキング */}
            {stats.topEntries.length > 0 && (
              <HIGCard>
                <HIGCardHeader>
                  <HIGCardTitle level={2}>
                    <TrendingUp className="h-5 w-5 inline mr-2" />
                    人気Q&Aランキング (TOP {stats.topEntries.length})
                  </HIGCardTitle>
                </HIGCardHeader>
                <HIGCardContent>
                  <div className="space-y-4">
                    {stats.topEntries.map((entry, index) => (
                      <div key={entry.qnaId} className="flex items-center gap-4 p-4 bg-[var(--color-background-secondary)] rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center hig-text-caption font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="hig-text-body font-medium text-[var(--color-text-primary)] truncate">
                            {entry.question}
                          </h4>
                          {entry.categoryName && (
                            <p className="hig-text-caption text-[var(--color-text-secondary)] mt-1">
                              カテゴリ: {entry.categoryName}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="hig-text-body font-semibold text-[var(--color-primary)]">
                            {entry.views}回閲覧
                          </p>
                          <p className="hig-text-caption text-[var(--color-text-secondary)]">
                            ユニーク: {entry.uniqueViews}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </HIGCardContent>
              </HIGCard>
            )}

            {/* Q&A別詳細統計 */}
            {stats.byQNA.length > 0 && (
              <HIGCard>
                <HIGCardHeader>
                  <HIGCardTitle level={2}>
                    <BarChart3 className="h-5 w-5 inline mr-2" />
                    Q&A別詳細統計
                  </HIGCardTitle>
                </HIGCardHeader>
                <HIGCardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[var(--color-border-secondary)]">
                          <th className="text-left py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">質問</th>
                          <th className="text-left py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">カテゴリ</th>
                          <th className="text-right py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">閲覧数</th>
                          <th className="text-right py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">ユニーク</th>
                          <th className="text-left py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">最終アクティビティ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.byQNA.map((item) => (
                          <tr key={item.qnaId} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]">
                            <td className="py-3 px-4 hig-text-body text-[var(--color-text-primary)] max-w-xs truncate">
                              {item.question}
                            </td>
                            <td className="py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">
                              {item.categoryName || '未分類'}
                            </td>
                            <td className="py-3 px-4 hig-text-body text-[var(--color-primary)] text-right font-semibold">
                              {item.views}
                            </td>
                            <td className="py-3 px-4 hig-text-caption text-[var(--color-text-secondary)] text-right">
                              {item.uniqueViews}
                            </td>
                            <td className="py-3 px-4 hig-text-caption text-[var(--color-text-secondary)]">
                              {new Date(item.lastActivityAt).toLocaleDateString('ja-JP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </HIGCardContent>
              </HIGCard>
            )}

            {/* データが空の場合のメッセージ */}
            {stats.totals.views === 0 && (
              <HIGCard>
                <HIGCardContent>
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                    <h3 className="hig-text-h3 text-[var(--color-text-secondary)] mb-2">
                      統計データがありません
                    </h3>
                    <p className="hig-text-body text-[var(--color-text-secondary)]">
                      選択した期間内にQ&Aの閲覧がありませんでした。<br />
                      Q&Aコンテンツを充実させて、ユーザーのエンゲージメントを高めましょう。
                    </p>
                  </div>
                </HIGCardContent>
              </HIGCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}