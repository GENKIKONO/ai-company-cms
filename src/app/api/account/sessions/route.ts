/**
 * Session Management API
 * GET /api/account/sessions - アクティブセッション一覧
 * DELETE /api/account/sessions - 指定セッション無効化
 * POST /api/account/sessions/revoke-all - 全セッション無効化
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { handleApiError, validationError } from '@/lib/api/error-responses';
import { logger } from '@/lib/utils/logger';
import {
  getUserSessions,
  invalidateSession,
  invalidateAllUserSessions,
} from '@/lib/security/session-management';
import { z } from 'zod';

/**
 * GET: アクティブセッション一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 現在のセッションIDを取得（Cookieから）
    const currentSessionId = request.cookies.get('session_id')?.value;

    const sessions = await getUserSessions(user.id, currentSessionId);

    // センシティブな情報をマスク
    const sanitizedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      createdAt: s.createdAt.toISOString(),
      lastActivityAt: s.lastActivityAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      ipAddress: s.ipAddress ? maskIP(s.ipAddress) : null,
      deviceType: s.deviceType,
      browser: s.userAgent ? parseBrowser(s.userAgent) : 'Unknown',
      isCurrent: s.isCurrent,
    }));

    return NextResponse.json({
      success: true,
      sessions: sanitizedSessions,
      count: sanitizedSessions.length,
    });
  } catch (error) {
    logger.error('[Sessions API] Error getting sessions', { error });
    return handleApiError(error);
  }
}

/**
 * DELETE: 指定セッションを無効化
 */
const deleteSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // リクエストボディ検証
    const body = await request.json();
    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return validationError(validation.error.flatten().fieldErrors);
    }

    const { sessionId } = validation.data;

    // 現在のセッションIDを取得
    const currentSessionId = request.cookies.get('session_id')?.value;

    // 現在のセッションは無効化できない
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: 'Cannot revoke current session. Use logout instead.' },
        { status: 400 }
      );
    }

    // セッションがユーザーのものか確認
    const sessions = await getUserSessions(user.id);
    const targetSession = sessions.find((s) => s.sessionId === sessionId);

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    await invalidateSession(sessionId, 'user_revoked');

    logger.info('[Sessions API] Session revoked', {
      userId: user.id,
      revokedSessionId: sessionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Session has been revoked',
    });
  } catch (error) {
    logger.error('[Sessions API] Error revoking session', { error });
    return handleApiError(error);
  }
}

/**
 * POST: 全セッションを無効化（現在のセッション以外）
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 現在のセッションIDを取得
    const currentSessionId = request.cookies.get('session_id')?.value;

    const revokedCount = await invalidateAllUserSessions(
      user.id,
      'user_revoked_all',
      currentSessionId
    );

    logger.info('[Sessions API] All sessions revoked', {
      userId: user.id,
      revokedCount,
      exceptSessionId: currentSessionId,
    });

    return NextResponse.json({
      success: true,
      message: `${revokedCount} session(s) have been revoked`,
      revokedCount,
    });
  } catch (error) {
    logger.error('[Sessions API] Error revoking all sessions', { error });
    return handleApiError(error);
  }
}

/**
 * IPアドレスをマスク（プライバシー保護）
 */
function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  // IPv6の場合
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 2) {
    return `${ipv6Parts[0]}:${ipv6Parts[1]}:***`;
  }
  return '***';
}

/**
 * User-Agentからブラウザ名を抽出
 */
function parseBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();

  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera';

  return 'Unknown';
}
