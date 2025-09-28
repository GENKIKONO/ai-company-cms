/**
 * モニタリングヘルスチェックAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringIntegration } from '@/lib/utils/monitoring-integration';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = await monitoringIntegration.getSystemHealth();
    
    return NextResponse.json({
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Health check API failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to perform health check'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';