/**
 * P2-5: セッション詳細画面用の引用パネルコンポーネント
 * 特定のAIインタビューセッションの引用情報を表示
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/utils/logger';
import type { 
  SessionCitationsResponse,
  AICitationSource,
  SessionCitationResponse,
  AICitationsApiResponse
} from '@/types/ai-citations';

export interface SessionCitationsPanelProps {
  sessionId: string;
  className?: string;
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 引用ソースの簡潔表示コンポーネント
 */
function CitationSourceItem({ source, rank }: { source: AICitationSource; rank: number }) {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-[var(--color-border)] last:border-b-0">
      <div className="flex-shrink-0 w-6 h-6 bg-[var(--color-primary-alpha-10)] text-[var(--color-primary)] rounded-full flex items-center justify-center text-xs font-bold">
        {rank}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="hig-text-body-bold hig-jp-body truncate">
          {source.title || 'タイトルなし'}
        </div>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hig-text-caption text-[var(--color-primary)] hover:underline truncate block"
            title={source.url}
          >
            {source.url}
          </a>
        )}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            {formatNumber(source.citationsCount)}回
          </Badge>
          <span className="text-[var(--color-text-secondary)]">
            {formatNumber(source.totalQuotedTokens)} token
          </span>
          {source.maxScore !== null && (
            <span className="text-[var(--color-text-secondary)]">
              Score: {formatScore(source.maxScore)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AI生成レスポンス単位の表示コンポーネント
 */
function ResponseCitationsItem({ response }: { response: SessionCitationResponse }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalCitations = response.sources.reduce((sum, s) => sum + s.citationsCount, 0);
  const totalTokens = response.sources.reduce((sum, s) => sum + s.totalQuotedTokens, 0);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="hig-text-h4 hig-jp-heading flex items-center justify-between">
          <div>
            <span>AI生成 {formatDate(response.responseCreatedAt)}</span>
            <span className="ml-2 hig-text-caption text-[var(--color-text-secondary)]">
              ({response.model})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {response.sources.length}件
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? '折りたたむ' : '詳細表示'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 mb-4 text-center text-sm">
            <div>
              <div className="hig-text-caption text-[var(--color-text-secondary)]">引用回数</div>
              <div className="hig-text-body-bold text-[var(--color-primary)]">
                {formatNumber(totalCitations)}
              </div>
            </div>
            <div>
              <div className="hig-text-caption text-[var(--color-text-secondary)]">トークン数</div>
              <div className="hig-text-body-bold text-[var(--color-primary)]">
                {formatNumber(totalTokens)}
              </div>
            </div>
            <div>
              <div className="hig-text-caption text-[var(--color-text-secondary)]">引用元数</div>
              <div className="hig-text-body-bold text-[var(--color-primary)]">
                {response.sources.length}
              </div>
            </div>
          </div>
          
          <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-background)]">
            {response.sources.map((source, index) => (
              <CitationSourceItem
                key={source.sourceKey}
                source={source}
                rank={index + 1}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function SessionCitationsPanel({ sessionId, className = '' }: SessionCitationsPanelProps) {
  const [data, setData] = useState<SessionCitationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchSessionCitations = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/my/ai-citations?sessionId=${sessionId}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: AICitationsApiResponse<SessionCitationsResponse> = await response.json();
      
      if (!result.success) {
        throw new Error((result as import('@/types/ai-citations').AICitationsApiErrorResponse).message);
      }

      setData(result.data);

      logger.info('Session citations fetched successfully', {
        sessionId,
        responsesCount: result.data.responses.length,
        totalSources: result.data.totalSources
      });

    } catch (error: any) {
      logger.error('Failed to fetch session citations:', { 
        error: error.message,
        sessionId 
      });
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // 初回データ取得
  useEffect(() => {
    fetchSessionCitations();
  }, [fetchSessionCitations]);

  // 再読込ハンドラ
  const handleRefresh = () => {
    fetchSessionCitations();
  };

  // 全引用統計の計算
  const allSources = data?.responses.flatMap(r => r.sources) || [];
  const totalCitations = allSources.reduce((sum, s) => sum + s.citationsCount, 0);
  const totalTokens = allSources.reduce((sum, s) => sum + s.totalQuotedTokens, 0);
  const uniqueSourcesCount = new Set(allSources.map(s => s.sourceKey)).size;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="hig-text-h3 hig-jp-heading">引用ログ</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
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

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            引用データの読み込みに失敗しました: {error}
            <button 
              onClick={handleRefresh}
              className="ml-2 underline hover:no-underline"
            >
              再試行
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* ローディング状態 */}
      {isLoading && !data && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <LoadingSpinner />
              <span className="ml-2 hig-text-body text-[var(--color-text-secondary)]">
                引用データを読み込んでいます...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* サマリー */}
      {data && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="hig-text-caption text-[var(--color-text-secondary)]">AI生成回数</div>
                <div className="hig-text-h3 text-[var(--color-primary)]">
                  {data.totalResponses}
                </div>
              </div>
              <div>
                <div className="hig-text-caption text-[var(--color-text-secondary)]">総引用回数</div>
                <div className="hig-text-h3 text-[var(--color-primary)]">
                  {formatNumber(totalCitations)}
                </div>
              </div>
              <div>
                <div className="hig-text-caption text-[var(--color-text-secondary)]">引用元数</div>
                <div className="hig-text-h3 text-[var(--color-primary)]">
                  {uniqueSourcesCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI生成レスポンス別表示 */}
      {data && data.responses.length > 0 ? (
        <div className="space-y-4">
          {data.responses.map((response) => (
            <ResponseCitationsItem
              key={response.responseId}
              response={response}
            />
          ))}
        </div>
      ) : data && data.responses.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="hig-text-body text-[var(--color-text-secondary)]">
                このセッションには引用データがありません
              </p>
              <p className="hig-text-caption text-[var(--color-text-tertiary)]">
                AI生成を実行すると引用情報が表示されます
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}