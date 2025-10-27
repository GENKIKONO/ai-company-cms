import { NextRequest, NextResponse } from 'next/server';
import { getUserPlan } from '@/lib/user-plan';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userPlanInfo = await getUserPlan();
    
    return NextResponse.json({
      plan: userPlanInfo.plan,
      isActive: userPlanInfo.isActive,
      subscriptionId: userPlanInfo.subscriptionId,
      customerId: userPlanInfo.customerId
    });
  } catch (error) {
    logger.error('Error fetching user plan', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to fetch user plan', plan: 'free' },
      { status: 500 }
    );
  }
}