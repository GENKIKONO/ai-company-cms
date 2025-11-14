import { NextRequest, NextResponse } from 'next/server';
import { executeEnforcementAction } from '../_shared';

/**
 * 警告アクション実行API
 * POST /api/enforcement/actions/warn
 */
export async function POST(request: NextRequest) {
  const result = await executeEnforcementAction(request, 'warn');
  
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