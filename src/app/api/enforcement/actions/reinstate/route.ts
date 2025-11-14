import { NextRequest, NextResponse } from 'next/server';
import { executeEnforcementAction } from '../_shared';

/**
 * 復帰アクション実行API
 * POST /api/enforcement/actions/reinstate
 */
export async function POST(request: NextRequest) {
  const result = await executeEnforcementAction(request, 'reinstate');
  
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