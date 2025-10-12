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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Supabaseセッション終了
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Signout error:', error);
      return NextResponse.json(
        { error: 'Signout failed', message: error.message },
        { status: 500 }
      );
    }

    // 303リダイレクト（POST → GET への標準的なリダイレクト）
    // ホームページへリダイレクト
    return NextResponse.redirect(
      new URL('/', request.url),
      { status: 303 }
    );
    
  } catch (error) {
    console.error('Unexpected signout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Signout failed' },
      { status: 500 }
    );
  }
}

// GETアクセス時もサインアウト処理を実行（ユーザビリティ向上）
export async function GET(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Supabaseセッション終了
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Signout error:', error);
      return NextResponse.redirect(
        new URL('/?error=signout_failed', request.url),
        { status: 303 }
      );
    }

    // ホームページへリダイレクト
    return NextResponse.redirect(
      new URL('/', request.url),
      { status: 303 }
    );
    
  } catch (error) {
    console.error('Unexpected signout error:', error);
    return NextResponse.redirect(
      new URL('/?error=signout_error', request.url),
      { status: 303 }
    );
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