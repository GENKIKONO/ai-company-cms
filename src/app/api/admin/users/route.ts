import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者チェック
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ユーザー一覧を取得
    const { data: users, error } = await supabase
      .from('app_users')
      .select(`
        id,
        email,
        full_name,
        role,
        created_at,
        updated_at,
        organization_id,
        organizations (
          id,
          name,
          status,
          is_published
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching users', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ data: users });

  } catch (error) {
    logger.error('Unexpected error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}