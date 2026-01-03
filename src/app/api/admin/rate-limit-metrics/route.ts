/**
 * Rate Limit Metrics API - DB紐付けUIのための最小API
 * GET /api/admin/rate-limit-metrics
 *
 * 返却内容:
 * - 書き込み経路メタ情報
 * - 直近15分の rate_limit_requests 件数
 * - 直近10分の rate_limit_logs ip別Top
 * - 直近1日の security_incidents 件数 by risk_level
 * - 5分窓ヘルス（失敗率）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';

// 固定メタ情報（DB紐付けビュー相当）
const WRITE_PATHS_META = [
  {
    table_name: 'rate_limit_requests',
    function_name: 'logRateLimitRequest',
    code_lines: 'L469-479',
    callers: ['enhancedSecurityGuard L270'],
    created_at_explicit: false,
    required_role: 'service_role',
    notes: 'middleware.ts - 成功リクエストのログ記録',
  },
  {
    table_name: 'rate_limit_logs',
    function_name: 'logAccess',
    code_lines: 'L802-816',
    callers: ['aiVisibilityGuard L546/560/578/594/602'],
    created_at_explicit: false,
    required_role: 'service_role',
    notes: 'middleware.ts - アクセスログ（AI Visibility Guard経由）',
  },
  {
    table_name: 'security_incidents',
    function_name: 'logSecurityIncident',
    code_lines: 'L441-452',
    callers: ['enhancedSecurityGuard L232/242/261'],
    created_at_explicit: false,
    required_role: 'service_role',
    notes: 'middleware.ts - セキュリティインシデント記録',
  },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証確認（Admin限定）
    const user = await getUserFullWithClient(supabase);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (user.user_metadata?.role as string) ||
                     (user.app_metadata?.role as string) ||
                     user.app_role;

    if (!['super_admin', 'admin'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 並列でデータ取得
    const [
      requestsResult,
      logsResult,
      incidentsResult,
    ] = await Promise.all([
      // 直近15分の rate_limit_requests 件数
      supabase
        .from('rate_limit_requests')
        .select('id, created_at, ip_address, is_suspicious, risk_level')
        .gte('created_at', fifteenMinutesAgo.toISOString()),

      // 直近10分の rate_limit_logs（ip別Top取得用）
      supabase
        .from('rate_limit_logs')
        .select('id, ip_address, timestamp, status_code, is_bot')
        .gte('timestamp', tenMinutesAgo.toISOString()),

      // 直近1日の security_incidents（risk_level別）
      supabase
        .from('security_incidents')
        .select('id, risk_level, incident_type, created_at')
        .gte('created_at', oneDayAgo.toISOString()),
    ]);

    // rate_limit_requests 集計
    const requests = requestsResult.data || [];
    const requestsCount = requests.length;
    const suspiciousCount = requests.filter(r => r.is_suspicious).length;
    const recentRequests = requests.filter(
      r => new Date(r.created_at) >= fiveMinutesAgo
    ).length;

    // rate_limit_logs ip別Top10
    const logs = logsResult.data || [];
    const ipCounts: Record<string, { count: number; botCount: number }> = {};
    for (const log of logs) {
      const ip = log.ip_address || 'unknown';
      if (!ipCounts[ip]) {
        ipCounts[ip] = { count: 0, botCount: 0 };
      }
      ipCounts[ip].count++;
      if (log.is_bot) {
        ipCounts[ip].botCount++;
      }
    }
    const topIPs = Object.entries(ipCounts)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // security_incidents risk_level別集計
    const incidents = incidentsResult.data || [];
    const incidentsByRisk: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const inc of incidents) {
      const risk = inc.risk_level || 'medium';
      incidentsByRisk[risk] = (incidentsByRisk[risk] || 0) + 1;
    }

    // incident_type別集計
    const incidentsByType: Record<string, number> = {};
    for (const inc of incidents) {
      const type = inc.incident_type || 'unknown';
      incidentsByType[type] = (incidentsByType[type] || 0) + 1;
    }

    // 5分窓ヘルス（現在はDBからの失敗率取得は未実装、0%を返す）
    // 将来的にはSentryメトリクスまたはDB集計テーブルから取得
    const healthMetrics = {
      window_minutes: 5,
      insert_failure_rate_pct: 0,
      status: 'healthy' as const,
    };

    return NextResponse.json({
      success: true,
      data: {
        write_paths_meta: WRITE_PATHS_META,
        rate_limit_requests: {
          period_minutes: 15,
          total_count: requestsCount,
          suspicious_count: suspiciousCount,
          recent_5min_count: recentRequests,
        },
        rate_limit_logs: {
          period_minutes: 10,
          total_count: logs.length,
          top_ips: topIPs,
        },
        security_incidents: {
          period_hours: 24,
          total_count: incidents.length,
          by_risk_level: incidentsByRisk,
          by_incident_type: incidentsByType,
        },
        health: healthMetrics,
      },
      metadata: {
        generated_at: now.toISOString(),
        timezone: 'UTC',
      },
    });

  } catch (error) {
    logger.error('Rate limit metrics API error:', { data: error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rate limit metrics',
      },
      { status: 500 }
    );
  }
}
