/**
 * 認証コンテキスト診断API（委譲版）
 *
 * Phase 14: Auth直叩きを /api/diag/auth に集約
 * このファイルは URL 互換のため残し、処理を委譲
 */

import { NextRequest, NextResponse } from 'next/server';
import { diagGuard, diagErrorResponse } from '@/lib/api/diag-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  // diagGuard による認証チェック
  const guardResult = await diagGuard(request);
  if (!guardResult.authorized) {
    return guardResult.response!;
  }

  try {
    // 集約先エンドポイントにリダイレクト（mode=full）
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const diagUrl = `${baseUrl}/api/diag/auth?mode=full`;

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
        'X-Delegated-To': '/api/diag/auth?mode=full'
      }
    });
  } catch (error) {
    return diagErrorResponse(error, '/api/diag/auth-context');
  }
}
