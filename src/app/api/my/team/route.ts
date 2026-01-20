/**
 * Team Management API
 * GET: チームメンバー一覧取得
 *
 * セキュリティ: ブラウザからの直接DB接続を禁止し、サーバー側で認証・認可を実施
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const userId = authResult.user.id;
    const supabase = await createClient();

    // ユーザーが所属する組織を取得
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
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
      logger.error('Failed to fetch team members', { data: membersError });
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    // データ変換
    const members = (membersData || []).map((member: any) => ({
      id: member.id,
      user_id: member.user_id,
      email: member.profiles?.email || '',
      full_name: member.profiles?.full_name || undefined,
      role: member.role,
      avatar_url: member.profiles?.avatar_url || undefined,
      created_at: member.created_at,
      status: 'active',
    }));

    return NextResponse.json({
      data: {
        members,
        currentUserId: userId,
        currentUserRole,
        organizationId,
      }
    });

  } catch (error) {
    logger.error('Team API error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
