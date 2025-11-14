import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { logger } from '@/lib/utils/logger';

// 次の違反フラグ更新のスキーマ
const UpdateNextViolationSchema = z.object({
  action: z.enum(['suspend', 'warn', 'none'], {
    errorMap: () => ({ message: 'action は suspend, warn, none のいずれかを指定してください' })
  }),
  note: z.string().optional()
});

/**
 * 次の違反フラグ更新API
 * PATCH /api/enforcement/users/[id]/next-violation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn('Enforcement next violation API: Unauthorized access attempt', {
        component: 'enforcement-next-violation',
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

    const validation = UpdateNextViolationSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Enforcement next violation API: Invalid input', {
        component: 'enforcement-next-violation',
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

    const { action, note } = validation.data;

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
      logger.warn('Enforcement next violation API: User not found', {
        component: 'enforcement-next-violation',
        userId,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 次の違反フラグを更新
    const updateData: any = {
      next_violation_set_at: new Date().toISOString(),
      next_violation_set_by: authResult.context?.user.id
    };

    if (action === 'none') {
      // 'none'の場合はフラグをクリア
      updateData.next_violation_action = null;
      updateData.next_violation_note = null;
    } else {
      // 'suspend' または 'warn'の場合はフラグを設定
      updateData.next_violation_action = action;
      updateData.next_violation_note = note || null;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      logger.error('Enforcement next violation API: Failed to update next violation flag', {
        component: 'enforcement-next-violation',
        userId,
        action,
        adminId: authResult.context?.user.id,
        error: updateError.message
      });
      return NextResponse.json(
        { success: false, error: 'Failed to update next violation flag' },
        { status: 500 }
      );
    }

    logger.info('Enforcement next violation API: Next violation flag updated', {
      component: 'enforcement-next-violation',
      userId,
      action: action === 'none' ? 'cleared' : action,
      note: note || null,
      adminId: authResult.context?.user.id,
      adminEmail: authResult.context?.user.email
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        action: action === 'none' ? null : action,
        note: action === 'none' ? null : (note || null),
        setAt: updateData.next_violation_set_at,
        setBy: authResult.context?.user.id
      }
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Enforcement next violation API: Unexpected error', {
      component: 'enforcement-next-violation',
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

/**
 * 次の違反フラグ取得API
 * GET /api/enforcement/users/[id]/next-violation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者認証チェック
    const authResult = await requireAdminAuth(request);
    if (!authResult.success) {
      logger.warn('Enforcement next violation API: Unauthorized access attempt', {
        component: 'enforcement-next-violation',
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

    // 次の違反フラグ情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        account_status,
        next_violation_action,
        next_violation_note,
        next_violation_set_at,
        next_violation_set_by
      `)
      .eq('id', userId)
      .single();

    // 設定者の情報を別途取得
    let setByAdminEmail = null;
    if (profile?.next_violation_set_by) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', profile.next_violation_set_by)
        .single();
      setByAdminEmail = adminProfile?.email || null;
    }

    if (profileError || !profile) {
      logger.warn('Enforcement next violation API: User not found', {
        component: 'enforcement-next-violation',
        userId,
        adminId: authResult.context?.user.id
      });
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const responseData = {
      userId: profile.id,
      email: profile.email,
      accountStatus: profile.account_status,
      nextViolationAction: profile.next_violation_action,
      nextViolationNote: profile.next_violation_note,
      nextViolationSetAt: profile.next_violation_set_at,
      nextViolationSetBy: profile.next_violation_set_by,
      setByAdminEmail
    };

    logger.info('Enforcement next violation API: Next violation flag retrieved', {
      component: 'enforcement-next-violation',
      userId,
      hasFlag: !!profile.next_violation_action,
      action: profile.next_violation_action,
      adminId: authResult.context?.user.id
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    const resolvedParams = await params;
    logger.error('Enforcement next violation API: Unexpected error', {
      component: 'enforcement-next-violation',
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