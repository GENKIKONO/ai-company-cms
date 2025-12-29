import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring';

export async function GET() {
  try {
    const health = await healthCheck();

    // HTTPステータスコード: healthy/degraded=200, unhealthy=503
    const httpStatus = health.status === 'unhealthy' ? 503 : 200;

    return NextResponse.json(health, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}