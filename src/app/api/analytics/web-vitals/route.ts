import { NextRequest, NextResponse } from 'next/server';
import { logPerformanceMetrics } from '@/lib/api/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const vitalsData = await request.json();
    
    // Web Vitals データをパフォーマンスメトリクスとして記録
    logPerformanceMetrics({
      timestamp: new Date().toISOString(),
      endpoint: `web-vitals.${vitalsData.name}`,
      method: 'METRIC',
      responseTime: vitalsData.value,
      metadata: {
        metricName: vitalsData.name,
        value: vitalsData.value,
        rating: vitalsData.rating,
        delta: vitalsData.delta,
        url: vitalsData.url,
        userAgent: vitalsData.userAgent
      }
    });

    // パフォーマンス統計に追加
    const { PerformanceStats } = await import('@/components/performance/WebVitalsReporter');
    PerformanceStats.addMetric(vitalsData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record web vitals:', error);
    return NextResponse.json(
      { error: 'Failed to record web vitals' },
      { status: 500 }
    );
  }
}