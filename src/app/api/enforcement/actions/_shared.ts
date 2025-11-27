import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/log';

/**
 * 制裁時の自動非公開処理
 * suspended/frozen/deleted ユーザーの公開コンテンツを非公開にする
 * 
 * 重要: この関数は既存のSupabase関数 unpublish_org_public_content_for_user(p_user_id uuid) を呼び出す
 * この関数はDB側で定義され、手動テスト済みで正しく動作している（DBがソースオブトゥルース）
 */
export async function autoUnpublishPublicContentForUser(userId: string): Promise<void> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  logger.info('auto_unpublish_start', { 
    userId,
    component: 'enforcement-auto-unpublish',
    action: 'calling_unpublish_org_public_content_for_user'
  });

  try {
    const { error } = await supabaseAdmin.rpc('unpublish_org_public_content_for_user', {
      p_user_id: userId,
    });

    if (error) {
      logger.error('auto_unpublish_failed', { 
        userId, 
        error: error.message,
        component: 'enforcement-auto-unpublish',
        rpc_function: 'unpublish_org_public_content_for_user'
      });
    } else {
      logger.info('auto_unpublish_success', { 
        userId,
        component: 'enforcement-auto-unpublish',
        rpc_function: 'unpublish_org_public_content_for_user',
        result: 'public_content_unpublished'
      });
    }
  } catch (error) {
    logger.error('auto_unpublish_exception', { 
      userId, 
      error: error instanceof Error ? error.message : String(error),
      component: 'enforcement-auto-unpublish',
      rpc_function: 'unpublish_org_public_content_for_user'
    });
  }
}

// 共通のアクションスキーマ
export const EnforcementActionSchema = z.object({
  userId: z.string().uuid('有効なユーザーIDを指定してください'),
  message: z.string().min(1, 'メッセージは必須です').max(2000, 'メッセージは2000文字以内で入力してください'),
  deadline: z.string().datetime().optional()
});

// アクション種別ごとの設定
export const ACTION_CONFIGS = {
  warn: {
    targetStatus: 'warned',
    description: '警告',
    allowDeadline: true
  },
  suspend: {
    targetStatus: 'suspended',
    description: '一時停止',
    allowDeadline: true
  },
  freeze: {
    targetStatus: 'frozen',
    description: '凍結',
    allowDeadline: true
  },
  reinstate: {
    targetStatus: 'active',
    description: '復帰',
    allowDeadline: false
  },
  delete: {
    targetStatus: 'deleted',
    description: '削除',
    allowDeadline: false
  }
} as const;

export type ActionType = keyof typeof ACTION_CONFIGS;

/**
 * 制裁アクションを実行する共通関数
 */
