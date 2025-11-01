/**
 * AI × SEO 分析データフェッチフック
 * 複数のAPIエンドポイントを統合してダッシュボード用データを取得
 */

import useSWR from 'swr';
import { fetcher } from '@/lib/utils/fetcher';

// 型定義
export interface AiBotSummaryData {
  success: boolean;
  metrics: {
    total_bot_hits: number;
    unique_bots: number;
    active_urls: number;
  };
  top_content: Array<{
    url: string;
    title?: string;
    hits: number;
    unique_bots: number;
  }>;
  period: {
    start_date: string;
    end_date: string;
  };
}

export interface AiVisibilityData {
  success: boolean;
  overall_score: number;
  content_scores: Array<{
    url: string;
    title?: string;
    total_visibility_score: number;
    structured_data_score: number;
    ai_accessibility_score: number;
    calculated_at: string;
  }>;
  score_trend: Array<{
    date: string;
    score: number;
  }>;
  analysis: {
    structured_data_coverage: number; // 0-100%
    avg_visibility_score: number;
  };
}

export interface SeoGscData {
  success: boolean;
  metrics: {
    total_impressions: number;
    total_clicks: number;
    average_ctr: number;
    average_position: number;
  };
  top_queries: Array<{
    query: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  top_pages: Array<{
    url: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  data_period: {
    start_date: string;
    end_date: string;
  };
}

export interface AiSeoCombinedData {
  success: boolean;
  ai_seo_correlation: {
    correlation_score: number;
    correlation_strength: 'strong' | 'moderate' | 'weak' | 'none';
    sample_size: number;
  };
  quadrants: {
    ai_strong_seo_strong: Array<{
      url: string;
      title?: string;
      ai_score: number;
      seo_position: number;
      combined_score: number;
    }>;
    ai_strong_seo_weak: Array<{
      url: string;
      title?: string;
      ai_score: number;
      seo_position: number;
      combined_score: number;
    }>;
    ai_weak_seo_strong: Array<{
      url: string;
      title?: string;
      ai_score: number;
      seo_position: number;
      combined_score: number;
    }>;
    ai_weak_seo_weak: Array<{
      url: string;
      title?: string;
      ai_score: number;
      seo_position: number;
      combined_score: number;
    }>;
  };
  summary: {
    total_analyzed_urls: number;
    ai_visibility_avg: number;
    seo_position_avg: number;
  };
}

/**
 * 組織のAI Bot分析サマリー取得
 * API: GET /api/analytics/ai/summary
 */
export function useAiBotSummary(orgId: string | null) {
  return useSWR<AiBotSummaryData>(
    orgId ? `/api/analytics/ai/summary?org_id=${orgId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5分間キャッシュ
      errorRetryCount: 2,
      fallbackData: {
        success: false,
        metrics: { total_bot_hits: 0, unique_bots: 0, active_urls: 0 },
        top_content: [],
        period: { start_date: '', end_date: '' }
      }
    }
  );
}

/**
 * AI Visibility Score とトレンド取得
 * API: GET /api/analytics/ai/visibility
 */
export function useAiVisibility(orgId: string | null) {
  return useSWR<AiVisibilityData>(
    orgId ? `/api/analytics/ai/visibility?org_id=${orgId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10 * 60 * 1000, // 10分間キャッシュ
      errorRetryCount: 2,
      fallbackData: {
        success: false,
        overall_score: 0,
        content_scores: [],
        score_trend: [],
        analysis: { structured_data_coverage: 0, avg_visibility_score: 0 }
      }
    }
  );
}

/**
 * Google Search Console データ取得
 * API: GET /api/analytics/seo/gsc
 */
export function useSeoGscData(orgId: string | null) {
  return useSWR<SeoGscData>(
    orgId ? `/api/analytics/seo/gsc?org_id=${orgId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 15 * 60 * 1000, // 15分間キャッシュ
      errorRetryCount: 2,
      fallbackData: {
        success: false,
        metrics: { total_impressions: 0, total_clicks: 0, average_ctr: 0, average_position: 0 },
        top_queries: [],
        top_pages: [],
        data_period: { start_date: '', end_date: '' }
      }
    }
  );
}

/**
 * AI × SEO 相関分析データ取得
 * API: GET /api/analytics/ai/combined
 */
export function useAiSeoCombined(orgId: string | null) {
  return useSWR<AiSeoCombinedData>(
    orgId ? `/api/analytics/ai/combined?org_id=${orgId}&trend_days=30` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 20 * 60 * 1000, // 20分間キャッシュ
      errorRetryCount: 2,
      fallbackData: {
        success: false,
        ai_seo_correlation: { correlation_score: 0, correlation_strength: 'none', sample_size: 0 },
        quadrants: {
          ai_strong_seo_strong: [],
          ai_strong_seo_weak: [],
          ai_weak_seo_strong: [],
          ai_weak_seo_weak: []
        },
        summary: { total_analyzed_urls: 0, ai_visibility_avg: 0, seo_position_avg: 0 }
      }
    }
  );
}

/**
 * 統合フック - 全てのAI×SEO分析データを一括取得
 * ダッシュボード用のメインフック
 */
export function useAiSeoAnalytics(orgId: string | null) {
  const botSummary = useAiBotSummary(orgId);
  const aiVisibility = useAiVisibility(orgId);
  const seoGsc = useSeoGscData(orgId);
  const aiSeoCombined = useAiSeoCombined(orgId);

  return {
    // 個別データ
    botSummary: botSummary.data,
    aiVisibility: aiVisibility.data,
    seoGsc: seoGsc.data,
    aiSeoCombined: aiSeoCombined.data,

    // ローディング状態
    isLoading: botSummary.isLoading || aiVisibility.isLoading || seoGsc.isLoading || aiSeoCombined.isLoading,
    
    // エラー状態（最低1つのAPIが成功していればOK）
    hasError: botSummary.error && aiVisibility.error && seoGsc.error && aiSeoCombined.error,
    
    // 個別エラー
    errors: {
      botSummary: botSummary.error,
      aiVisibility: aiVisibility.error,
      seoGsc: seoGsc.error,
      aiSeoCombined: aiSeoCombined.error,
    },

    // 再取得関数
    mutate: () => {
      botSummary.mutate();
      aiVisibility.mutate();
      seoGsc.mutate();
      aiSeoCombined.mutate();
    }
  };
}

/**
 * フィーチャーフラグ取得フック
 * 組織のプラン機能制限チェック用
 */
export interface FeatureFlags {
  ai_bot_analytics: boolean;
  ai_visibility_analytics: boolean;
  ai_reports: boolean;
}

export function useFeatureFlags(orgId: string | null) {
  return useSWR<FeatureFlags>(
    orgId ? `/api/organizations/${orgId}/features` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30 * 60 * 1000, // 30分間キャッシュ
      fallbackData: {
        ai_bot_analytics: false,
        ai_visibility_analytics: false,
        ai_reports: false
      }
    }
  );
}