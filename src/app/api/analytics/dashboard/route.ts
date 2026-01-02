/**
 * Analytics Dashboard API
 * 包括的なアナリティクスダッシュボードデータを提供
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { AnalyticsEngine } from '@/lib/analytics/comprehensive-analytics';
import { logger } from '@/lib/utils/logger';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

/** 人気組織の型 */
interface PopularOrganization {
  name: string;
  views: number;
  unique_views: number;
}

/** 検索クエリの型 */
interface SearchQueryData {
  query: string;
  count: number;
  results_count: number;
}

/** API応答時間の型 */
interface ApiResponseTime {
  endpoint: string;
  average_time: number;
  call_count: number;
}

/** ダッシュボードデータの型 */
interface DashboardData {
  usage: {
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    page_views: number;
    session_count: number;
    average_session_duration: number;
    bounce_rate: number;
    conversion_rate: number;
  };
  content: {
    popular_organizations: PopularOrganization[];
    search_queries: SearchQueryData[];
  };
  performance: {
    average_page_load_time: number;
    error_rate: number;
    uptime_percentage: number;
    cache_hit_rate: number;
    api_response_times: ApiResponseTime[];
  };
  business: {
    organizations_created: number;
    services_published: number;
    case_studies_published: number;
    user_engagement: {
      login_count: number;
      profile_completion_rate: number;
      feature_adoption_rate: Record<string, number>;
    };
    subscription_metrics: {
      active_subscriptions: number;
      new_subscriptions: number;
      churned_subscriptions: number;
      mrr: number;
    };
  };
  period: {
    start_date: string;
    end_date: string;
  };
  last_updated: string;
}

