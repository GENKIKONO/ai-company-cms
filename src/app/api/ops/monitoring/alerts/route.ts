/**
 * モニタリングアラート処理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { monitoringIntegration } from '@/lib/utils/monitoring-integration';

export async function POST(request: NextRequest) {
  try {
    // アラートの自動処理を実行
    await monitoringIntegration.processAlerts();
    
    return NextResponse.json({
      message: 'Alerts processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Alert processing failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to process alerts'
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';