import { NextRequest, NextResponse } from 'next/server';
import { executeEnforcementAction } from '../_shared';

/**
 * 削除アクション実行API
 * POST /api/enforcement/actions/delete
 */
export async function POST(request: NextRequest) {
  const result = await executeEnforcementAction(request, 'delete');
  
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