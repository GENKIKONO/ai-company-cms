import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { QueryAnalyzer, QueryCacheManager, DatabaseConnectionOptimizer } from '@/lib/performance/database-optimization';
import { ImageOptimizationStats } from '@/lib/performance/image-optimization';

export async function GET(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // パフォーマンス統計を収集
    const performanceData = {
      timestamp: new Date().toISOString(),
      database: {
        queries: QueryAnalyzer.getQueryStats(),
        slowQueries: QueryAnalyzer.getSlowQueries(500),
        cache: QueryCacheManager.getStats(),
        connections: DatabaseConnectionOptimizer.getConnectionStats()
      },
      images: ImageOptimizationStats.getStats(),
      webVitals: await getWebVitalsStats()
    };

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error('Performance monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to get performance data' },
      { status: 500 }
    );
  }
}

async function getWebVitalsStats() {
  try {
    const { PerformanceStats } = await import('@/components/performance/WebVitalsReporter');
    return PerformanceStats.getStats();
  } catch (error) {
    console.error('Failed to get Web Vitals stats:', error);
    return {};
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    // 統計をリセット
    QueryAnalyzer.resetStats();
    QueryCacheManager.invalidate();
    ImageOptimizationStats.resetStats();
    
    const { PerformanceStats } = await import('@/components/performance/WebVitalsReporter');
    PerformanceStats.reset();

    return NextResponse.json({ 
      success: true, 
      message: 'Performance statistics reset successfully' 
    });
  } catch (error) {
    console.error('Failed to reset performance stats:', error);
    return NextResponse.json(
      { error: 'Failed to reset performance statistics' },
      { status: 500 }
    );
  }
}