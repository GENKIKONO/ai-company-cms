/**
 * AI Citations Hooks - DB準拠版
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SessionCitationsResponse,
  OrgCitationsPeriodResponse,
  AICitationsApiResponse,
  AICitationsApiErrorResponse,
  SessionCitationsQuerySchema,
  OrgCitationsQuerySchema,
  formatBigIntString,
  parseBigIntString,
  AICitationSource,
  PeriodPreset
} from '@/types/ai-citations-corrected';

interface UseCitationsState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * セッション単位の引用データを取得
 */
export function useCitationsBySessionId(sessionId: string | null): UseCitationsState<SessionCitationsResponse> {
  const [state, setState] = useState<{
    data: SessionCitationsResponse | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!sessionId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // パラメータバリデーション
    const validation = SessionCitationsQuerySchema.safeParse({ sessionId });
    if (!validation.success) {
      setState({ 
        data: null, 
        loading: false, 
        error: `Invalid sessionId: ${validation.error.message}` 
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/my/ai-citations?sessionId=${encodeURIComponent(sessionId)}`);
      const result: AICitationsApiResponse<SessionCitationsResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.success === false ? result.message : 'Network error');
      }

      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: (result as AICitationsApiErrorResponse).message });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData
  };
}

/**
 * 組織×期間の引用データを取得 (90日制限)
 */
export function useOrgCitationsByPeriod(
  orgId: string | null,
  from: string | null,
  to: string | null
): UseCitationsState<OrgCitationsPeriodResponse> {
  const [state, setState] = useState<{
    data: OrgCitationsPeriodResponse | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!orgId || !from || !to) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // パラメータバリデーション
    const validation = OrgCitationsQuerySchema.safeParse({ orgId, from, to });
    if (!validation.success) {
      setState({ 
        data: null, 
        loading: false, 
        error: `Invalid parameters: ${validation.error.message}` 
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({ orgId, from, to });
      const response = await fetch(`/api/my/ai-citations?${params.toString()}`);
      const result: AICitationsApiResponse<OrgCitationsPeriodResponse> = await response.json();

      if (!response.ok) {
        throw new Error(result.success === false ? result.message : 'Network error');
      }

      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: (result as AICitationsApiErrorResponse).message });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [orgId, from, to]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData
  };
}

/**
 * プリセット期間の日付生成
 */
export function generatePeriodDates(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let from: Date;
  const to = today;

  switch (preset) {
    case 'last7days':
      from = new Date(today);
      from.setDate(today.getDate() - 6); // 7日間 (今日含む)
      break;
    case 'last30days':
      from = new Date(today);
      from.setDate(today.getDate() - 29); // 30日間
      break;
    case 'last90days':
      from = new Date(today);
      from.setDate(today.getDate() - 89); // 90日間
      break;
    default:
      throw new Error(`Invalid preset: ${preset}`);
  }

  return {
    from: from.toISOString().split('T')[0], // YYYY-MM-DD
    to: to.toISOString().split('T')[0]      // YYYY-MM-DD
  };
}

/**
 * プリセット期間での組織引用データを取得
 */
export function useOrgCitationsByPreset(
  orgId: string | null,
  preset: PeriodPreset
): UseCitationsState<OrgCitationsPeriodResponse> {
  const { from, to } = generatePeriodDates(preset);
  return useOrgCitationsByPeriod(orgId, from, to);
}

/**
 * 引用ソースの表示用データ加工
 */
export function useCitationDisplayData(sources: AICitationSource[] | null) {
  return {
    // Top 10引用ソース (カウント順)
    topSources: sources
      ?.sort((a, b) => parseBigIntString(b.citationsCount) - parseBigIntString(a.citationsCount))
      ?.slice(0, 10) || [],
    
    // 最高スコアソース (スコア順)
    topScoreSources: sources
      ?.filter(s => s.maxScore)
      ?.sort((a, b) => parseBigIntString(b.maxScore!) - parseBigIntString(a.maxScore!))
      ?.slice(0, 5) || [],
    
    // 表示用統計
    stats: sources ? {
      totalSources: sources.length,
      totalCitationsDisplay: formatBigIntString(
        sources.reduce((sum, s) => sum + parseBigIntString(s.citationsCount), 0).toString()
      ),
      totalTokensDisplay: formatBigIntString(
        sources.reduce((sum, s) => sum + parseBigIntString(s.totalQuotedTokens), 0).toString()
      ),
      avgCitationsPerSource: sources.length > 0 ? 
        Math.round(sources.reduce((sum, s) => sum + parseBigIntString(s.citationsCount), 0) / sources.length) : 0
    } : null
  };
}

/**
 * リアルタイム更新通知 (MV遅延考慮)
 */
export function useCitationsUpdateNotice() {
  return {
    notice: "引用データは最大1時間の遅延があります（システム更新中）",
    lastUpdated: "毎時0分に更新",
    canRefresh: true,
    refreshMessage: "最新データは「更新」ボタンで取得できます"
  };
}