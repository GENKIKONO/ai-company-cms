import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/log';

interface EnforcementStatusParams {
  params: Promise<{ id: string }>;
}

/**
 * ユーザーの制裁状態取得API
 * GET /api/enforcement/users/[id]/status
 */
export async function GET(
  request: NextRequest,
  context: EnforcementStatusParams
) {
  try {
    const { id: userId } = await context.params;

    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn('Enforcement user status API: Unauthorized access attempt', {
        component: 'enforcement-user-status',
        userId,
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // ユーザーID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
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

    // ユーザー基本情報取得
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, account_status, created_at')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn('Enforcement user status API: User not found', {
        component: 'enforcement-user-status',
        userId,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 違反履歴取得
    const { data: violations, error: violationsError } = await supabase
      .from('violations')
      .select('id, severity, reason, detected_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (violationsError) {
      logger.error('Enforcement user status API: Failed to fetch violations', {
        component: 'enforcement-user-status',
        userId,
        error: violationsError.message
      });
    }

    // アクション履歴取得
    const { data: actions, error: actionsError } = await supabase
      .from('enforcement_actions')
      .select(`
        id,
        action,
        message,
        effective_from,
        deadline,
        processed_at,
        created_at,
        issued_by_profile:profiles!enforcement_actions_issued_by_fkey(
          id,
          email
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (actionsError) {
      logger.error('Enforcement user status API: Failed to fetch actions', {
        component: 'enforcement-user-status',
        userId,
        error: actionsError.message
      });
    }

    // 違反カウント集計
    const violationCounts = {
      total: violations?.length || 0,
      low: violations?.filter(v => v.severity === 'low').length || 0,
      medium: violations?.filter(v => v.severity === 'medium').length || 0,
      high: violations?.filter(v => v.severity === 'high').length || 0,
      critical: violations?.filter(v => v.severity === 'critical').length || 0
    };

    // 最新のアクション
    const lastAction = actions?.[0] || null;

    // アクティブな期限付きアクション
    const activeActions = actions?.filter(
      action => action.deadline && action.deadline > new Date().toISOString() && !action.processed_at
    ) || [];

    logger.info('Enforcement user status API: Status retrieved', {
      component: 'enforcement-user-status',
      userId,
      currentStatus: user.account_status,
      violationCount: violationCounts.total,
      actionCount: actions?.length || 0,
      adminId: authResult.context?.user.id
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          currentStatus: user.account_status,
          createdAt: user.created_at
        },
        violations: {
          count: violationCounts,
          recent: violations?.map(v => ({
            id: v.id,
            severity: v.severity,
            reason: v.reason,
            detectedAt: v.detected_at,
            createdAt: v.created_at
          })) || []
        },
        actions: {
          count: actions?.length || 0,
          lastAction: lastAction ? {
            id: lastAction.id,
            action: lastAction.action,
            message: lastAction.message,
            effectiveFrom: lastAction.effective_from,
            deadline: lastAction.deadline,
            processedAt: lastAction.processed_at,
            createdAt: lastAction.created_at,
            issuedBy: lastAction.issued_by_profile
          } : null,
          activeActions: activeActions.map(action => ({
            id: action.id,
            action: action.action,
            message: action.message,
            deadline: action.deadline,
            effectiveFrom: action.effective_from,
            createdAt: action.created_at
          })),
          history: actions?.map(action => ({
            id: action.id,
            action: action.action,
            message: action.message,
            effectiveFrom: action.effective_from,
            deadline: action.deadline,
            processedAt: action.processed_at,
            createdAt: action.created_at,
            issuedBy: action.issued_by_profile
          })) || []
        }
      }
    });

  } catch (error) {
    logger.error('Enforcement user status API: Unexpected error', {
      component: 'enforcement-user-status',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}