import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/user-plan';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { getUserWithClient } from '@/lib/core/auth-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック（Core auth-state wrapper経由）
    const supabase = await createClient();
    const user = await getUserWithClient(supabase);

    if (!user) {
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