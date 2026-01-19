/**
 * GET /api/diag/headers - 診断用: リクエストヘッダー検証
 *
 * ⚠️ ADMIN ONLY - 管理者認証が必要
 *
 * 目的: auth-token Cookie 消失問題の切り分け
 * - 受信した request headers のうち cookie の有無/長さ
 * - x-forwarded-* ヘッダーの確認
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthorized } from '@/lib/auth/require-admin';

export async function GET(request: NextRequest) {
  // 本番環境では管理者認証必須
  if (process.env.NODE_ENV === 'production') {
    const authResult = await requireAdmin();
    if (!isAuthorized(authResult)) {
      return authResult.response;
    }
  }

  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const timestamp = new Date().toISOString();

  // Cookie ヘッダーの情報（値は出さない）
  const cookieHeader = request.headers.get('cookie');
  const hasCookieHeader = cookieHeader !== null;
  const cookieHeaderLength = cookieHeader?.length || 0;

  // Cookie 名だけ抽出（supabase関連のみ）
  const supabaseCookieNames: string[] = [];
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    pairs.forEach(pair => {
      const name = pair.trim().split('=')[0];
      if (name && (name.startsWith('sb-') || name.startsWith('supabase'))) {
        supabaseCookieNames.push(name);
      }
    });
  }

  // 診断に必要な最小限のヘッダー情報のみ
  const headers: Record<string, string | null> = {
    host: request.headers.get('host'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    // x-forwarded-for はIPを含むので本番では制限
    'x-forwarded-for-present': request.headers.get('x-forwarded-for') ? 'yes' : 'no',
    'x-vercel-id': request.headers.get('x-vercel-id'),
  };

  const result = {
    requestId,
    sha: sha.slice(0, 7),
    timestamp,
    method: request.method,
    cookie: {
      present: hasCookieHeader,
      length: cookieHeaderLength,
      supabaseCount: supabaseCookieNames.length,
    },
    headers,
  };

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
      'x-request-id': requestId,
    },
  });
}
