/**
 * Comprehensive Analytics System
 * 包括的なアナリティクス・監視システム
 */

import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export interface AnalyticsEvent {
  event_type: string;
  user_id?: string;
  session_id?: string;
  organization_id?: string;
  page_path?: string;
  referrer?: string;
  user_agent?: string;
  ip_address?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface UsageMetrics {
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  page_views: number;
  unique_page_views: number;
  session_count: number;
  average_session_duration: number;
  bounce_rate: number;
  conversion_rate: number;
}

export interface ContentMetrics {
  popular_organizations: Array<{
    id: string;
    name: string;
    slug: string;
    views: number;
    unique_views: number;
  }>;
  popular_services: Array<{
    id: string;
    name: string;
    organization_name: string;
    views: number;
  }>;
  popular_case_studies: Array<{
    id: string;
    title: string;
    organization_name: string;
    views: number;
  }>;
  search_queries: Array<{
    query: string;
    count: number;
    results_count: number;
  }>;
}

export interface PerformanceMetrics {
  average_page_load_time: number;
  api_response_times: Array<{
    endpoint: string;
    average_time: number;
    call_count: number;
  }>;
  error_rate: number;
  uptime_percentage: number;
  cache_hit_rate: number;
}

export interface BusinessMetrics {
  organizations_created: number;
  services_published: number;
  case_studies_published: number;
  subscription_metrics: {
    active_subscriptions: number;
    new_subscriptions: number;
    churned_subscriptions: number;
    mrr: number;
  };
  user_engagement: {
    login_count: number;
    profile_completion_rate: number;
    feature_adoption_rate: Record<string, number>;
  };
}

export interface AnalyticsDashboard {
  usage: UsageMetrics;
  content: ContentMetrics;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
  period: {
    start_date: string;
    end_date: string;
  };
  last_updated: string;
}

export class AnalyticsEngine {
  /**
   * イベントを記録
   */
  static async trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): Promise<void> {
    try {
      const supabase = await supabaseServer();
      
      const eventData: AnalyticsEvent = {
        ...event,
        timestamp: new Date().toISOString(),
      };

      // analytics_events テーブルに保存
      const { error } = await supabase
        .from('analytics_events')
        .insert(eventData);

      if (error) {
        logger.error('Analytics event tracking error', error instanceof Error ? error : new Error(String(error)));
      }
    } catch (error) {
      logger.error('Failed to track analytics event', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * ページビューを記録
   */
  static async trackPageView(data: {
    page_path: string;
    user_id?: string;
    session_id?: string;
    referrer?: string;
    user_agent?: string;
    organization_id?: string;
  }): Promise<void> {
    await this.trackEvent({
      event_type: 'page_view',
      ...data,
    });
  }

  /**
   * 検索クエリを記録
   */
  static async trackSearch(data: {
    query: string;
    results_count: number;
    user_id?: string;
    session_id?: string;
  }): Promise<void> {
    await this.trackEvent({
      event_type: 'search',
      properties: {
        query: data.query,
        results_count: data.results_count,
      },
      user_id: data.user_id,
      session_id: data.session_id,
    });
  }

  /**
   * コンバージョンを記録
   */
  static async trackConversion(data: {
    conversion_type: string;
    value?: number;
    user_id?: string;
    organization_id?: string;
    properties?: Record<string, any>;
  }): Promise<void> {
    await this.trackEvent({
      event_type: 'conversion',
      properties: {
        conversion_type: data.conversion_type,
        value: data.value,
        ...data.properties,
      },
      user_id: data.user_id,
      organization_id: data.organization_id,
    });
  }

  /**
   * 使用状況メトリクスを取得
   */
  static async getUsageMetrics(
    startDate: string,
    endDate: string
  ): Promise<UsageMetrics> {
    try {
      const supabase = await supabaseServer();
      
      // DAU (Daily Active Users)
      const { data: dauData } = await supabase
        .from('analytics_events')
        .select('user_id')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .not('user_id', 'is', null);

      const uniqueUsers = new Set(dauData?.map(event => event.user_id) || []);
      const daily_active_users = uniqueUsers.size;

      // ページビュー数
      const { count: page_views } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      // セッション数（簡易計算）
      const { data: sessionData } = await supabase
        .from('analytics_events')
        .select('session_id')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .not('session_id', 'is', null);

      const unique_sessions = new Set(sessionData?.map(event => event.session_id) || []);
      const session_count = unique_sessions.size;

      return {
        daily_active_users,
        weekly_active_users: daily_active_users, // 簡易実装
        monthly_active_users: daily_active_users, // 簡易実装
        page_views: page_views || 0,
        unique_page_views: page_views || 0, // 簡易実装
        session_count,
        average_session_duration: 180, // 3分（仮の値）
        bounce_rate: 35.5, // 仮の値
        conversion_rate: 2.3, // 仮の値
      };
    } catch (error) {
      logger.error('Failed to get usage metrics', error instanceof Error ? error : new Error(String(error)));
      return {
        daily_active_users: 0,
        weekly_active_users: 0,
        monthly_active_users: 0,
        page_views: 0,
        unique_page_views: 0,
        session_count: 0,
        average_session_duration: 0,
        bounce_rate: 0,
        conversion_rate: 0,
      };
    }
  }

  /**
   * コンテンツメトリクスを取得
   */
  static async getContentMetrics(
    startDate: string,
    endDate: string
  ): Promise<ContentMetrics> {
    try {
      const supabase = await supabaseServer();

      // 人気の組織
      const { data: orgViews } = await supabase
        .from('analytics_events')
        .select('organization_id, properties')
        .eq('event_type', 'page_view')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate)
        .not('organization_id', 'is', null);

      const orgViewCounts = new Map<string, number>();
      orgViews?.forEach(event => {
        if (event.organization_id) {
          orgViewCounts.set(
            event.organization_id,
            (orgViewCounts.get(event.organization_id) || 0) + 1
          );
        }
      });

      // 組織詳細を取得
      const topOrgIds = Array.from(orgViewCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id);

      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', topOrgIds);

      const popular_organizations = organizations?.map(org => ({
        ...org,
        views: orgViewCounts.get(org.id) || 0,
        unique_views: orgViewCounts.get(org.id) || 0, // 簡易実装
      })).sort((a, b) => b.views - a.views) || [];

      // 検索クエリ
      const { data: searchEvents } = await supabase
        .from('analytics_events')
        .select('properties')
        .eq('event_type', 'search')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      const queryCount = new Map<string, { count: number; results_total: number }>();
      searchEvents?.forEach(event => {
        const query = event.properties?.query;
        const results_count = event.properties?.results_count || 0;
        
        if (query) {
          const current = queryCount.get(query) || { count: 0, results_total: 0 };
          queryCount.set(query, {
            count: current.count + 1,
            results_total: current.results_total + results_count,
          });
        }
      });

      const search_queries = Array.from(queryCount.entries())
        .map(([query, data]) => ({
          query,
          count: data.count,
          results_count: Math.round(data.results_total / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return {
        popular_organizations,
        popular_services: [], // TODO: 実装
        popular_case_studies: [], // TODO: 実装
        search_queries,
      };
    } catch (error) {
      logger.error('Failed to get content metrics', error instanceof Error ? error : new Error(String(error)));
      return {
        popular_organizations: [],
        popular_services: [],
        popular_case_studies: [],
        search_queries: [],
      };
    }
  }

  /**
   * パフォーマンスメトリクスを取得
   */
  static async getPerformanceMetrics(
    startDate: string,
    endDate: string
  ): Promise<PerformanceMetrics> {
    try {
      // パフォーマンスデータの取得（実装が必要）
      return {
        average_page_load_time: 1250, // ms
        api_response_times: [
          { endpoint: '/api/organizations', average_time: 245, call_count: 1523 },
          { endpoint: '/api/search', average_time: 890, call_count: 892 },
          { endpoint: '/api/services', average_time: 156, call_count: 2341 },
        ],
        error_rate: 0.23, // %
        uptime_percentage: 99.94,
        cache_hit_rate: 85.7, // %
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', error instanceof Error ? error : new Error(String(error)));
      return {
        average_page_load_time: 0,
        api_response_times: [],
        error_rate: 0,
        uptime_percentage: 0,
        cache_hit_rate: 0,
      };
    }
  }

  /**
   * ビジネスメトリクスを取得
   */
  static async getBusinessMetrics(
    startDate: string,
    endDate: string
  ): Promise<BusinessMetrics> {
    try {
      const supabase = await supabaseServer();

      // 組織作成数
      const { count: organizations_created } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // サービス公開数
      const { count: services_published } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // 事例公開数
      const { count: case_studies_published } = await supabase
        .from('case_studies')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      // ログイン数
      const { count: login_count } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'user_login')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      return {
        organizations_created: organizations_created || 0,
        services_published: services_published || 0,
        case_studies_published: case_studies_published || 0,
        subscription_metrics: {
          active_subscriptions: 0, // TODO: Stripe連携で実装
          new_subscriptions: 0,
          churned_subscriptions: 0,
          mrr: 0,
        },
        user_engagement: {
          login_count: login_count || 0,
          profile_completion_rate: 78.5, // 仮の値
          feature_adoption_rate: {
            'organization_creation': 65.2,
            'service_creation': 42.8,
            'case_study_creation': 23.4,
          },
        },
      };
    } catch (error) {
      logger.error('Failed to get business metrics', error instanceof Error ? error : new Error(String(error)));
      return {
        organizations_created: 0,
        services_published: 0,
        case_studies_published: 0,
        subscription_metrics: {
          active_subscriptions: 0,
          new_subscriptions: 0,
          churned_subscriptions: 0,
          mrr: 0,
        },
        user_engagement: {
          login_count: 0,
          profile_completion_rate: 0,
          feature_adoption_rate: {},
        },
      };
    }
  }

  /**
   * 包括的なダッシュボードデータを取得
   */
  static async getDashboardData(
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsDashboard> {
    const end = endDate || new Date().toISOString();
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [usage, content, performance, business] = await Promise.all([
      this.getUsageMetrics(start, end),
      this.getContentMetrics(start, end),
      this.getPerformanceMetrics(start, end),
      this.getBusinessMetrics(start, end),
    ]);

    return {
      usage,
      content,
      performance,
      business,
      period: {
        start_date: start,
        end_date: end,
      },
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * リアルタイム統計を取得
   */
  static async getRealTimeStats(): Promise<{
    active_users: number;
    current_page_views: number;
    recent_events: AnalyticsEvent[];
  }> {
    try {
      const supabase = await supabaseServer();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // 過去5分のアクティブユーザー
      const { data: activeUsersData } = await supabase
        .from('analytics_events')
        .select('user_id')
        .gte('timestamp', fiveMinutesAgo)
        .not('user_id', 'is', null);

      const active_users = new Set(activeUsersData?.map(event => event.user_id) || []).size;

      // 過去5分のページビュー
      const { count: current_page_views } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('timestamp', fiveMinutesAgo);

      // 最新のイベント
      const { data: recent_events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      return {
        active_users,
        current_page_views: current_page_views || 0,
        recent_events: recent_events || [],
      };
    } catch (error) {
      logger.error('Failed to get real-time stats', error instanceof Error ? error : new Error(String(error)));
      return {
        active_users: 0,
        current_page_views: 0,
        recent_events: [],
      };
    }
  }
}

/**
 * アナリティクスミドルウェア
 */
export function createAnalyticsMiddleware() {
  return {
    trackPageView: AnalyticsEngine.trackPageView.bind(AnalyticsEngine),
    trackEvent: AnalyticsEngine.trackEvent.bind(AnalyticsEngine),
    trackSearch: AnalyticsEngine.trackSearch.bind(AnalyticsEngine),
    trackConversion: AnalyticsEngine.trackConversion.bind(AnalyticsEngine),
  };
}

/**
 * React Hook for Analytics
 */
export function useAnalytics() {
  return createAnalyticsMiddleware();
}