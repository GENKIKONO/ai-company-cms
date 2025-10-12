/**
 * 管理者ユーザー管理API
 * GET /api/admin/users
 * 
 * 機能:
 * - 管理者による全ユーザーの閲覧
 * - ユーザー情報・権限・所属組織の取得
 * - 管理者権限チェック
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 管理者権限チェック関数
async function checkAdminPermission(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { error: 'UNAUTHORIZED', message: 'ログインが必要です', status: 401 };
  }

  // 管理者権限チェック
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'admin') {
    return { error: 'FORBIDDEN', message: '管理者権限が必要です', status: 403 };
  }

  return { user, userData };
}

// GET: 全ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアント初期化
    const cookieStore = await cookies();
    const supabase = createServerClient(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // Server Component での cookie 設定エラーをハンドル
            }
          },
        },
      }
    );

    // 管理者権限チェック
    const authResult = await checkAdminPermission(supabase);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, message: authResult.message },
        { status: authResult.status }
      );
    }

    // URLパラメータの取得
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // ユーザー一覧を取得（Supabase Authからユーザー情報、DBから追加情報）
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      page: Math.floor(offset / limit) + 1,
      perPage: limit,
    });

    if (authError) {
      console.error('Auth users fetch error:', authError);
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'ユーザー認証情報の取得に失敗しました。'
        },
        { status: 500 }
      );
    }

    // ユーザーIDリストを作成
    const userIds = authUsers.users.map(u => u.id);

    // データベースからユーザー詳細情報を取得
    let userQuery = supabase
      .from('users')
      .select(`
        id,
        role,
        created_at,
        updated_at,
        organizations (
          id,
          name,
          industry
        )
      `)
      .in('id', userIds);

    // ロールフィルター適用
    if (role && role !== 'all') {
      userQuery = userQuery.eq('role', role);
    }

    const { data: dbUsers, error: dbError } = await userQuery;

    if (dbError) {
      console.error('Database users fetch error:', dbError);
      // データベースエラーでも空配列で継続
      console.warn('Continuing with auth data only due to database error');
    }

    // 認証情報とDB情報をマージ
    const combinedUsers = authUsers.users.map(authUser => {
      const dbUser = dbUsers?.find(db => db.id === authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        role: dbUser?.role || 'user',
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
        last_sign_in_at: authUser.last_sign_in_at,
        email_confirmed_at: authUser.email_confirmed_at,
        organizations: dbUser?.organizations || null,
      };
    });

    // ロールフィルターをクライアント側で適用（DBエラー時のフォールバック）
    const filteredUsers = role && role !== 'all' 
      ? combinedUsers.filter(u => u.role === role)
      : combinedUsers;

    // 統計情報を計算
    const stats = {
      total: filteredUsers.length,
      admin: filteredUsers.filter(u => u.role === 'admin').length,
      user: filteredUsers.filter(u => u.role === 'user').length,
      verified: filteredUsers.filter(u => u.email_confirmed_at).length,
    };

    return NextResponse.json({
      users: filteredUsers,
      stats,
      pagination: {
        limit,
        offset,
        total: filteredUsers.length,
      }
    });

  } catch (error) {
    console.error('Admin users GET API error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました。'
      },
      { status: 500 }
    );
  }
}