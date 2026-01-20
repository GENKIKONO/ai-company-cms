/**
 * Security Metrics API
 * GET: セキュリティメトリクス取得（Admin専用）
 *
 * セキュリティ: ブラウザからの直接DB接続を禁止し、サーバー側で認証・認可を実施
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }

    const supabase = await createClient();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // 並列でデータ取得
    const [
      incidentsResult,
      rateLimitRequestsResult,
      serviceRoleStatsResult,
      anomaliesResult
    ] = await Promise.all([
      // Security incidents (last hour)
      supabase
        .from('security_incidents')
        .select('id, ip_address, incident_type, severity, risk_level, blocked, metadata, created_at')
        .gte('created_at', oneHourAgo.toISOString())
        .order('created_at', { ascending: false }),

      // Rate limit requests (last hour)
      supabase
        .from('rate_limit_requests')
        .select('id, ip_address, endpoint, path, is_suspicious, created_at')
        .gte('created_at', oneHourAgo.toISOString()),

      // Service role usage stats (RPC)
      (async () => {
        try {
          const res = await supabase.rpc('get_service_role_usage_stats');
          if (res.error) {
            logger.warn('get_service_role_usage_stats RPC failed', { data: res.error });
            return { data: null, error: res.error };
          }
          return res;
        } catch (err) {
          logger.warn('get_service_role_usage_stats RPC error', { data: err });
          return { data: null, error: err };
        }
      })(),

      // Anomaly detection (RPC)
      (async () => {
        try {
          const res = await supabase.rpc('detect_service_role_anomalies');
          if (res.error) {
            logger.warn('detect_service_role_anomalies RPC failed', { data: res.error });
            return { data: null, error: res.error };
          }
          return res;
        } catch (err) {
          logger.warn('detect_service_role_anomalies RPC error', { data: err });
          return { data: null, error: err };
        }
      })(),
    ]);

    const incidents = incidentsResult.data || [];
    const rateLimitRequests = rateLimitRequestsResult.data || [];

    // Calculate metrics
    const totalRequests = rateLimitRequests.length;
    const blockedRequests = incidents.filter(i => i.blocked).length;
    const suspiciousActivity = rateLimitRequests.filter(r => r.is_suspicious).length;

    // Top attackers
    const ipCounts: Record<string, { count: number; risk: string }> = {};
    incidents.forEach(incident => {
      const ip = incident.ip_address;
      if (!ipCounts[ip]) {
        ipCounts[ip] = { count: 0, risk: incident.risk_level || 'low' };
      }
      ipCounts[ip].count++;
      // Update to highest risk level
      if (getRiskPriority(incident.risk_level) > getRiskPriority(ipCounts[ip].risk)) {
        ipCounts[ip].risk = incident.risk_level;
      }
    });

    const topAttackers = Object.entries(ipCounts)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top paths
    const pathCounts: Record<string, number> = {};
    rateLimitRequests.forEach(req => {
      if (req.path) {
        pathCounts[req.path] = (pathCounts[req.path] || 0) + 1;
      }
    });

    const topPaths = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Active threats
    const activeThreats = topAttackers.filter(
      a => a.risk === 'critical' || a.risk === 'high'
    ).length;

    // Service role stats
    const serviceRoleStats = serviceRoleStatsResult.data;
    const anomalies = anomaliesResult.data;

    return NextResponse.json({
      success: true,
      data: {
        // Security Metrics
        metrics: {
          totalRequests,
          blockedRequests,
          suspiciousActivity,
          activeThreats,
          topAttackers,
          recentIncidents: incidents.slice(0, 20),
          rateLimitStats: {
            totalRequests,
            blockedRequests,
            topPaths
          }
        },
        // Service Role Stats
        serviceRoleStats: {
          totalOperations: serviceRoleStats?.summary?.total_operations || 0,
          highRiskOperations: serviceRoleStats?.summary?.high_risk_operations || 0,
          recentAnomalies: anomalies?.anomalies || []
        }
      },
      metadata: {
        generated_at: now.toISOString(),
        period_minutes: 60
      }
    });

  } catch (error) {
    logger.error('Security metrics API error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getRiskPriority(risk: string): number {
  const priorities: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  };
  return priorities[risk] || 0;
}