/** エラーメッセージ取得 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function GET(request: NextRequest) {
  try {
    // Admin権限チェック
    const adminCheck = await requireAdminAuth(request);
    if (!adminCheck.success) {
      return NextResponse.json({
        error: adminCheck.error,
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'dashboard';
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const format = url.searchParams.get('format') || 'json';

    switch (action) {
      case 'dashboard':
        const dashboardData = await AnalyticsEngine.getDashboardData(startDate || undefined, endDate || undefined);
        
        if (format === 'markdown') {
          const markdown = generateMarkdownReport(dashboardData);
          return new NextResponse(markdown, {
            headers: {
              'Content-Type': 'text/markdown',
              'Content-Disposition': 'attachment; filename="analytics-dashboard.md"',
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          data: dashboardData,
        });

      case 'realtime':
        const realtimeStats = await AnalyticsEngine.getRealTimeStats();
        return NextResponse.json({
          success: true,
          data: realtimeStats,
          timestamp: new Date().toISOString(),
        });

      case 'usage':
        const usageMetrics = await AnalyticsEngine.getUsageMetrics(
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate || new Date().toISOString()
        );
        return NextResponse.json({
          success: true,
          data: usageMetrics,
        });

      case 'content':
        const contentMetrics = await AnalyticsEngine.getContentMetrics(
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate || new Date().toISOString()
        );
        return NextResponse.json({
          success: true,
          data: contentMetrics,
        });

      case 'performance':
        const performanceMetrics = await AnalyticsEngine.getPerformanceMetrics(
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate || new Date().toISOString()
        );
        return NextResponse.json({
          success: true,
          data: performanceMetrics,
        });

      case 'business':
        const businessMetrics = await AnalyticsEngine.getBusinessMetrics(
          startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate || new Date().toISOString()
        );
        return NextResponse.json({
          success: true,
          data: businessMetrics,
        });

      default:
        return NextResponse.json({
          message: 'Analytics Dashboard API',
          actions: {
            'dashboard': 'Get complete dashboard data',
            'realtime': 'Get real-time statistics',
            'usage': 'Get usage metrics',
            'content': 'Get content metrics',
            'performance': 'Get performance metrics',
            'business': 'Get business metrics',
          },
          parameters: {
            'start_date': 'ISO date string (optional)',
            'end_date': 'ISO date string (optional)',
            'format': 'json|markdown (optional, default: json)',
          },
        });
    }

  } catch (error) {
    logger.error('❌ Analytics Dashboard API Error', { data: error instanceof Error ? error : new Error(String(error)) });

    return NextResponse.json({
      success: false,
      error: 'Analytics data fetch failed',
      message: getErrorMessage(error),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin権限チェック
    const adminCheck = await requireAdminAuth(request);
    if (!adminCheck.success) {
      return NextResponse.json({
        error: adminCheck.error,
      }, { status: 401 });
    }

    const body = await request.json();
    const { event_type, properties, user_id, organization_id, page_path } = body;

    if (!event_type) {
      return NextResponse.json({
        error: 'event_type is required',
      }, { status: 400 });
    }

    // イベントを記録
    await AnalyticsEngine.trackEvent({
      event_type,
      properties,
      user_id,
      organization_id,
      page_path,
    });

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
    });

  } catch (error) {
    logger.error('❌ Analytics Event Tracking Error', { data: error instanceof Error ? error : new Error(String(error)) });

    return NextResponse.json({
      success: false,
      error: 'Event tracking failed',
      message: getErrorMessage(error),
    }, { status: 500 });
  }
}

function generateMarkdownReport(data: DashboardData): string {
  const { usage, content, performance, business, period, last_updated } = data;

  return `# Analytics Dashboard Report

**Period:** ${new Date(period.start_date).toLocaleDateString()} - ${new Date(period.end_date).toLocaleDateString()}
**Generated:** ${new Date(last_updated).toLocaleString()}

## Usage Metrics

| Metric | Value |
|--------|-------|
| Daily Active Users | ${usage.daily_active_users.toLocaleString()} |
| Weekly Active Users | ${usage.weekly_active_users.toLocaleString()} |
| Monthly Active Users | ${usage.monthly_active_users.toLocaleString()} |
| Page Views | ${usage.page_views.toLocaleString()} |
| Sessions | ${usage.session_count.toLocaleString()} |
| Avg Session Duration | ${Math.round(usage.average_session_duration)}s |
| Bounce Rate | ${usage.bounce_rate.toFixed(1)}% |
| Conversion Rate | ${usage.conversion_rate.toFixed(1)}% |

## Popular Organizations

| Organization | Views | Unique Views |
|-------------|--------|--------------|
${content.popular_organizations.slice(0, 10).map((org) =>
  `| ${org.name} | ${org.views} | ${org.unique_views} |`
).join('\n')}

## Top Search Queries

| Query | Count | Avg Results |
|-------|-------|------------|
${content.search_queries.slice(0, 10).map((query) =>
  `| ${query.query} | ${query.count} | ${query.results_count} |`
).join('\n')}

## Performance Metrics

| Metric | Value |
|--------|-------|
| Average Page Load Time | ${performance.average_page_load_time}ms |
| Error Rate | ${performance.error_rate.toFixed(2)}% |
| Uptime | ${performance.uptime_percentage.toFixed(2)}% |
| Cache Hit Rate | ${performance.cache_hit_rate.toFixed(1)}% |

### API Response Times

| Endpoint | Avg Time | Calls |
|----------|----------|--------|
${performance.api_response_times.map((api) =>
  `| ${api.endpoint} | ${api.average_time}ms | ${api.call_count.toLocaleString()} |`
).join('\n')}

## Business Metrics

| Metric | Value |
|--------|-------|
| Organizations Created | ${business.organizations_created} |
| Services Published | ${business.services_published} |
| Case Studies Published | ${business.case_studies_published} |
| User Logins | ${business.user_engagement.login_count} |
| Profile Completion Rate | ${business.user_engagement.profile_completion_rate.toFixed(1)}% |

### Feature Adoption Rates

${Object.entries(business.user_engagement.feature_adoption_rate).map(([feature, rate]) =>
  `- **${feature.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}:** ${rate.toFixed(1)}%`
).join('\n')}

## Subscription Metrics

| Metric | Value |
|--------|-------|
| Active Subscriptions | ${business.subscription_metrics.active_subscriptions} |
| New Subscriptions | ${business.subscription_metrics.new_subscriptions} |
| Churned Subscriptions | ${business.subscription_metrics.churned_subscriptions} |
| Monthly Recurring Revenue | ¥${business.subscription_metrics.mrr.toLocaleString()} |

---

*This report was automatically generated by the Analytics Dashboard System*
`;
}