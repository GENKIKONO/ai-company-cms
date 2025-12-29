/**
 * 認証セルフテストAPI（委譲版）
 *
 * Phase 14: Auth直叩きを /api/diag/auth に集約
 * このファイルは URL 互換のため残し、処理を委譲
 */

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 集約先エンドポイントにリダイレクト（mode=simple）
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const diagUrl = `${baseUrl}/api/diag/auth?mode=simple`;

  try {
    const response = await fetch(diagUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
    });

    const data = await response.json();

    // 元のレスポンス形式を維持（mode フィールドは除去）
    const { mode, ...rest } = data;

    return NextResponse.json(rest, {
      status: response.status,
      headers: {
        'X-Delegated-To': '/api/diag/auth?mode=simple'
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'unknown'
    }, { status: 200 });
  }
}

// その他のHTTPメソッドは許可しない
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
