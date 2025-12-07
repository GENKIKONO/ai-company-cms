/**
 * P2-4: useInterviewQuestions hook
 * Interview質問データの取得とキャッシュ管理
 */

import { useState, useEffect, useCallback } from 'react'
import type {
  InterviewQuestionsResponse,
  InterviewQuestionsQuery,
  UseInterviewQuestionsResult,
  InterviewContentType
} from '@/types/interview'

interface UseInterviewQuestionsParams {
  contentType: InterviewContentType
  lang: string
  orgId: string
  enabled?: boolean // 自動フェッチを制御
}

/**
 * API エラー処理の統一
 */
function processApiError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Unknown error occurred';
}

/**
 * API レスポンス処理の統一
 */
async function processApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // JSON解析に失敗した場合はHTTPステータスを使用
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Interview質問データを取得するhook
 */
export function useInterviewQuestions(params: UseInterviewQuestionsParams): UseInterviewQuestionsResult {
  const { contentType, lang, orgId, enabled = true } = params;
  
  const [data, setData] = useState<InterviewQuestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!enabled || !contentType || !lang || !orgId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        content_type: contentType,
        lang: lang,
        orgId: orgId
      });

      const response = await fetch(`/api/my/interview/questions?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await processApiResponse<InterviewQuestionsResponse>(response);
      setData(result);
    } catch (err) {
      const errorMessage = processApiError(err);
      setError(errorMessage);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [contentType, lang, orgId, enabled]);

  // パラメータ変更時の自動フェッチ
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

/**
 * キャッシュ付きInterview質問データを取得するhook
 * 同じパラメータでの重複リクエストを防ぐ
 */
export function useInterviewQuestionsWithCache(params: UseInterviewQuestionsParams): UseInterviewQuestionsResult {
  const cacheKey = `${params.contentType}-${params.lang}-${params.orgId}`;
  
  // 簡易的なメモリキャッシュ（実際のプロダクションではより堅牢なキャッシュ戦略が必要）
  const [cache] = useState<Map<string, InterviewQuestionsResponse>>(new Map());
  const [lastFetchTime] = useState<Map<string, number>>(new Map());
  
  const result = useInterviewQuestions(params);
  
  // キャッシュの有効期限（5分）
  const CACHE_DURATION = 5 * 60 * 1000;
  
  const getCachedData = useCallback((): InterviewQuestionsResponse | null => {
    const cached = cache.get(cacheKey);
    const fetchTime = lastFetchTime.get(cacheKey);
    
    if (cached && fetchTime && Date.now() - fetchTime < CACHE_DURATION) {
      return cached;
    }
    
    return null;
  }, [cache, lastFetchTime, cacheKey, CACHE_DURATION]);

  // データ取得成功時にキャッシュに保存
  useEffect(() => {
    if (result.data && !result.isLoading && !result.error) {
      cache.set(cacheKey, result.data);
      lastFetchTime.set(cacheKey, Date.now());
    }
  }, [result.data, result.isLoading, result.error, cache, lastFetchTime, cacheKey]);

  // キャッシュからデータを提供（ローディング中でない場合）
  const cachedData = getCachedData();
  if (cachedData && result.isLoading) {
    return {
      data: cachedData,
      isLoading: false,
      error: null,
      refetch: result.refetch
    };
  }

  return result;
}

export default useInterviewQuestions;