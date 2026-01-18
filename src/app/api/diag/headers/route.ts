/**
 * GET /api/diag/headers - 診断用: リクエストヘッダー検証
 *
 * 目的: auth-token Cookie 消失問題の切り分け
 * - 受信した request headers のうち cookie の有無/長さ
 * - x-forwarded-* ヘッダーの確認
 *
 * 本番で一時的に使う。後で削除予定。
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const timestamp = new Date().toISOString();

  // Cookie ヘッダーの情報（値は出さない）
  const cookieHeader = request.headers.get('cookie');
  const hasCookieHeader = cookieHeader !== null;
  const cookieHeaderLength = cookieHeader?.length || 0;

  // Cookie 名だけ抽出
  const cookieNames: string[] = [];
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    pairs.forEach(pair => {
      const name = pair.trim().split('=')[0];
      if (name) cookieNames.push(name);
    });
  }

  // 重要なヘッダー（診断用）
  const headers: Record<string, string | null> = {
    host: request.headers.get('host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'x-forwarded-host': request.headers.get('x-forwarded-host'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    'x-vercel-id': request.headers.get('x-vercel-id'),
    'x-real-ip': request.headers.get('x-real-ip'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    'user-agent': request.headers.get('user-agent')?.slice(0, 100) || null,
  };

  const result = {
    requestId,
    sha,
    timestamp,
    url: request.url,
    method: request.method,
    cookie: {
      present: hasCookieHeader,
      length: cookieHeaderLength,
      names: cookieNames,
      supabaseNames: cookieNames.filter(n => n.startsWith('sb-') || n.startsWith('supabase')),
    },
    headers,
  };

  console.log('[api/diag/headers] === DIAGNOSTIC ===', result);

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'x-request-id': requestId,
    },
  });
}
