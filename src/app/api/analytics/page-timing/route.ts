import { NextRequest, NextResponse } from 'next/server';
import { logPerformanceMetrics } from '@/lib/api/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const timingData = await request.json();
    
    // ページタイミング情報をパフォーマンスメトリクスとして記録
    logPerformanceMetrics({
      timestamp: new Date().toISOString(),
      endpoint: 'page-timing.navigation',
      method: 'TIMING',
      responseTime: timingData.loadTime,
      metadata: {
        url: timingData.url,
        loadTime: timingData.loadTime,
        domContentLoaded: timingData.domContentLoaded,
        timeToInteractive: timingData.timeToInteractive,
        navigationTimestamp: timingData.timestamp
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record page timing:', error);
    return NextResponse.json(
      { error: 'Failed to record page timing' },
      { status: 500 }
    );
  }
}