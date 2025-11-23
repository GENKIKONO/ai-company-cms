import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import { logger } from '@/lib/utils/logger';
import { type UserSegment } from '@/types/database';
import { requireAuth, type AuthContext } from '@/lib/api/auth-middleware';
import { handleApiError, createErrorResponse } from '@/lib/api/error-responses';

export const dynamic = 'force-dynamic';

/**
 * Admin API: ユーザーのセグメントを更新
 * テスト・運用時のセグメント変更用
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const { segment }: { segment: UserSegment } = await request.json();

    // セグメントバリデーション
    if (!segment || !['test_user', 'early_user', 'normal_user'].includes(segment)) {
      return createErrorResponse('INVALID_SEGMENT', 'Invalid user segment', 400);
    }

    // 管理者権限チェック（簡易版）
    const isAdmin = (authResult as AuthContext).user.email?.includes('@') && 
                   (authResult as AuthContext).user.email?.includes('admin');
    
    if (!isAdmin) {
      return createErrorResponse('UNAUTHORIZED', 'Admin access required', 403);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Handle cookie setting errors
          }
        },
      },
    });

    // ユーザーセグメントを更新
    const { data, error } = await supabase
      .from('profiles')
      .update({ segment })
      .eq('id', id)
      .select('id, email, segment')
      .single();

    if (error) {
      logger.error('Failed to update user segment', {
        id,
        segment,
        error
      });
      return createErrorResponse('UPDATE_FAILED', 'Failed to update user segment', 500);
    }

    logger.info('User segment updated successfully', {
      id,
      newSegment: segment,
      adminId: (authResult as AuthContext).user.id
    });

    return NextResponse.json({
      success: true,
      user: data,
      message: `User segment updated to ${segment}`
    });

  } catch (error) {
    logger.error('[PATCH /api/admin/users/[id]/segment] Failed to update user segment', {
      data: error instanceof Error ? error : new Error(String(error))
    });
    return handleApiError(error);
  }
}

/**
 * GET: ユーザーの現在のセグメントを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Handle cookie setting errors
          }
        },
      },
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, segment')
      .eq('id', id)
      .single();

    if (error) {
      return createErrorResponse('USER_NOT_FOUND', 'User not found', 404);
    }

    return NextResponse.json({
      user: data,
      segment: data.segment || 'normal_user'
    });

  } catch (error) {
    return handleApiError(error);
  }
}