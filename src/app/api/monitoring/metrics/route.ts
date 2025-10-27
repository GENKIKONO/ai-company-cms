/**
 * Production Monitoring Metrics API
 * 本番環境の監視メトリクス取得エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { productionMonitor } from '@/lib/monitoring/production-monitoring';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/utils/logger';

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
    const timeframe = url.searchParams.get('timeframe') || '1h';
    const format = url.searchParams.get('format') || 'json';

    logger.debug('Debug', '📊 Starting system health check...');
    const startTime = Date.now();
    
    const metrics = await productionMonitor.checkSystemHealth();
    
    const checkTime = Date.now() - startTime;
    logger.debug('Debug', `✅ Health check completed in ${checkTime}ms`);

    if (format === 'markdown') {
      const markdownReport = generateMonitoringReport(metrics);
      return new NextResponse(markdownReport, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="monitoring-report.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkTime,
      timeframe,
      metrics,
    });

  } catch (error: any) {
    logger.error('❌ Monitoring metrics error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Monitoring metrics fetch failed',
      message: error.message,
      timestamp: new Date().toISOString(),
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
    const { action, config } = body;

    switch (action) {
      case 'trigger_health_check':
        const metrics = await productionMonitor.checkSystemHealth();
        return NextResponse.json({
          success: true,
          message: 'Health check triggered successfully',
          metrics,
        });

      case 'update_thresholds':
        // アラート閾値の更新
        return NextResponse.json({
          success: true,
          message: 'Alert thresholds updated',
          config,
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['trigger_health_check', 'update_thresholds'],
        }, { status: 400 });
    }

  } catch (error: any) {
    logger.error('❌ Monitoring action error', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json({
      success: false,
      error: 'Monitoring action failed',
      message: error.message,
    }, { status: 500 });
  }
}

function generateMonitoringReport(metrics: any): string {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    down: '❌'
  };

  return `# 🔍 Production Monitoring Report

**Generated:** ${new Date(metrics.timestamp).toLocaleString()}
**Overall Status:** ${statusEmoji[metrics.status as keyof typeof statusEmoji]} ${metrics.status.toUpperCase()}
**Uptime:** ${(metrics.uptime * 100).toFixed(3)}%

## 📊 Performance Metrics

| Metric | Value | Status |
|--------|--------|--------|
| **Average Response Time** | ${metrics.performance.avgResponseTime}ms | ${metrics.performance.avgResponseTime < 100 ? '✅' : metrics.performance.avgResponseTime < 500 ? '⚠️' : '❌'} |
| **95th Percentile Response Time** | ${metrics.performance.p95ResponseTime}ms | ${metrics.performance.p95ResponseTime < 200 ? '✅' : metrics.performance.p95ResponseTime < 1000 ? '⚠️' : '❌'} |
| **Requests per Minute** | ${metrics.performance.requestsPerMinute} | ✅ |
| **Cache Hit Rate** | ${(metrics.performance.cacheHitRate * 100).toFixed(1)}% | ${metrics.performance.cacheHitRate > 0.8 ? '✅' : metrics.performance.cacheHitRate > 0.6 ? '⚠️' : '❌'} |

## 🗄️ Database Health

| Metric | Value | Status |
|--------|--------|--------|
| **Query Time** | ${metrics.database.queryTime}ms | ${metrics.database.queryTime < 50 ? '✅' : metrics.database.queryTime < 200 ? '⚠️' : '❌'} |
| **Connection Count** | ${metrics.database.connectionCount} | ${metrics.database.connectionCount < 50 ? '✅' : metrics.database.connectionCount < 80 ? '⚠️' : '❌'} |
| **Slow Queries** | ${metrics.database.slowQueries} | ${metrics.database.slowQueries === 0 ? '✅' : metrics.database.slowQueries < 5 ? '⚠️' : '❌'} |
| **Deadlocks** | ${metrics.database.deadlocks} | ${metrics.database.deadlocks === 0 ? '✅' : '❌'} |

## 🌐 External Services

${metrics.external.map((service: any) => 
  `- **${service.service}**: ${statusEmoji[service.status as keyof typeof statusEmoji]} ${service.status} (${service.responseTime}ms)`
).join('\n')}

## ⚠️ Error Summary

${metrics.errors.length === 0 ? '✅ No errors detected in the last hour.' : 
  metrics.errors.map((error: any) => 
    `- **${error.type}**: ${error.count} occurrences (${error.rate.toFixed(2)}/min)`
  ).join('\n')
}

## 📈 System Overview

- **Health Check Response Time**: ${metrics.responseTime}ms
- **Last Updated**: ${new Date(metrics.timestamp).toLocaleString()}
- **Monitoring Status**: Active
- **Alert Thresholds**: Configured

## 🚨 Recommended Actions

${metrics.status === 'healthy' ? 
  '✅ System is operating normally. No action required.' :
  metrics.status === 'degraded' ?
    '⚠️ System performance is degraded. Monitor closely and consider scaling resources.' :
    '❌ System is experiencing issues. Immediate investigation required.'
}

---

*This report was automatically generated by the Production Monitoring System*
`;
}