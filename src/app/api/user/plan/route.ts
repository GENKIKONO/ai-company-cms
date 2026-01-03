import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/user-plan';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 認証チェックをAPIレベルで実装
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        error: 'Unauthorized - Authentication required'
      }, { status: 401 });
    }

    const userPlanInfo = await getUserPlan();

    return NextResponse.json({
      plan: userPlanInfo.plan,
      isActive: userPlanInfo.isActive,
      subscriptionId: userPlanInfo.subscriptionId,
      customerId: userPlanInfo.customerId
    });
  } catch (error) {
    logger.error('Error fetching user plan', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Failed to fetch user plan' },
      { status: 500 }
    );
  }
}