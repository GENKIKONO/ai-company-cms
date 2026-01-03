/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserFullWithClient } from '@/lib/core/auth-state';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // 認証チェック
    const user = await getUserFullWithClient(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック - check app_metadata instead of app_users
    const isAdmin = user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // v_app_users_compat2 互換ビュー使用
    const { data: targetUser, error: fetchError } = await supabase
      .from('v_app_users_compat2')
      .select('id, email, display_name, avatar_url, phone, role, plan, email_verified, phone_verified, created_at, updated_at, last_sign_in_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 関連する組織情報を取得
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, status, plan, is_published, created_at, updated_at')
      .eq('created_by', id);

    if (orgError) {
      logger.error('Error fetching organizations:', { data: orgError });
    }

    return NextResponse.json({
      user: targetUser,
      organizations: organizations || []
    });

  } catch (error) {
    logger.error('Unexpected error', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}