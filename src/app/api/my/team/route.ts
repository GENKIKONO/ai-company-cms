/**
 * /api/my/team - チームメンバー管理API
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
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // ユーザーが所属する組織を取得
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return applyCookies(NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      ));
    }

    const organizationId = membership.organization_id;
    const currentUserRole = membership.role;

    // チームメンバー一覧を取得
    const { data: membersData, error: membersError } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles (
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId);

    if (membersError) {
      logger.error('[my/team] Failed to fetch team members', { data: membersError });
      return applyCookies(NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      ));
    }

    // データ変換
    const members = (membersData || []).map((member: Record<string, unknown>) => ({
      id: member.id,
      user_id: member.user_id,
      email: (member.profiles as Record<string, unknown> | null)?.email || '',
      full_name: (member.profiles as Record<string, unknown> | null)?.full_name || undefined,
      role: member.role,
      avatar_url: (member.profiles as Record<string, unknown> | null)?.avatar_url || undefined,
      created_at: member.created_at,
      status: 'active',
    }));

    return applyCookies(NextResponse.json({
      data: {
        members,
        currentUserId: user.id,
        currentUserRole,
        organizationId,
      }
    }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/my/team] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
