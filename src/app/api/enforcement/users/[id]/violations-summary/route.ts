import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/utils/logger';

/**
 * ユーザー違反統計取得API
 * GET /api/enforcement/users/[id]/violations-summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn('Enforcement violations summary API: Unauthorized access attempt', {
        component: 'enforcement-violations-summary',
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (!userId || userId.length !== 36) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Service Role でデータベースアクセス
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // ユーザー存在確認
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, account_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn('Enforcement violations summary API: User not found', {
        component: 'enforcement-violations-summary',
        userId,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 違反統計を user_violation_stats ビューから取得
    const { data: violationStats, error: statsError } = await supabase
      .from('user_violation_stats')
      .select('user_id, total_violations, violations_3y, violations_2y, violations_1y, violations_6m, high_violations_1y, last_violation_at, last_violation_rule')
      .eq('user_id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      logger.error('Enforcement violations summary API: Failed to get violation stats', {
        component: 'enforcement-violations-summary',
        userId,
        adminId: authResult.context?.user.id,
        error: statsError.message
      });
    }

    // 推奨制裁レベルを取得
    let recommendation = null;
    try {
      const { data: recommendationData, error: recommendationError } = await supabase
        .rpc('get_violation_enforcement_recommendation', { user_id: userId });

      if (recommendationError) {
        logger.error('Enforcement violations summary API: Failed to get recommendation', {
          component: 'enforcement-violations-summary',
          userId,
          adminId: authResult.context?.user.id,
          error: recommendationError.message
        });
      } else {
        recommendation = recommendationData;
      }
    } catch (error) {
      logger.error('Enforcement violations summary API: Recommendation RPC failed', {
        component: 'enforcement-violations-summary',
        userId,
        adminId: authResult.context?.user.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // レスポンスデータを構築
    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        account_status: user.account_status
      },
      violationStats: violationStats ? {
        total_violations: violationStats.total_violations || 0,
        violations_3y: violationStats.violations_3y || 0,
        violations_2y: violationStats.violations_2y || 0,
        violations_1y: violationStats.violations_1y || 0,
        violations_6m: violationStats.violations_6m || 0,
        high_violations_1y: violationStats.high_violations_1y || 0,
        last_violation_at: violationStats.last_violation_at,
        last_violation_rule: violationStats.last_violation_rule
      } : {
        total_violations: 0,
        violations_3y: 0,
        violations_2y: 0,
        violations_1y: 0,
        violations_6m: 0,
        high_violations_1y: 0,
        last_violation_at: null,
        last_violation_rule: null
      },
      recommendation
    };

    logger.info('Enforcement violations summary API: Summary retrieved successfully', {
      component: 'enforcement-violations-summary',
      userId,
      adminId: authResult.context?.user.id,
      totalViolations: responseData.violationStats.total_violations,
      recommendationLevel: recommendation?.level || 'none'
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Enforcement violations summary API: Unexpected error', {
      component: 'enforcement-violations-summary',
      userId: resolvedParams.id,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}