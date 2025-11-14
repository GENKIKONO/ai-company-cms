import { NextRequest, NextResponse } from 'next/server';
import { executeEnforcementAction } from '../_shared';

/**
 * 一時停止アクション実行API
 * POST /api/enforcement/actions/suspend
 */
export async function POST(request: NextRequest) {
  const result = await executeEnforcementAction(request, 'suspend');
  
  return NextResponse.json(
    { 
      success: result.success, 
      error: result.error,
      details: result.details,
      data: result.data
    },
    { status: result.status }
  );
}