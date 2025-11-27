import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/log';

// 違反登録のスキーマ
const CreateViolationSchema = z.object({
  userId: z.string().uuid('有効なユーザーIDを指定してください'),
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: 'severity は low, medium, high, critical のいずれかを指定してください' })
  }),
  reason: z.string().min(1, '違反理由は必須です').max(1000, '違反理由は1000文字以内で入力してください'),
  evidence: z.record(z.any()).optional(),
  autoAction: z.boolean().optional().default(false)
});

/**
 * 違反登録API
 * POST /api/enforcement/violations
 */
export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn('Enforcement violations API: Unauthorized access attempt', {
        component: 'enforcement-violations',
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // リクエストボディの解析とバリデーション
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    const validation = CreateViolationSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Enforcement violations API: Invalid input', {
        component: 'enforcement-violations',
        errors: validation.error.errors,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { userId, severity, reason, evidence, autoAction } = validation.data;

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

    // ユーザー存在確認（次の違反フラグも含む）
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, account_status, email, next_violation_action, next_violation_note')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn('Enforcement violations API: User not found', {
        component: 'enforcement-violations',
        userId,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 違反記録を挿入
    const { data: violation, error: violationError } = await supabase
      .from('violations')
      .insert({
        user_id: userId,
        severity,
        reason,
        evidence: evidence || null
      })
      .select()
      .single();

    if (violationError) {
      logger.error('Enforcement violations API: Failed to create violation', {
        component: 'enforcement-violations',
        userId,
        severity,
        adminId: authResult.context?.user.id,
        error: violationError.message
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create violation record' },
        { status: 500 }
      );
    }

    logger.info('Enforcement violations API: Violation created', {
      component: 'enforcement-violations',
      violationId: violation.id,
      userId,
      severity,
      adminId: authResult.context?.user.id,
      adminEmail: authResult.context?.user.email
    });

    // 制裁レベル推奨を取得
    let enforcementRecommendation = null;
    try {
      const { data: recommendationData, error: recommendationError } = await supabase
        .rpc('get_violation_enforcement_recommendation', { user_id: userId });

      if (recommendationError) {
        logger.error('getViolationEnforcementRecommendation failed', {
          component: 'enforcement-violations',
          violationId: violation.id,
          userId,
          error: recommendationError.message
        });
      } else {
        enforcementRecommendation = recommendationData;
        
        // 次の違反フラグがある場合は推奨に追加
        if (user.next_violation_action) {
          enforcementRecommendation = {
            ...enforcementRecommendation,
            nextViolationAction: user.next_violation_action,
            nextViolationNote: user.next_violation_note
          };
        }
        
        logger.debug('Enforcement recommendation retrieved', {
          component: 'enforcement-violations',
          violationId: violation.id,
          userId,
          recommendation: recommendationData,
          nextViolationAction: user.next_violation_action
        });
      }
    } catch (error) {
      logger.error('getViolationEnforcementRecommendation failed', {
        component: 'enforcement-violations',
        violationId: violation.id,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // 自動アクションが有効かつ深刻度が高い場合の処理
    if (autoAction && (severity === 'high' || severity === 'critical')) {
      try {
        const actionType = severity === 'critical' ? 'suspend' : 'warn';
        const actionMessage = severity === 'critical' 
          ? '重大な違反により一時停止処分を行いました' 
          : '違反行為について警告いたします';

        // アクション記録を作成
        const { data: action, error: actionError } = await supabase
          .from('enforcement_actions')
          .insert({
            user_id: userId,
            action: actionType,
            message: actionMessage,
            issued_by: authResult.context?.user.id,
            deadline: severity === 'critical' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() : null // 3日後
          })
          .select()
          .single();

        if (actionError) {
          logger.error('Enforcement violations API: Failed to create auto action', {
            component: 'enforcement-violations',
            violationId: violation.id,
            userId,
            actionType,
            error: actionError.message
          });
        } else {
          // ユーザーの状態を更新
          const newStatus = actionType === 'suspend' ? 'suspended' : 'warned';
          await supabase
            .from('profiles')
            .update({ account_status: newStatus })
            .eq('id', userId);

          logger.info('Enforcement violations API: Auto action executed', {
            component: 'enforcement-violations',
            violationId: violation.id,
            actionId: action.id,
            userId,
            actionType,
            newStatus,
            adminId: authResult.context?.user.id
          });
        }
      } catch (autoActionError) {
        logger.error('Enforcement violations API: Auto action failed', {
          component: 'enforcement-violations',
          violationId: violation.id,
          userId,
          error: autoActionError instanceof Error ? autoActionError.message : String(autoActionError)
        });
      }
    }

    return NextResponse.json({
      success: true,
      violation: {
        id: violation.id,
        userId: violation.user_id,
        severity: violation.severity,
        reason: violation.reason,
        createdAt: violation.created_at
      },
      enforcementRecommendation
    });

  } catch (error) {
    logger.error('Enforcement violations API: Unexpected error', {
      component: 'enforcement-violations',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}