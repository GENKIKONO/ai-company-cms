'use client';

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
  TrendingUp,
  Calendar,
  RefreshCw,
  FileText,
  Filter,
  ExternalLink
} from 'lucide-react';
import {
  MaterialStatsResponse,
  MaterialStatsFilters,
  getPresetDateRange,
  isValidDateString
} from '@/lib/material-stats';

export default function MaterialStatsPage() {
  // State管理
  const [stats, setStats] = useState<MaterialStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'daily' | 'byMaterial' | null>(null);
  
  // フィルター状態
  const [filters, setFilters] = useState<MaterialStatsFilters>(() => {
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
      if (filters.materialId) params.set('materialId', filters.materialId);

      const response = await fetch(`/api/admin/material-stats?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setStats(result);
      
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
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
    if (isValidDateString(value)) {
      setSelectedPreset('custom');
      setFilters(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // CSVエクスポート
  const handleExport = async (type: 'daily' | 'byMaterial') => {
    try {
      setExporting(type);

      const params = new URLSearchParams();
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.materialId) params.set('materialId', filters.materialId);
      params.set('type', type);

      const response = await fetch(`/api/admin/material-stats/export?${params}`);
      
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
                      `material-stats-${type}-${Date.now()}.csv`;
      
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
              <BarChart3 className="h-8 w-8 text-[var(--color-primary)]" />
              営業資料統計ダッシュボード
            </h1>
            <p className="hig-text-body text-[var(--color-text-secondary)] mt-2">
              営業資料の閲覧・ダウンロード統計を詳細分析
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
                    </div>
                    <Eye className="h-8 w-8 text-[var(--color-primary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>

              <HIGCard variant="elevated">
                <HIGCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="hig-text-caption text-[var(--color-text-secondary)]">総ダウンロード数</p>
                      <p className="hig-text-h2 text-[var(--color-secondary)] mt-1">
                        {stats.totals.downloads.toLocaleString()}
                      </p>
                    </div>
                    <Download className="h-8 w-8 text-[var(--color-secondary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>

              <HIGCard variant="elevated">
                <HIGCardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="hig-text-caption text-[var(--color-text-secondary)]">対象資料数</p>
                      <p className="hig-text-h2 text-[var(--color-text-primary)] mt-1">
                        {stats.byMaterial.length}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-[var(--color-text-secondary)] opacity-60" />
                  </div>
                </HIGCardContent>
              </HIGCard>
            </HIGCardGrid>

            {/* 日別推移グラフ */}
            <HIGCard>
              <HIGCardHeader>
                <HIGCardTitle level={2}>
                  <TrendingUp className="h-5 w-5 inline mr-2" />
                  日別アクティビティ推移
                </HIGCardTitle>
              </HIGCardHeader>
              <HIGCardContent>
                <div className="space-y-4">
                  {stats.daily.slice(-14).map((day, index) => {
                    const maxValue = Math.max(...stats.daily.map(d => Math.max(d.views, d.downloads)));
                    return (
                      <div key={day.date} className="flex items-center gap-4">
                        <div className="w-20 text-sm text-[var(--color-text-secondary)]">
                          {new Date(day.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-[var(--color-primary)] w-8">閲覧</div>
                            <div className="flex-1 bg-[var(--color-background-secondary)] rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(day.views / maxValue * 100, 2)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] w-8 text-right">{day.views}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-[var(--color-secondary)] w-8">DL</div>
                            <div className="flex-1 bg-[var(--color-background-secondary)] rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-[var(--color-secondary)] h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(day.downloads / maxValue * 100, 2)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] w-8 text-right">{day.downloads}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </HIGCardContent>
            </HIGCard>

            {/* 人気資料ランキング */}
            {stats.topMaterials.length > 0 && (
              <HIGCard>
                <HIGCardHeader>
                  <HIGCardTitle level={2}>人気資料 TOP5</HIGCardTitle>
                </HIGCardHeader>
                <HIGCardContent>
                  <div className="space-y-3">
                    {stats.topMaterials.map((material, index) => (
                      <div key={material.materialId} className="flex items-center gap-4 p-3 bg-[var(--color-background-secondary)] rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--color-text-primary)] truncate">{material.title}</p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {material.views}回閲覧 • {material.downloads}回ダウンロード • スコア: {material.score}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </HIGCardContent>
              </HIGCard>
            )}

            {/* CSVエクスポート */}
            <HIGCard>
              <HIGCardHeader>
                <HIGCardTitle level={2}>データエクスポート</HIGCardTitle>
              </HIGCardHeader>
              <HIGCardContent>
                <div className="flex gap-4">
                  <HIGButton
                    variant="secondary"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleExport('daily')}
                    loading={exporting === 'daily'}
                  >
                    日別統計をCSVでエクスポート
                  </HIGButton>
                  <HIGButton
                    variant="secondary"
                    leftIcon={<Download className="h-4 w-4" />}
                    onClick={() => handleExport('byMaterial')}
                    loading={exporting === 'byMaterial'}
                  >
                    資料別統計をCSVでエクスポート
                  </HIGButton>
                </div>
              </HIGCardContent>
            </HIGCard>

            {/* 資料別統計テーブル */}
            <HIGCard>
              <HIGCardHeader>
                <HIGCardTitle level={2}>資料別詳細統計</HIGCardTitle>
              </HIGCardHeader>
              <HIGCardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border-secondary)]">
                        <th className="text-left py-3 font-semibold text-[var(--color-text-primary)]">資料名</th>
                        <th className="text-center py-3 font-semibold text-[var(--color-text-primary)]">閲覧数</th>
                        <th className="text-center py-3 font-semibold text-[var(--color-text-primary)]">DL数</th>
                        <th className="text-center py-3 font-semibold text-[var(--color-text-primary)]">最終アクティビティ</th>
                        <th className="text-center py-3 font-semibold text-[var(--color-text-primary)]">人気度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.byMaterial.slice(0, 20).map((summary) => (
                        <tr key={summary.materialId} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)]">
                          <td className="py-3">
                            <div className="font-medium text-[var(--color-text-primary)]">{summary.title}</div>
                          </td>
                          <td className="py-3 text-center">
                            <span className="bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] px-2 py-1 rounded text-sm font-medium">
                              {summary.views}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="bg-[var(--color-secondary)] bg-opacity-10 text-[var(--color-secondary)] px-2 py-1 rounded text-sm font-medium">
                              {summary.downloads}
                            </span>
                          </td>
                          <td className="py-3 text-center text-sm text-[var(--color-text-secondary)]">
                            {new Date(summary.lastActivityAt).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-[var(--color-background-secondary)] rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] h-full rounded-full"
                                  style={{ width: `${Math.min((summary.views + summary.downloads * 2) / Math.max(...stats.byMaterial.map(s => s.views + s.downloads * 2)) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {stats.byMaterial.length === 0 && (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      期間内にデータがありません
                    </div>
                  )}
                  {stats.byMaterial.length > 20 && (
                    <div className="text-center py-4 text-[var(--color-text-secondary)] text-sm">
                      {stats.byMaterial.length - 20}件の資料が追加で表示されます（CSVエクスポートで全件確認可能）
                    </div>
                  )}
                </div>
              </HIGCardContent>
            </HIGCard>
          </>
        )}
      </div>
    </div>
  );
}