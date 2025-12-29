/**
 * Whoami診断API（委譲版）
 *
 * Phase 14: Auth直叩きを /api/diag/auth に集約
 * このファイルは URL 互換のため残し、処理を委譲
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 集約先エンドポイントにリダイレクト（mode=whoami）
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const diagUrl = `${baseUrl}/api/diag/auth?mode=whoami`;

  try {
    const response = await fetch(diagUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
    });

    const data = await response.json();

    // 元のレスポンス形式に近づける（mode フィールドは除去）
    const { mode, ...rest } = data;

    return NextResponse.json(rest, {
      status: response.status,
      headers: {
        'X-Delegated-To': '/api/diag/auth?mode=whoami'
      }
    });
  } catch (error) {
    return NextResponse.json({
      cookieKeys: [],
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}
