/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await supabaseServer();
    const { id } = await params;
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック - check app_metadata instead of app_users
    const isAdmin = user.app_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 管理者用途のため app_users をそのまま使用（profiles には email/role がないため）
    // Admin purpose: keep using app_users since profiles doesn't have email/role
    const { data: targetUser, error: fetchError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 関連する組織情報を取得
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', id);

    if (orgError) {
      logger.error('Error fetching organizations:', orgError);
    }

    return NextResponse.json({
      user: targetUser,
      organizations: organizations || []
    });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}