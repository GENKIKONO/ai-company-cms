import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, requireOrgRole } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
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
): Promise<NextResponse<SessionRestoreResponse | { error: string }>> {
  try {
    // 認証確認
    const user = await requireAuthUser();
    const { id } = await params;

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // まず対象セッションを取得（削除済みのものも含めて検索）
    // ※ RLS により管理者のみが削除済みレコードにアクセス可能
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, deleted_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for restoration:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch session' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // 既に復元済み（削除されていない）場合
    if (!session.deleted_at) {
      return NextResponse.json(
        { error: 'Session is not deleted' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: 'Forbidden: Only the session owner can restore personal sessions' },
          { status: 403 }
        );
      }
    } else {
      // 組織セッションの復元は Owner/Admin のみ
      try {
        await requireOrgRole(session.organization_id, ['owner', 'admin']);
      } catch (error) {
        logger.warn('Unauthorized restore attempt for organization session:', { 
          sessionId: id, 
          userId: user.id, 
          organizationId: session.organization_id,
          error
        });
        return NextResponse.json(
          { error: 'Forbidden: Admin role required for session restoration' },
          { status: 403 }
        );
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
      return NextResponse.json(
        { error: 'Failed to restore session' },
        { status: 500 }
      );
    }

    if (!restoredSession) {
      // セッションが見つからない、または既に復元済み
      return NextResponse.json(
        { error: 'Session not found or not in deleted state' },
        { status: 404 }
      );
    }

    logger.info('Session restored successfully:', {
      sessionId: id,
      restoredBy: user.id,
      originalOwner: session.user_id,
      organizationId: session.organization_id
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    logger.error('Session restore API error:', error);

    // 認証エラーの場合
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 組織メンバーアクセスエラーの場合
    if (error instanceof Error && (error.message.includes('Organization') || error.message.includes('Forbidden'))) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

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