/**
 * モニタリングヘルスチェックAPI
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringIntegration } from '@/lib/utils/monitoring-integration';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const healthStatus = await monitoringIntegration.getSystemHealth();
    
    return NextResponse.json({
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Health check API failed', error instanceof Error ? error : new Error(String(error)));
    
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