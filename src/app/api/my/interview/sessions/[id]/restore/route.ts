/**
 * /api/my/interview/sessions/[id]/restore - AIインタビューセッション復元API（管理者専用）
 *
 * 【認証方式】
 * - createApiAuthClient を使用（統一認証ヘルパー）
 * - getUser() が唯一の Source of Truth
 * - Cookie 同期は applyCookies で行う
 *
 * @see src/lib/supabase/api-auth.ts
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException, ApiAuthFailure } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';
import type { SessionRestoreResponse } from '@/types/interview-session';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * EPIC 2-1: セッション復元API（管理者専用）
 *
 * 論理削除されたai_interview_sessionを復活させます。
 * - Owner/Admin ロールのみアクセス可能
 * - deleted_at を NULL に設定して復元
 * - 復元対象が存在しない、権限がない場合は適切なエラーレスポンス
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SessionRestoreResponse | { error: string } | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);
    const { id } = await params;

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return applyCookies(NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      ));
    }

    // まず対象セッションを取得（削除済みのものも含めて検索）
    // ※ RLS により管理者のみが削除済みレコードにアクセス可能
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, deleted_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for restoration:', fetchError);
      return applyCookies(NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      ));
    }

    if (!session) {
      return applyCookies(NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      ));
    }

    // 既に復元済み（削除されていない）場合
    if (!session.deleted_at) {
      return applyCookies(NextResponse.json(
        { error: 'Session is not deleted' },
        { status: 400 }
      ));
    }

    // 権限チェック：組織管理者（Owner/Admin）のみ復元可能
    if (!session.organization_id) {
      // 個人セッション（組織なし）の復元は、作成者本人のみ可能
      if (session.user_id !== user.id) {
        logger.warn('Unauthorized restore attempt for personal session:', {
          sessionId: id,
          userId: user.id,
          sessionUserId: session.user_id
        });
        return applyCookies(NextResponse.json(
          { error: 'Forbidden: Only the session owner can restore personal sessions' },
          { status: 403 }
        ));
      }
    } else {
      // 組織セッションの復元は Owner/Admin のみ
      try {
        await validateOrgAccess(session.organization_id, user.id, 'write');
      } catch (error) {
        if (error instanceof OrgAccessError) {
          logger.warn('Unauthorized restore attempt for organization session:', {
            sessionId: id,
            userId: user.id,
            organizationId: session.organization_id
          });
          return applyCookies(NextResponse.json(
            { error: 'Forbidden: Admin role required for session restoration' },
            { status: error.statusCode }
          ));
        }
        throw error;
      }
    }

    // 復元実行：deleted_at を NULL に設定
    const { data: restoredSession, error: restoreError } = await supabase
      .from('ai_interview_sessions')
      .update({
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .not('deleted_at', 'is', null) // 削除済みのもののみ対象
      .select('id')
      .maybeSingle();

    if (restoreError) {
      logger.error('Failed to restore session:', restoreError);
      return applyCookies(NextResponse.json(
        { error: 'Failed to restore session' },
        { status: 500 }
      ));
    }

    if (!restoredSession) {
      // セッションが見つからない、または既に復元済み
      return applyCookies(NextResponse.json(
        { error: 'Session not found or not in deleted state' },
        { status: 404 }
      ));
    }

    logger.info('Session restored successfully:', {
      sessionId: id,
      restoredBy: user.id,
      originalOwner: session.user_id,
      organizationId: session.organization_id
    });

    return applyCookies(NextResponse.json({ ok: true }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Session restore API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET, PUT, PATCH, DELETE メソッドは許可しない
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
