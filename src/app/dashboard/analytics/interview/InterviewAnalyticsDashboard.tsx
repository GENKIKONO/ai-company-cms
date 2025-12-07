/**
 * P2-7: AIインタビューアナリティクス ダッシュボード UI
 * クライアントサイドでの期間切り替えとチャート表示
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DashboardBackLink from '@/components/dashboard/DashboardBackLink';
import { logger } from '@/lib/utils/logger';
import type {
  InterviewAnalyticsResponse,
  InterviewAnalyticsPeriod,
  InterviewDailyMetric,
  ChartDataPoint,
  AnalyticsSummary
} from '@/types/interview-analytics';
import { PERIOD_OPTIONS } from '@/types/interview-analytics';

interface Props {
  orgId: string;
  initialPeriod: InterviewAnalyticsPeriod;
  initialData: InterviewAnalyticsResponse | null;
  serverError: string | null;
}

/**
 * 数値フォーマット関数
 */
function formatNumber(value: number): string {
  return value.toLocaleString('ja-JP');
}

function formatPercentage(value: number | null): string {
  if (value === null) return 'N/A';
  return `${(value * 100).toFixed(1)}%`;
}

function formatDecimal(value: number | null, digits = 1): string {
  if (value === null) return 'N/A';
  return value.toFixed(digits);
}

/**
 * チャート用データ変換
 */
function transformToChartData(days: InterviewDailyMetric[]): ChartDataPoint[] {
  return days.map(day => ({
    date: new Date(day.day).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
    sessionCount: day.sessionCount,
    aiCallCount: day.aiCallCount,
    completionRate: (day.completionRate || 0) * 100, // パーセント表示用
    quotedTokens: day.quotedTokensSum
  }));
}

/**
 * サマリーカード生成
 */
function generateSummaryCards(
  totals: InterviewAnalyticsResponse['totals'], 
  period: InterviewAnalyticsPeriod
): AnalyticsSummary[] {
  return [
    {
      title: '総セッション数',
      value: formatNumber(totals.sessionCount),
      icon: 'sessions',
      format: 'number'
    },
    {
      title: '完了率',
      value: formatPercentage(totals.completionRate),
      icon: 'completion',
      format: 'percentage'
    },
    {
      title: '平均質問数',
      value: formatDecimal(totals.avgQuestionCount),
      icon: 'questions',
      format: 'decimal'
    },
    {
      title: 'AI呼び出し数',
      value: formatNumber(totals.aiCallCount),
      icon: 'ai',
      format: 'number'
    }
  ];
}

/**
 * シンプルバーチャート
 */
