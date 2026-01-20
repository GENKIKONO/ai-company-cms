/**
 * Team Member API
 * PATCH: メンバーロール変更
 * DELETE: メンバー削除
 *
 * セキュリティ: ブラウザからの直接DB接続を禁止し、サーバー側で認証・認可を実施
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

// PATCH: ロール変更
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const userId = authResult.user.id;
    const supabase = await createClient();

    // 現在のユーザーがadminかチェック
    const { data: currentMembership, error: currentError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (currentError || !currentMembership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied. Admin role required.' },
        { status: 403 }
      );
    }

    // 変更対象メンバーが同じ組織に属しているかチェック
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id')
      .eq('id', memberId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMember.organization_id !== currentMembership.organization_id) {
      return NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      );
    }

    // 自分自身のロールは変更不可
    if (targetMember.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // リクエストボディからロールを取得
    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or viewer.' },
        { status: 400 }
      );
    }

    // ロール更新
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) {
      logger.error('Failed to update member role', { data: updateError });
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Team member PATCH error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: メンバー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    // 認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const userId = authResult.user.id;
    const supabase = await createClient();

    // 現在のユーザーがadminかチェック
    const { data: currentMembership, error: currentError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (currentError || !currentMembership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    if (currentMembership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied. Admin role required.' },
        { status: 403 }
      );
    }

    // 削除対象メンバーが同じ組織に属しているかチェック
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id')
      .eq('id', memberId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMember.organization_id !== currentMembership.organization_id) {
      return NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      );
    }

    // 自分自身は削除不可
    if (targetMember.user_id === userId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      );
    }

    // メンバー削除
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      logger.error('Failed to delete member', { data: deleteError });
      return NextResponse.json(
        { error: 'Failed to delete member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Team member DELETE error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
