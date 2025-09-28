/**
 * Performance Monitoring API
 * システムパフォーマンス監視とレポート生成
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminAuthCheck } from '@/lib/auth/admin-auth';
import { CacheAnalytics, CacheWarmer } from '@/lib/performance/cache-strategy';
import { QueryCacheManager } from '@/lib/performance/database-optimization';

// Admin認証チェック
const requireAdmin = createAdminAuthCheck();

interface PerformanceMetrics {
  timestamp: string;
  cache: {
    stats: any;
    size: number;
    memoryUsage: number;
  };
  api: {
    averageResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
  database: {
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    loadAverage: number[];
  };
}

let performanceHistory: PerformanceMetrics[] = [];
let requestMetrics: Array<{ endpoint: string; responseTime: number; timestamp: number; status: number }> = [];

// リクエスト時間を記録するためのヘルパー
export function recordApiRequest(endpoint: string, responseTime: number, status: number = 200) {
  requestMetrics.push({
    endpoint,
    responseTime,
    timestamp: Date.now(),
    status,
  });
  
  // 過去1時間のデータのみ保持
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  requestMetrics = requestMetrics.filter(m => m.timestamp > oneHourAgo);
}

async function collectPerformanceMetrics(): Promise<PerformanceMetrics> {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  // API メトリクス計算
  const recentRequests = requestMetrics.filter(m => m.timestamp > Date.now() - 15 * 60 * 1000); // 過去15分
  const averageResponseTime = recentRequests.length > 0 
    ? recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length 
    : 0;
  const errorRequests = recentRequests.filter(req => req.status >= 400);
  const errorRate = recentRequests.length > 0 ? (errorRequests.length / recentRequests.length) * 100 : 0;

  return {
    timestamp: new Date().toISOString(),
    cache: {
      stats: CacheAnalytics.getStats(),
      size: QueryCacheManager.getSize(),
      memoryUsage: memoryUsage.heapUsed,
    },
    api: {
      averageResponseTime,
      totalRequests: recentRequests.length,
      errorRate,
    },
    database: {
      connectionCount: 0, // Supabaseの場合は取得困難
      activeQueries: 0, // 実装が必要
      slowQueries: recentRequests.filter(req => req.responseTime > 1000).length,
    },
    system: {
      memoryUsage,
      uptime,
      loadAverage: process.platform === 'linux' ? require('os').loadavg() : [0, 0, 0],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // Admin権限チェック
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return adminCheck.response;
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const format = url.searchParams.get('format') || 'json';

    switch (action) {
      case 'current':
        const currentMetrics = await collectPerformanceMetrics();
        return NextResponse.json({
          success: true,
          metrics: currentMetrics,
          timestamp: new Date().toISOString(),
        });

      case 'history':
        const hours = parseInt(url.searchParams.get('hours') || '24');
        const cutoff = Date.now() - hours * 60 * 60 * 1000;
        const filteredHistory = performanceHistory.filter(
          m => new Date(m.timestamp).getTime() > cutoff
        );
        
        return NextResponse.json({
          success: true,
          history: filteredHistory,
          totalPoints: filteredHistory.length,
          timeRange: `${hours}h`,
        });

      case 'report':
        const reportData = await generatePerformanceReport();
        
        if (format === 'markdown') {
          return new NextResponse(reportData.markdown, {
            headers: {
              'Content-Type': 'text/markdown',
              'Content-Disposition': 'attachment; filename="performance-report.md"',
            },
          });
        }
        
        return NextResponse.json({
          success: true,
          report: reportData,
        });

      case 'warm-cache':
        // キャッシュウォーミング実行
        await Promise.allSettled([
          CacheWarmer.warmPopularOrganizations(),
          CacheWarmer.warmPopularSearches(['AI', 'DX', 'デジタル変革', 'システム開発']),
        ]);
        
        return NextResponse.json({
          success: true,
          message: 'Cache warming completed',
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          message: 'Performance Monitoring API',
          actions: {
            'current': 'Get current performance metrics',
            'history': 'Get performance history (query: hours=24)',
            'report': 'Generate performance report (query: format=json|markdown)',
            'warm-cache': 'Warm up caches for better performance',
          },
          status: 'Ready',
        });
    }

  } catch (error: any) {
    console.error('❌ Performance API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Performance monitoring failed',
      message: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Admin権限チェック
    const adminCheck = await requireAdmin(request);
    if (adminCheck.error) {
      return adminCheck.response;
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'collect':
        // 現在のメトリクスを収集して履歴に追加
        const metrics = await collectPerformanceMetrics();
        performanceHistory.push(metrics);
        
        // 過去7日間のデータのみ保持
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        performanceHistory = performanceHistory.filter(
          m => new Date(m.timestamp).getTime() > sevenDaysAgo
        );
        
        return NextResponse.json({
          success: true,
          message: 'Performance metrics collected',
          metrics,
        });

      case 'reset-cache-stats':
        CacheAnalytics.resetStats();
        return NextResponse.json({
          success: true,
          message: 'Cache statistics reset',
        });

      case 'clear-cache':
        QueryCacheManager.clear();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared',
        });

      case 'record-request':
        const { endpoint, responseTime, status = 200 } = body;
        if (!endpoint || responseTime === undefined) {
          return NextResponse.json({
            error: 'Missing required parameters: endpoint, responseTime',
          }, { status: 400 });
        }
        
        recordApiRequest(endpoint, responseTime, status);
        return NextResponse.json({
          success: true,
          message: 'Request recorded',
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          validActions: ['collect', 'reset-cache-stats', 'clear-cache', 'record-request'],
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ Performance API POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Performance operation failed',
      message: error.message,
    }, { status: 500 });
  }
}

async function generatePerformanceReport() {
  const currentMetrics = await collectPerformanceMetrics();
  const recentHistory = performanceHistory.slice(-24); // 直近24ポイント
  
  // 平均値計算
  const avgResponseTime = recentHistory.length > 0
    ? recentHistory.reduce((sum, m) => sum + m.api.averageResponseTime, 0) / recentHistory.length
    : 0;
  
  const avgErrorRate = recentHistory.length > 0
    ? recentHistory.reduce((sum, m) => sum + m.api.errorRate, 0) / recentHistory.length
    : 0;

  const cacheStats = CacheAnalytics.getStats();
  
  // レポート生成
  const report = {
    summary: {
      status: getOverallStatus(currentMetrics),
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(currentMetrics.system.uptime / 3600)}h ${Math.floor((currentMetrics.system.uptime % 3600) / 60)}m`,
    },
    performance: {
      averageResponseTime: Math.round(avgResponseTime),
      currentResponseTime: Math.round(currentMetrics.api.averageResponseTime),
      errorRate: Math.round(avgErrorRate * 100) / 100,
      slowQueries: currentMetrics.database.slowQueries,
    },
    cache: {
      hitRate: Math.round(cacheStats.hitRate * 100) / 100,
      totalRequests: cacheStats.totalRequests,
      memoryUsage: Math.round(currentMetrics.cache.memoryUsage / 1024 / 1024), // MB
      recommendations: generateCacheRecommendations(cacheStats),
    },
    system: {
      memoryUsage: {
        used: Math.round(currentMetrics.system.memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(currentMetrics.system.memoryUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((currentMetrics.system.memoryUsage.heapUsed / currentMetrics.system.memoryUsage.heapTotal) * 100),
      },
    },
    recommendations: generatePerformanceRecommendations(currentMetrics, avgResponseTime, avgErrorRate),
  };

  const markdown = generateMarkdownReport(report);

  return { ...report, markdown };
}

function getOverallStatus(metrics: PerformanceMetrics): 'excellent' | 'good' | 'warning' | 'critical' {
  if (metrics.api.averageResponseTime > 2000 || metrics.api.errorRate > 5) {
    return 'critical';
  }
  if (metrics.api.averageResponseTime > 1000 || metrics.api.errorRate > 2) {
    return 'warning';
  }
  if (metrics.api.averageResponseTime > 500) {
    return 'good';
  }
  return 'excellent';
}

function generateCacheRecommendations(cacheStats: any): string[] {
  const recommendations = [];
  
  if (cacheStats.hitRate < 70) {
    recommendations.push('キャッシュヒット率が低いです。キャッシュ戦略の見直しを検討してください。');
  }
  
  if (cacheStats.totalRequests < 100) {
    recommendations.push('キャッシュ使用量が少ないです。より多くのAPIでキャッシュを活用できます。');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('キャッシュパフォーマンスは良好です。');
  }
  
  return recommendations;
}

function generatePerformanceRecommendations(
  metrics: PerformanceMetrics, 
  avgResponseTime: number, 
  avgErrorRate: number
): string[] {
  const recommendations = [];
  
  if (avgResponseTime > 1000) {
    recommendations.push('API応答時間が目標(1秒)を超えています。データベースクエリの最適化を検討してください。');
  }
  
  if (avgErrorRate > 1) {
    recommendations.push('エラー率が高いです。エラーハンドリングとモニタリングを強化してください。');
  }
  
  if (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal > 0.85) {
    recommendations.push('メモリ使用率が高いです。メモリリークの調査が必要です。');
  }
  
  if (metrics.database.slowQueries > 5) {
    recommendations.push('スロークエリが多発しています。データベースインデックスの見直しを検討してください。');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('システムパフォーマンスは良好です。');
  }
  
  return recommendations;
}

function generateMarkdownReport(report: any): string {
  return `# Performance Report

**Generated:** ${report.summary.timestamp}
**Status:** ${report.summary.status.toUpperCase()}
**Uptime:** ${report.summary.uptime}

## Performance Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Average Response Time | ${report.performance.averageResponseTime}ms | <1000ms | ${report.performance.averageResponseTime < 1000 ? '✅' : '❌'} |
| Error Rate | ${report.performance.errorRate}% | <1% | ${report.performance.errorRate < 1 ? '✅' : '❌'} |
| Cache Hit Rate | ${report.cache.hitRate}% | >80% | ${report.cache.hitRate > 80 ? '✅' : '❌'} |
| Memory Usage | ${report.system.memoryUsage.percentage}% | <85% | ${report.system.memoryUsage.percentage < 85 ? '✅' : '❌'} |

## Cache Performance

- **Hit Rate:** ${report.cache.hitRate}%
- **Total Requests:** ${report.cache.totalRequests}
- **Memory Usage:** ${report.cache.memoryUsage} MB

### Cache Recommendations

${report.cache.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

## System Resources

- **Memory Used:** ${report.system.memoryUsage.used} MB / ${report.system.memoryUsage.total} MB (${report.system.memoryUsage.percentage}%)

## Recommendations

${report.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

---

*This report was automatically generated by the Performance Monitoring System*
`;
}

// 定期的なメトリクス収集（開発時のみ）
if (process.env.NODE_ENV === 'development') {
  setInterval(async () => {
    try {
      const metrics = await collectPerformanceMetrics();
      performanceHistory.push(metrics);
      
      // メモリ使用量制限
      if (performanceHistory.length > 1000) {
        performanceHistory = performanceHistory.slice(-500);
      }
    } catch (error) {
      console.error('Periodic metrics collection failed:', error);
    }
  }, 5 * 60 * 1000); // 5分間隔
}