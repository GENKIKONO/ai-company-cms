/**
 * 管理者運用ログアウト API
 * 
 * 責務:
 * - ops_admin クッキーの無効化
 * - ホームページへリダイレクト
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCookieDomain } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GETアクセス時は405を返す
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      code: 'METHOD_NOT_ALLOWED', 
      reason: 'Use POST method for ops logout' 
    },
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS'
      }
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const domain = getCookieDomain(request);

    // ホームページへ303リダイレクト
    const response = NextResponse.redirect(
      new URL('/', request.url),
      { status: 303 }
    );

    // ops_admin クッキーを無効化（同一 Domain/Path/属性で）
    response.cookies.set('ops_admin', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: domain,
      maxAge: 0 // 即時無効化
    });

    console.log('[OPS_LOGOUT] Cookie invalidated for domain:', domain);
    return response;

  } catch (error) {
    console.error('[POST /ops/logout] Unexpected error:', error);
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        reason: 'Logout failed'
      },
      { status: 500 }
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