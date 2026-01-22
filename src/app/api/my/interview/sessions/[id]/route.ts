/**
 * /api/my/interview/sessions/[id] - AIインタビューセッション詳細API
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
import { z } from 'zod';
import { createApiAuthClient, ApiAuthException, ApiAuthFailure } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/utils/logger';
import { validateOrgAccess, OrgAccessError } from '@/lib/utils/org-access';
import type {
  SessionDetailResponse,
  SessionDeleteResponse,
  SaveAnswersResponse
} from '@/types/interview-session';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SessionDetailResponse | { error: string } | ApiAuthFailure>> {
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

    // セッション取得
    const { data: session, error } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, content_type, status, answers, generated_content, meta, created_at, updated_at, version')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch interview session:', error);
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

    // 組織メンバー権限チェック
    if (session.organization_id) {
      try {
        await validateOrgAccess(session.organization_id, user.id, 'read');
      } catch (error) {
        if (error instanceof OrgAccessError) {
          logger.warn('Unauthorized access to session:', {
            sessionId: id,
            userId: user.id,
            organizationId: session.organization_id
          });
          return applyCookies(NextResponse.json(
            { error: 'Forbidden' },
            { status: error.statusCode }
          ));
        }
        throw error;
      }
    } else {
      // 組織に属さないセッションの場合、作成者本人のみアクセス可能
      if (session.user_id !== user.id) {
        logger.warn('Unauthorized access to personal session:', {
          sessionId: id,
          userId: user.id,
          sessionUserId: session.user_id
        });
        return applyCookies(NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        ));
      }
    }

    const response: SessionDetailResponse = {
      data: session,
      readOnly: session.status === 'completed',
    };

    return applyCookies(NextResponse.json(response));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Session detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// その他のHTTPメソッドは拒否
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

const SaveAnswersSchema = z.object({
  answers: z.record(z.unknown()),
  clientVersion: z.number().int().min(0),
});

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SaveAnswersResponse | ApiAuthFailure>> {
  try {
    const { supabase, user, applyCookies } = await createApiAuthClient(request);

    const { id } = await params;

    // UUID形式チェック
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return applyCookies(NextResponse.json(
        { message: 'Invalid session ID format' },
        { status: 400 }
      ));
    }

    // リクエストボディの解析・バリデーション
    const body = await request.json();
    const validationResult = SaveAnswersSchema.safeParse(body);

    if (!validationResult.success) {
      return applyCookies(NextResponse.json(
        { message: 'Invalid request body: ' + validationResult.error.message },
        { status: 400 }
      ));
    }

    const { answers, clientVersion } = validationResult.data;

    // まずセッションの存在と権限を確認
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, status, version')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for auto-save:', fetchError);
      return applyCookies(NextResponse.json(
        { message: 'Failed to fetch session' },
        { status: 500 }
      ));
    }

    if (!session) {
      return applyCookies(NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      ));
    }

    // 権限チェック
    if (session.organization_id) {
      try {
        await validateOrgAccess(session.organization_id, user.id, 'write');
      } catch (error) {
        if (error instanceof OrgAccessError) {
          logger.warn('Unauthorized access to session for auto-save:', {
            sessionId: id,
            userId: user.id,
            organizationId: session.organization_id
          });
          return applyCookies(NextResponse.json(
            { message: 'Forbidden' },
            { status: error.statusCode }
          ));
        }
        throw error;
      }
    } else {
      // 組織に属さないセッションの場合、作成者本人のみアクセス可能
      if (session.user_id !== user.id) {
        logger.warn('Unauthorized access to personal session for auto-save:', {
          sessionId: id,
          userId: user.id,
          sessionUserId: session.user_id
        });
        return applyCookies(NextResponse.json(
          { message: 'Forbidden' },
          { status: 403 }
        ));
      }
    }

    // 原子的な楽観ロック実装：RPCを使用
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('aiis_save_answers_with_version', {
        p_session_id: id,
        p_answers: answers,
        p_client_version: clientVersion
      });

    if (rpcError) {
      logger.error('RPC error during auto-save:', rpcError);
      return applyCookies(NextResponse.json(
        { message: rpcError.message },
        { status: 500 }
      ));
    }

    // RPC結果の処理
    if (rpcResult.success) {
      // 保存成功
      logger.info('Session answers auto-saved successfully:', {
        sessionId: id,
        userId: user.id,
        clientVersion,
        newVersion: rpcResult.new_version
      });

      return applyCookies(NextResponse.json({
        ok: true,
        newVersion: rpcResult.new_version,
        updatedAt: rpcResult.updated_at
      }));
    } else {
      // 競合発生: rpcResult.conflict が true
      logger.warn('Auto-save conflict detected:', {
        sessionId: id,
        userId: user.id,
        clientVersion,
        serverVersion: rpcResult.current_version
      });

      // 最新データを取得して409レスポンス
      const { data: latest, error: latestError } = await supabase
        .from('ai_interview_sessions')
        .select('id, version, updated_at, answers')
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();

      if (latestError) {
        logger.error('Failed to fetch latest session for conflict:', latestError);
        return applyCookies(NextResponse.json(
          { message: 'Failed to fetch latest session data' },
          { status: 500 }
        ));
      }

      if (!latest) {
        return applyCookies(NextResponse.json(
          { message: 'Session not found or has been deleted' },
          { status: 404 }
        ));
      }

      return applyCookies(NextResponse.json(
        {
          conflict: true,
          latest: {
            id: latest.id,
            version: latest.version,
            updated_at: latest.updated_at,
            answers: latest.answers,
          }
        },
        { status: 409 }
      ));
    }

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Session auto-save API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<SessionDeleteResponse | { error: string } | ApiAuthFailure>> {
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

    // まず対象セッションを取得
    const { data: session, error: fetchError } = await supabase
      .from('ai_interview_sessions')
      .select('id, organization_id, user_id, status')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchError) {
      logger.error('Failed to fetch session for deletion:', fetchError);
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

    // 権限チェック：作成者本人または組織管理者のみ削除可能
    let canDelete = false;

    // 1. 作成者本人なら削除OK
    if (session.user_id === user.id) {
      canDelete = true;
    }
    // 2. 組織セッションの場合、組織管理者も削除OK
    else if (session.organization_id) {
      try {
        await validateOrgAccess(session.organization_id, user.id, 'write');
        canDelete = true;
      } catch (error) {
        // 管理者権限なし
        logger.warn('Insufficient permissions for session deletion:', {
          sessionId: id,
          userId: user.id,
          organizationId: session.organization_id
        });
      }
    }

    if (!canDelete) {
      return applyCookies(NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ));
    }

    // 論理削除実行
    const { data: deletedSession, error: deleteError } = await supabase
      .from('ai_interview_sessions')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();

    if (deleteError) {
      logger.error('Failed to delete session:', deleteError);
      return applyCookies(NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      ));
    }

    if (!deletedSession) {
      // セッションが既に削除されているか存在しない
      return applyCookies(NextResponse.json(
        { error: 'Session not found or already deleted' },
        { status: 404 }
      ));
    }

    logger.info('Session deleted successfully:', {
      sessionId: id,
      deletedBy: user.id,
      originalOwner: session.user_id,
      organizationId: session.organization_id
    });

    return applyCookies(NextResponse.json({ ok: true }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('Session delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
