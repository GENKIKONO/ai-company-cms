/**
 * CSRF（Cross-Site Request Forgery）対策
 *
 * 二重防御アプローチ:
 * 1. SameSite Cookie（Lax/Strict）
 * 2. Origin/Referer ヘッダー検証
 * 3. カスタムCSRFトークン（状態変更APIのみ）
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

// CSRFトークンのCookie名
const CSRF_TOKEN_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

// 許可するオリジン
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'https://aiohub.jp',
  'https://www.aiohub.jp',
].filter(Boolean);

// 状態変更を行うHTTPメソッド
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * CSRFトークンを生成
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRFトークンをCookieに設定
 */
export async function setCSRFTokenCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

  if (existingToken) {
    return existingToken;
  }

  const token = generateCSRFToken();

  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24時間
  });

  return token;
}

/**
 * CSRFトークンを取得（API用）
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Origin/Referer ヘッダーを検証
 */
function validateOrigin(request: NextRequest): { valid: boolean; reason: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // GETリクエストはスキップ
  if (request.method === 'GET') {
    return { valid: true, reason: 'GET request - skipped' };
  }

  // Originヘッダーがある場合は検証
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => origin === allowed);
    if (!isAllowed) {
      return { valid: false, reason: `Invalid origin: ${origin}` };
    }
    return { valid: true, reason: 'Origin validated' };
  }

  // Refererで代替検証
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      const isAllowed = ALLOWED_ORIGINS.some(allowed => refererOrigin === allowed);
      if (!isAllowed) {
        return { valid: false, reason: `Invalid referer: ${referer}` };
      }
      return { valid: true, reason: 'Referer validated' };
    } catch {
      return { valid: false, reason: 'Invalid referer URL' };
    }
  }

  // Same-origin リクエスト（Ajax）は Origin がない場合がある
  // Sec-Fetch-Site ヘッダーで確認
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin') {
    return { valid: true, reason: 'Same-origin (Sec-Fetch-Site)' };
  }

  // どちらもない場合は拒否（サーバー間通信は別途認証で保護）
  return { valid: false, reason: 'No origin or referer header' };
}

/**
 * CSRFトークンを検証
 */
async function validateCSRFToken(request: NextRequest): Promise<{ valid: boolean; reason: string }> {
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;

  if (!headerToken) {
    return { valid: false, reason: 'Missing CSRF token header' };
  }

  if (!cookieToken) {
    return { valid: false, reason: 'Missing CSRF token cookie' };
  }

  // タイミングセーフ比較
  if (headerToken.length !== cookieToken.length) {
    return { valid: false, reason: 'CSRF token length mismatch' };
  }

  let mismatch = 0;
  for (let i = 0; i < headerToken.length; i++) {
    mismatch |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return { valid: false, reason: 'CSRF token mismatch' };
  }

  return { valid: true, reason: 'CSRF token validated' };
}

/**
 * CSRF検証ミドルウェア
 *
 * 使用方法:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfResult = await validateCSRF(request);
 *   if (!csrfResult.valid) {
 *     return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
 *   }
 *   // ... 処理続行
 * }
 * ```
 */
export async function validateCSRF(
  request: NextRequest,
  options: { requireToken?: boolean } = {}
): Promise<{ valid: boolean; reason: string }> {
  const method = request.method;

  // GETリクエストはスキップ
  if (!STATE_CHANGING_METHODS.includes(method)) {
    return { valid: true, reason: 'Non-state-changing method' };
  }

  // Origin/Referer検証（常に実行）
  const originResult = validateOrigin(request);
  if (!originResult.valid) {
    logger.warn('[CSRF] Origin validation failed', {
      method,
      path: request.nextUrl.pathname,
      reason: originResult.reason,
    });
    return originResult;
  }

  // CSRFトークン検証（オプション、または重要なエンドポイント）
  if (options.requireToken) {
    const tokenResult = await validateCSRFToken(request);
    if (!tokenResult.valid) {
      logger.warn('[CSRF] Token validation failed', {
        method,
        path: request.nextUrl.pathname,
        reason: tokenResult.reason,
      });
      return tokenResult;
    }
  }

  return { valid: true, reason: 'CSRF validation passed' };
}

/**
 * CSRF検証エラーレスポンス
 */
export function csrfErrorResponse(reason: string): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Request rejected for security reasons',
        timestamp: new Date().toISOString(),
      },
    },
    { status: 403 }
  );
}

/**
 * CSRFトークンを取得するAPIエンドポイント用
 */
export async function handleGetCSRFToken(): Promise<NextResponse> {
  const token = await setCSRFTokenCookie();
  return NextResponse.json({ token });
}
