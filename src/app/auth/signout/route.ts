/**
 * サーバーサイド Signout Route Handler
 * 
 * 責務:
 * - POST /auth/signout でセッション無効化
 * - Cookie削除 + セッション終了
 * - ホームページへ303リダイレクト
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Supabaseセッション終了
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('Signout error', error instanceof Error ? error : new Error(String(error)));
      return NextResponse.json(
        { error: 'Signout failed', message: error.message },
        { status: 500 }
      );
    }

    // レスポンスを作成してCookieクリア
    const response = NextResponse.redirect(
      new URL('/', request.url),
      { status: 303 }
    );

    // 認証関連のCookieを明示的にクリア
    const cookiesToClear = [
      'sb-chyicolujwhkycpkxbej-auth-token',
      'sb-chyicolujwhkycpkxbej-auth-token.0',
      'sb-chyicolujwhkycpkxbej-auth-token.1',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
    
  } catch (error) {
    logger.error('Unexpected signout error', error instanceof Error ? error : new Error(String(error)));
    
    // エラーの場合でもCookieクリアを実行してからJSONレスポンス
    const response = NextResponse.json(
      { error: 'Internal server error', message: 'Signout failed' },
      { status: 500 }
    );

    const cookiesToClear = [
      'sb-chyicolujwhkycpkxbej-auth-token',
      'sb-chyicolujwhkycpkxbej-auth-token.0',
      'sb-chyicolujwhkycpkxbej-auth-token.1',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  }
}

// GETアクセス時もサインアウト処理を実行（ユーザビリティ向上）
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Supabaseセッション終了
    const { error } = await supabase.auth.signOut();
    
    // レスポンスを作成（エラーの場合も含む）
    const response = NextResponse.redirect(
      new URL(error ? '/?error=signout_failed' : '/', request.url),
      { status: 303 }
    );

    // 認証関連のCookieを明示的にクリア（エラーの場合でも実行）
    const cookiesToClear = [
      'sb-chyicolujwhkycpkxbej-auth-token',
      'sb-chyicolujwhkycpkxbej-auth-token.0',
      'sb-chyicolujwhkycpkxbej-auth-token.1',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    if (error) {
      logger.error('Signout error', error instanceof Error ? error : new Error(String(error)));
    }

    return response;
    
  } catch (error) {
    logger.error('Unexpected signout error', error instanceof Error ? error : new Error(String(error)));
    
    // エラーの場合でもCookieクリアを実行
    const response = NextResponse.redirect(
      new URL('/?error=signout_error', request.url),
      { status: 303 }
    );

    const cookiesToClear = [
      'sb-chyicolujwhkycpkxbej-auth-token',
      'sb-chyicolujwhkycpkxbej-auth-token.0',
      'sb-chyicolujwhkycpkxbej-auth-token.1',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  }
}

// OPTIONSメソッド（CORSプリフライト対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}