export async function executeEnforcementAction(
  request: NextRequest,
  action: ActionType
) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn(`Enforcement ${action} API: Unauthorized access attempt`, {
        component: `enforcement-${action}`,
        error: authResult.error,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });
      return {
        success: false,
        error: authResult.error || 'Unauthorized',
        status: 401
      };
    }

    // リクエストボディの解析とバリデーション
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return {
        success: false,
        error: 'Invalid JSON format',
        status: 400
      };
    }

    const validation = EnforcementActionSchema.safeParse(body);
    if (!validation.success) {
      logger.warn(`Enforcement ${action} API: Invalid input`, {
        component: `enforcement-${action}`,
        errors: validation.error.errors,
        adminId: authResult.context?.user.id
      });
      return {
        success: false,
        error: 'Validation failed',
        details: validation.error.errors,
        status: 400
      };
    }

    const { userId, message, deadline } = validation.data;
    const config = ACTION_CONFIGS[action];

    // デッドラインの検証
    if (!config.allowDeadline && deadline) {
      return {
        success: false,
        error: `${config.description}アクションではデッドラインは設定できません`,
        status: 400
      };
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

    // ユーザー存在確認と現在の状態取得
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, account_status, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.warn(`Enforcement ${action} API: User not found`, {
        component: `enforcement-${action}`,
        userId,
        adminId: authResult.context?.user.id
      });
      return {
        success: false,
        error: 'User not found',
        status: 404
      };
    }

    // 削除済みアカウントに対するアクション制限
    if (user.account_status === 'deleted' && action !== 'reinstate') {
      return {
        success: false,
        error: '削除済みアカウントに対してはこのアクションは実行できません',
        status: 400
      };
    }

    // 現在の状態と同じ状態への変更を防ぐ
    if (user.account_status === config.targetStatus && action !== 'reinstate') {
      return {
        success: false,
        error: `ユーザーは既に${config.description}状態です`,
        status: 400
      };
    }

    // トランザクション開始
    const { data: actionRecord, error: actionError } = await supabase
      .from('enforcement_actions')
      .insert({
        user_id: userId,
        action,
        message,
        issued_by: authResult.context?.user.id,
        deadline: deadline || null
      })
      .select()
      .single();

    if (actionError) {
      logger.error(`Enforcement ${action} API: Failed to create action record`, {
        component: `enforcement-${action}`,
        userId,
        adminId: authResult.context?.user.id,
        error: actionError.message
      });
      return {
        success: false,
        error: 'Failed to create action record',
        status: 500
      };
    }

    // ユーザーの状態を更新
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ account_status: config.targetStatus })
      .eq('id', userId);

    if (updateError) {
      logger.error(`Enforcement ${action} API: Failed to update user status`, {
        component: `enforcement-${action}`,
        userId,
        targetStatus: config.targetStatus,
        actionId: actionRecord.id,
        error: updateError.message
      });
      return {
        success: false,
        error: 'Failed to update user status',
        status: 500
      };
    }

    logger.info(`Enforcement ${action} API: Action executed successfully`, {
      component: `enforcement-${action}`,
      actionId: actionRecord.id,
      userId,
      previousStatus: user.account_status,
      newStatus: config.targetStatus,
      adminId: authResult.context?.user.id,
      adminEmail: authResult.context?.user.email,
      hasDeadline: !!deadline
    });

    // 制裁対象状態の場合は自動非公開処理を実行
    // auto-unpublish が実行される状態遷移:
    // - suspended: アカウント一時停止 → 公開コンテンツ非公開
    // - frozen: アカウント凍結 → 公開コンテンツ非公開  
    // - deleted: アカウント削除 → 公開コンテンツ非公開
    if (['suspended', 'frozen', 'deleted'].includes(config.targetStatus)) {
      logger.info(`Enforcement ${action} API: auto-unpublish triggered`, {
        component: `enforcement-${action}`,
        userId,
        action_type: action,
        previous_status: user.account_status,
        new_status: config.targetStatus,
        auto_unpublish_reason: `status_transition_to_${config.targetStatus}`
      });
      
      // DB状態が確定してから自動非公開実行（既存のSupabase関数を呼び出し）
      await autoUnpublishPublicContentForUser(userId);
    } else {
      // 復帰や警告の場合はauto-unpublishは実行されない
      logger.info(`Enforcement ${action} API: auto-unpublish skipped`, {
        component: `enforcement-${action}`,
        userId,
        action_type: action,
        new_status: config.targetStatus,
        reason: 'non_sanctioned_status'
      });
    }

    return {
      success: true,
      data: {
        action: {
          id: actionRecord.id,
          userId: actionRecord.user_id,
          action: actionRecord.action,
          message: actionRecord.message,
          deadline: actionRecord.deadline,
          createdAt: actionRecord.created_at
        },
        user: {
          id: user.id,
          previousStatus: user.account_status,
          newStatus: config.targetStatus
        }
      },
      status: 200
    };

  } catch (error) {
    logger.error(`Enforcement ${action} API: Unexpected error`, {
      component: `enforcement-${action}`,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return {
      success: false,
      error: 'Internal server error',
      status: 500
    };
  }
}