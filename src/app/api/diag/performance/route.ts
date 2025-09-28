import { NextRequest, NextResponse } from 'next/server';
import { QueryAnalyzer, QueryCacheManager, DatabaseConnectionOptimizer } from '@/lib/performance/database-optimization';
import { ImageOptimizationStats } from '@/lib/performance/image-optimization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * パフォーマンス診断API
 * システム全体のパフォーマンス状況を診断・レポート
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 基本システム情報
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };

    // データベースパフォーマンス統計
    const dbPerformance = {
      queries: QueryAnalyzer.getQueryStats(),
      slowQueries: QueryAnalyzer.getSlowQueries(500),
      cache: QueryCacheManager.getStats(),
      connections: DatabaseConnectionOptimizer.getConnectionStats()
    };

    // 画像最適化統計
    const imageStats = ImageOptimizationStats.getStats();

    // Web Vitals統計
    let webVitalsStats = {};
    try {
      const { PerformanceStats } = await import('@/components/performance/WebVitalsReporter');
      webVitalsStats = PerformanceStats.getStats();
    } catch (error) {
      console.warn('Failed to get Web Vitals stats:', error);
    }

    // パフォーマンス評価
    const performanceAssessment = {
      database: {
        status: dbPerformance.queries.avgDuration < 500 ? 'good' : 
                dbPerformance.queries.avgDuration < 1000 ? 'warning' : 'critical',
        avgResponseTime: dbPerformance.queries.avgDuration,
        slowQueryCount: dbPerformance.slowQueries.length,
        cacheHitRate: dbPerformance.queries.cacheHitRate
      },
      memory: {
        status: systemInfo.memoryUsage.heapUsed < 100 * 1024 * 1024 ? 'good' : 
                systemInfo.memoryUsage.heapUsed < 200 * 1024 * 1024 ? 'warning' : 'critical',
        heapUsed: Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(systemInfo.memoryUsage.heapTotal / 1024 / 1024),
        utilization: Math.round((systemInfo.memoryUsage.heapUsed / systemInfo.memoryUsage.heapTotal) * 100)
      },
      images: {
        status: imageStats.averageCompressionRatio > 0.7 ? 'good' : 'warning',
        totalOptimized: imageStats.totalRequests,
        bytesSaved: Math.round(imageStats.totalBytesSaved / 1024),
        cacheHitRate: Math.round(imageStats.cacheHitRate * 100)
      }
    };

    // 推奨アクション
    const recommendations = [];
    
    if (performanceAssessment.database.status !== 'good') {
      recommendations.push({
        category: 'database',
        priority: performanceAssessment.database.status === 'critical' ? 'high' : 'medium',
        message: 'データベースクエリの最適化が必要です',
        action: 'スロークエリを確認し、インデックスやキャッシュ戦略を見直してください'
      });
    }

    if (performanceAssessment.memory.status !== 'good') {
      recommendations.push({
        category: 'memory',
        priority: performanceAssessment.memory.status === 'critical' ? 'high' : 'medium',
        message: 'メモリ使用量が高くなっています',
        action: 'メモリリークの確認やガベージコレクションの調整を検討してください'
      });
    }

    if (dbPerformance.queries.cacheHitRate < 50) {
      recommendations.push({
        category: 'cache',
        priority: 'medium',
        message: 'キャッシュヒット率が低下しています',
        action: 'キャッシュ戦略の見直しやTTL設定の調整を検討してください'
      });
    }

    const diagnosticTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      diagnosticTime,
      system: systemInfo,
      performance: {
        database: dbPerformance,
        images: imageStats,
        webVitals: webVitalsStats
      },
      assessment: performanceAssessment,
      recommendations,
      meta: {
        generatedAt: new Date().toISOString(),
        diagnosticVersion: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Performance diagnostic failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run performance diagnostic',
      diagnosticTime: Date.now() - startTime,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}