import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring';

export async function GET() {
  try {
    const health = await healthCheck();
    
    // HTTPステータスコード: healthy=200, degraded=206, unhealthy=503
    let httpStatus: number;
    if (health.status === 'healthy') {
      httpStatus = 200;
    } else if (health.status === 'degraded') {
      httpStatus = 206; // Partial Content - システムは動作するが一部機能に問題
    } else {
      httpStatus = 503; // Service Unavailable
    }
    
    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}