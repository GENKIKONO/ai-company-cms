/**
 * /api/my/team/[memberId] - 個別チームメンバー管理API
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

// PATCH: ロール変更
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 現在のユーザーがadminかチェック
    const { data: currentMembership, error: currentError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (currentError || !currentMembership) {
      return applyCookies(NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      ));
    }

    if (currentMembership.role !== 'admin') {
      return applyCookies(NextResponse.json(
        { error: 'Permission denied. Admin role required.' },
        { status: 403 }
      ));
    }

    // 変更対象メンバーが同じ組織に属しているかチェック
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id')
      .eq('id', memberId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return applyCookies(NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      ));
    }

    if (targetMember.organization_id !== currentMembership.organization_id) {
      return applyCookies(NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      ));
    }

    // 自分自身のロールは変更不可
    if (targetMember.user_id === user.id) {
      return applyCookies(NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      ));
    }

    // リクエストボディからロールを取得
    const body = await request.json();
    const { role } = body;

    if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
      return applyCookies(NextResponse.json(
        { error: 'Invalid role. Must be admin, editor, or viewer.' },
        { status: 400 }
      ));
    }

    // ロール更新
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId);

    if (updateError) {
      logger.error('[my/team/[memberId]] Failed to update member role', { data: updateError });

      // RLS エラーの場合は 403 を返す
      if (updateError.code === '42501' || updateError.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ success: true }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[PATCH /api/my/team/[memberId]] Unexpected error', { data: error });
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
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // 現在のユーザーがadminかチェック
    const { data: currentMembership, error: currentError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (currentError || !currentMembership) {
      return applyCookies(NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      ));
    }

    if (currentMembership.role !== 'admin') {
      return applyCookies(NextResponse.json(
        { error: 'Permission denied. Admin role required.' },
        { status: 403 }
      ));
    }

    // 削除対象メンバーが同じ組織に属しているかチェック
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id')
      .eq('id', memberId)
      .maybeSingle();

    if (targetError || !targetMember) {
      return applyCookies(NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      ));
    }

    if (targetMember.organization_id !== currentMembership.organization_id) {
      return applyCookies(NextResponse.json(
        { error: 'Member not in your organization' },
        { status: 403 }
      ));
    }

    // 自分自身は削除不可
    if (targetMember.user_id === user.id) {
      return applyCookies(NextResponse.json(
        { error: 'Cannot remove yourself' },
        { status: 400 }
      ));
    }

    // メンバー削除
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      logger.error('[my/team/[memberId]] Failed to delete member', { data: deleteError });

      // RLS エラーの場合は 403 を返す
      if (deleteError.code === '42501' || deleteError.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Failed to delete member' },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ success: true }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/my/team/[memberId]] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
