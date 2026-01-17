/**
 * GET /api/health/login-cookie-contract
 *
 * ブラウザが正しく auth-token Cookie を保存しているか検証する診断エンドポイント
 *
 * 目的:
 * 「サーバーが Set-Cookie を出しているのにブラウザが保存していない」問題を即判定
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// Supabase プロジェクト参照を環境変数から取得
function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

export interface LoginCookieContractResponse {
  // auth-token Cookie の状態
  hasAuthTokenCookie: boolean;
  hasAuthTokenChunkCookies: boolean;
  authTokenCookieNames: string[];

  // refresh-token Cookie の状態
  hasRefreshTokenCookie: boolean;
  refreshTokenCookieNames: string[];

  // 全 Cookie 名（診断用）
  cookieNames: string[];
  cookieCount: number;

  // Supabase 関連 Cookie のみ
  supabaseCookieNames: string[];

  // 契約状態（Supabase Auth v2: refresh-token があれば VALID）
  contractStatus: 'VALID' | 'INVALID_NO_REFRESH_TOKEN' | 'INVALID_NO_COOKIES';
  contractMessage: string;

  // メタ情報
  projectRef: string;
  sha: string;
  requestId: string;
  timestamp: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<LoginCookieContractResponse>> {
  const requestId = crypto.randomUUID();
  const projectRef = getProjectRef();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';
  const timestamp = new Date().toISOString();

  const responseHeaders = {
    'Cache-Control': 'no-store, must-revalidate',
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  };

  // Cookie を取得
  const allCookies = request.cookies.getAll();
  const cookieNames = allCookies.map(c => c.name);

  // Supabase 関連 Cookie をフィルタ
  const supabaseCookieNames = cookieNames.filter(name =>
    name.startsWith('sb-') || name.startsWith('supabase')
  );

  // auth-token Cookie の検出
  // パターン: sb-<ref>-auth-token または sb-<ref>-auth-token.0, .1, ...
  const authTokenPattern = new RegExp(`^sb-.*-auth-token(\\.\\d+)?$`);
  const authTokenCookieNames = cookieNames.filter(name => authTokenPattern.test(name));
  const hasAuthTokenCookie = authTokenCookieNames.some(name => !name.includes('.'));
  const hasAuthTokenChunkCookies = authTokenCookieNames.some(name => name.includes('.'));

  // refresh-token Cookie の検出
  const refreshTokenPattern = new RegExp(`^sb-.*-refresh-token$`);
  const refreshTokenCookieNames = cookieNames.filter(name => refreshTokenPattern.test(name));
  const hasRefreshTokenCookie = refreshTokenCookieNames.length > 0;

  // 契約状態の判定（Supabase Auth v2 仕様準拠）
  // v2 では refresh-token Cookie があれば認証可能（auth-token は常在しない）
  const hasAnyAuthToken = authTokenCookieNames.length > 0;
  let contractStatus: 'VALID' | 'INVALID_NO_REFRESH_TOKEN' | 'INVALID_NO_COOKIES';
  let contractMessage: string;

  if (supabaseCookieNames.length === 0) {
    // Supabase Cookie が全くない
    contractStatus = 'INVALID_NO_COOKIES';
    contractMessage = 'No Supabase cookies found. User is not logged in.';
  } else if (!hasRefreshTokenCookie) {
    // refresh-token がない → 未認証
    contractStatus = 'INVALID_NO_REFRESH_TOKEN';
    contractMessage = hasAnyAuthToken
      ? `auth-token exists (${authTokenCookieNames.join(', ')}) but refresh-token is missing. Please login again.`
      : 'No refresh-token found. Please login.';
  } else {
    // refresh-token がある = VALID（auth-token の有無は問わない）
    contractStatus = 'VALID';
    contractMessage = hasAnyAuthToken
      ? `Cookie contract valid. auth-token: ${authTokenCookieNames.join(', ')}, refresh-token: ${refreshTokenCookieNames.join(', ')}`
      : `Cookie contract valid (v2 mode). refresh-token: ${refreshTokenCookieNames.join(', ')} (auth-token is fetched on demand)`;
  }

  console.log('[login-cookie-contract] Cookie analysis', {
    requestId,
    cookieCount: cookieNames.length,
    supabaseCookieNames,
    authTokenCookieNames,
    refreshTokenCookieNames,
    contractStatus,
  });

  return NextResponse.json({
    hasAuthTokenCookie,
    hasAuthTokenChunkCookies,
    authTokenCookieNames,
    hasRefreshTokenCookie,
    refreshTokenCookieNames,
    cookieNames,
    cookieCount: cookieNames.length,
    supabaseCookieNames,
    contractStatus,
    contractMessage,
    projectRef,
    sha,
    requestId,
    timestamp,
  }, { status: 200, headers: responseHeaders });
}