function SimpleBarChart({ 
  data, 
  title, 
  valueKey, 
  color = 'bg-[var(--color-primary)]' 
}: { 
  data: ChartDataPoint[]; 
  title: string; 
  valueKey: keyof ChartDataPoint;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-[var(--color-text-secondary)]">
        データがありません
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Number(d[valueKey])));
  const minHeight = 4; // 最小バー高さ（px）

  return (
    <div className="space-y-4">
      <h4 className="hig-text-h4 hig-jp-heading">{title}</h4>
      
      <div className="relative">
        {/* Y軸ラベル */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-[var(--color-text-tertiary)]">
          <span>{formatNumber(maxValue)}</span>
          <span>{formatNumber(Math.floor(maxValue / 2))}</span>
          <span>0</span>
        </div>
        
        {/* チャート本体 */}
        <div className="ml-14 mr-2">
          <div className="flex items-end justify-between h-48 border-l border-b border-[var(--color-border)]">
            {data.map((item, index) => {
              const value = Number(item[valueKey]);
              const height = maxValue > 0 ? Math.max((value / maxValue) * 100, minHeight) : minHeight;
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group cursor-pointer"
                  title={`${item.date}: ${typeof value === 'number' ? formatNumber(value) : value}`}
                >
                  {/* バー */}
                  <div className="w-full max-w-8 mb-2 relative">
                    <div
                      className={`w-full ${color} rounded-t transition-opacity duration-300 group-hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                    
                    {/* ツールチップ */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        <div className="font-medium">{item.date}</div>
                        <div>
                          {valueKey === 'completionRate' 
                            ? `${value.toFixed(1)}%` 
                            : formatNumber(value)
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 日付ラベル */}
                  <div className="text-xs text-[var(--color-text-tertiary)] transform -rotate-45 origin-top-left">
                    {item.date}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * サマリーカードコンポーネント
 */
function SummaryCard({ summary }: { summary: AnalyticsSummary }) {
  const getIconElement = () => {
    const iconClass = "w-8 h-8";
    
    switch (summary.icon) {
      case 'sessions':
        return (
          <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'completion':
        return (
          <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'questions':
        return (
          <svg className={`${iconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'ai':
        return (
          <svg className={`${iconClass} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getIconElement()}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {summary.title}
            </p>
            <div className="flex items-baseline">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {summary.value}
              </p>
              {summary.change && (
                <span className={`ml-2 text-sm font-medium ${
                  summary.change.isIncrease ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.change.isIncrease ? '+' : '-'}{Math.abs(summary.change.value)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * メインダッシュボードコンポーネント
 */
export default function InterviewAnalyticsDashboard({ 
  orgId, 
  initialPeriod, 
  initialData, 
  serverError 
}: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<InterviewAnalyticsPeriod>(initialPeriod);
  const [data, setData] = useState<InterviewAnalyticsResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(serverError);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(
    initialData ? new Date() : null
  );

  // API からデータ取得
  const fetchData = useCallback(async (period: InterviewAnalyticsPeriod) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/my/analytics/interview?orgId=${orgId}&period=${period}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      setData(result);
      setLastRefreshedAt(new Date());

      logger.info('Interview analytics data fetched successfully', {
        orgId,
        period,
        recordCount: result.days.length,
        dataSource: result.metadata.dataSource
      });

    } catch (error: any) {
      logger.error('Failed to fetch interview analytics data:', { error: error.message });
      setError(error.message || 'データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // 期間変更時のデータ取得
  const handlePeriodChange = async (period: InterviewAnalyticsPeriod) => {
    setSelectedPeriod(period);
    if (period !== initialPeriod || !data) {
      await fetchData(period);
    }
  };

  // 手動更新
  const handleRefresh = () => {
    fetchData(selectedPeriod);
  };

  // チャートデータとサマリー生成
  const chartData = data ? transformToChartData(data.days) : [];
  const summaryCards = data ? generateSummaryCards(data.totals, selectedPeriod) : [];

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <DashboardBackLink />

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <button 
              onClick={handleRefresh}
              className="ml-2 underline hover:no-underline"
              disabled={isLoading}
            >
              再試行
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* 期間選択とリフレッシュ */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedPeriod === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePeriodChange(option.value)}
                  disabled={isLoading}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {lastRefreshedAt && (
                <span className="text-sm text-[var(--color-text-secondary)]">
                  更新: {lastRefreshedAt.toLocaleTimeString('ja-JP')}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <LoadingSpinner className="w-4 h-4" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                更新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ローディング状態 */}
      {isLoading && !data && (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      )}

      {/* データ表示 */}
      {data && (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((summary, index) => (
              <SummaryCard key={index} summary={summary} />
            ))}
          </div>

          {/* チャート */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <SimpleBarChart
                  data={chartData}
                  title="日別セッション数"
                  valueKey="sessionCount"
                  color="bg-blue-500"
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <SimpleBarChart
                  data={chartData}
                  title="日別AI呼び出し数"
                  valueKey="aiCallCount"
                  color="bg-orange-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* データテーブル */}
          <Card>
            <CardHeader>
              <CardTitle className="hig-text-h3 hig-jp-heading">日別詳細データ</CardTitle>
            </CardHeader>
            <CardContent>
              {data.days.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  指定期間のデータがありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left py-3 px-4">日付</th>
                        <th className="text-right py-3 px-4">セッション数</th>
                        <th className="text-right py-3 px-4">完了数</th>
                        <th className="text-right py-3 px-4">完了率</th>
                        <th className="text-right py-3 px-4">AI使用</th>
                        <th className="text-right py-3 px-4">引用数</th>
                        <th className="text-right py-3 px-4">トークン数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.days.map((day, index) => (
                        <tr key={index} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background-hover)]">
                          <td className="py-3 px-4 font-medium">
                            {new Date(day.day).toLocaleDateString('ja-JP', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="text-right py-3 px-4">{formatNumber(day.sessionCount)}</td>
                          <td className="text-right py-3 px-4">{formatNumber(day.completedSessionCount)}</td>
                          <td className="text-right py-3 px-4">{formatPercentage(day.completionRate)}</td>
                          <td className="text-right py-3 px-4">{formatNumber(day.aiUsedSessionCount)}</td>
                          <td className="text-right py-3 px-4">{formatNumber(day.citationsItemCount)}</td>
                          <td className="text-right py-3 px-4">{formatNumber(day.quotedTokensSum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* メタデータ情報 */}
          {data.metadata && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                  <div>
                    データソース: {data.metadata.dataSource === 'materialized_view' ? 'MATERIALIZED VIEW' : 'VIEW'}
                  </div>
                  <div>
                    クエリ時間: {data.metadata.queryTimeMs}ms | レコード数: {data.metadata.recordCount}件
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}