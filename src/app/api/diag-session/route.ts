/**
 * セッション診断API（委譲版）
 *
 * Phase 14: Auth直叩きを /api/diag/auth に集約
 * このファイルは URL 互換のため残し、処理を委譲
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  // 集約先エンドポイントにリダイレクト（mode=session）
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const diagUrl = `${baseUrl}/api/diag/auth?mode=session`;

  try {
    const response = await fetch(diagUrl, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'User-Agent': request.headers.get('user-agent') || '',
        'Accept': request.headers.get('accept') || 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Delegated-To': '/api/diag/auth?mode=session'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Delegation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      delegatedTo: '/api/diag/auth?mode=session'
    }, { status: 500 });
  }
}
