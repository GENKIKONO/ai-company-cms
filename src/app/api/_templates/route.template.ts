/**
 * ==============================================================
 * API Route テンプレート
 * ==============================================================
 *
 * このファイルは新しい API Route を作成する際のテンプレートです。
 * コピーして使用してください。
 *
 * 【使用方法】
 * 1. このファイルをコピー
 * 2. 適切な場所に route.ts として配置
 * 3. TEMPLATE_ プレフィックスの関数名を適切な名前に変更
 * 4. ビジネスロジックを実装
 *
 * 【重要ルール】
 * - 認証には createApiAuthClient / createApiAuthClientOptional のみ使用
 * - すべてのレスポンスを applyCookies() でラップすること
 * - getSession() / getClaims() は使用禁止
 * - server.ts の createClient は使用禁止
 *
 * @see src/lib/supabase/api-auth.ts
 * @see docs/api-auth-migration-status.md
 */

// ==============================================================
// このファイルはテンプレートなのでビルド対象外
// 実際に使用する際は下の export を有効化してください
// ==============================================================

export {};

/*
// ==============================================================
// 認証必須 API テンプレート
// ==============================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';

// GET - データ取得
export async function GET(request: NextRequest) {
  try {
    // 認証（必須）
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // ビジネスロジック
    const { data, error } = await supabase
      .from('your_table')
      .select('id, name, created_at')
      .eq('user_id', user.id);

    if (error) {
      logger.error('[your_route] Database error', { error: error.message, requestId });
      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    // 成功レスポンス（applyCookies でラップ必須）
    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    // ApiAuthException は toResponse() でレスポンス生成
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    // その他のエラー
    logger.error('[GET /api/your_route] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - データ作成
export async function POST(request: NextRequest) {
  try {
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // リクエストボディの取得
    const body = await request.json();

    // バリデーション
    if (!body.name) {
      return applyCookies(NextResponse.json(
        { error: 'Validation error', message: 'name is required' },
        { status: 400 }
      ));
    }

    // データ作成
    const { data, error } = await supabase
      .from('your_table')
      .insert([{ name: body.name, user_id: user.id }])
      .select()
      .single();

    if (error) {
      logger.error('[your_route] Insert error', { error: error.message, requestId });

      // RLS エラーの場合は 403 を返す
      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error', message: error.message },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 201 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[POST /api/your_route] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

/*
// ==============================================================
// 認証任意 API テンプレート
// ==============================================================
//
// ログイン状態によって挙動が変わる公開 API で使用
// 例: ログインユーザーには追加情報を表示

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClientOptional } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    // 認証（任意 - user が null でも OK）
    const { supabase, user, applyCookies, requestId } = await createApiAuthClientOptional(request);

    // 公開データ取得
    const { data, error } = await supabase
      .from('public_table')
      .select('id, title, content')
      .eq('is_public', true);

    if (error) {
      logger.error('[public_route] Database error', { error: error.message, requestId });
      return applyCookies(NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      ));
    }

    // ログインユーザーには追加情報を付与
    const responseData = {
      data,
      isAuthenticated: !!user,
      userId: user?.id || null,
    };

    return applyCookies(NextResponse.json(responseData, { status: 200 }));

  } catch (error) {
    logger.error('[GET /api/public_route] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/

/*
// ==============================================================
// 動的ルート ([id]) テンプレート
// ==============================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createApiAuthClient, ApiAuthException } from '@/lib/supabase/api-auth';
import { logger } from '@/lib/log';

// GET - 個別データ取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    // UUID 形式チェック（必要に応じて）
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return applyCookies(NextResponse.json(
        { error: 'Invalid ID format' },
        { status: 400 }
      ));
    }

    const { data, error } = await supabase
      .from('your_table')
      .select('id, name, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('[your_route/[id]] Database error', { error: error.message, requestId });
      return applyCookies(NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      ));
    }

    if (!data) {
      return applyCookies(NextResponse.json(
        { error: 'NOT_FOUND', message: 'データが見つかりません' },
        { status: 404 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[GET /api/your_route/[id]] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - データ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);
    const body = await request.json();

    const { data, error } = await supabase
      .from('your_table')
      .update({ name: body.name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      logger.error('[your_route/[id]] Update error', { error: error.message, requestId });

      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ data }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[PUT /api/your_route/[id]] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - データ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);

    const { error } = await supabase
      .from('your_table')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      logger.error('[your_route/[id]] Delete error', { error: error.message, requestId });

      if (error.code === '42501' || error.message?.includes('RLS')) {
        return applyCookies(NextResponse.json({
          error: 'RLS_FORBIDDEN',
          message: 'Row Level Security によって拒否されました'
        }, { status: 403 }));
      }

      return applyCookies(NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      ));
    }

    return applyCookies(NextResponse.json({ success: true }, { status: 200 }));

  } catch (error) {
    if (error instanceof ApiAuthException) {
      return error.toResponse();
    }

    logger.error('[DELETE /api/your_route/[id]] Unexpected error', { data: error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
*/
