/**
 * API Routes 専用 認証ヘルパー
 *
 * ============================================================
 * 【目的】
 * ============================================================
 * API Routes での認証・Cookie 同期を統一するための「単一の公式実装」
 *
 * ============================================================
 * 【設計原則】
 * ============================================================
 * 1. getUser() が唯一の Source of Truth（getSession/getClaims 禁止）
 * 2. setAll は必ず NextResponse に Set-Cookie を反映する（握り潰し禁止）
 * 3. Middleware に依存しない（API Routes は Middleware をスキップするため）
 * 4. 認証失敗時は明確なエラーを返す（NO_USER_SESSION）
 *
 * ============================================================
 * 【使用場所】
 * ============================================================
 * - /api/dashboard/*
 * - /api/my/*
 * - /api/admin/*
 * - その他認証が必要な API Routes
 *
 * ============================================================
 * 【使用禁止（API Routes 内で絶対にやってはいけないこと）】
 * ============================================================
 * ❌ createClient（src/lib/supabase/server.ts）
 *    → Cookie 握り潰しでトークンリフレッシュ失敗
 *
 * ❌ supabase.auth.getSession()
 *    → サーバーサイドでは不正確な可能性
 *
 * ❌ supabase.auth.getClaims()
 *    → サーバーサイドでは不正確な可能性
 *
 * ❌ applyCookies() の呼び忘れ
 *    → トークンリフレッシュ Cookie がレスポンスに反映されない
 *
 * ============================================================
 * 【正しい使い方】
 * ============================================================
 * - 認証必須 API → createApiAuthClient
 * - 認証任意 API → createApiAuthClientOptional
 * - 全てのレスポンスを applyCookies() でラップすること
 *
 * @see docs/ai-implementation-guard.md
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { User, SupabaseClient } from '@supabase/supabase-js';

// =====================================================
// Types
// =====================================================

export interface ApiAuthResult {
  /** Supabase クライアント（認証済み） */
  supabase: SupabaseClient;
  /** 認証済みユーザー */
  user: User;
  /** Cookie を適用するヘルパー関数 */
  applyCookies: <T>(response: NextResponse<T>) => NextResponse<T>;
  /** リクエストID（診断用） */
  requestId: string;
}

export interface ApiAuthError {
  code: 'NO_AUTH_COOKIE' | 'NO_USER_SESSION' | 'AUTH_ERROR';
  message: string;
  details?: string;
  requestId: string;
}

/**
 * 認証失敗時の統一レスポンス型
 * Route Handler の戻り値型を `SuccessType | ApiAuthFailure` にすることで、
 * ApiAuthException.toResponse() の戻り値と互換性を持たせる
 */
export interface ApiAuthFailure {
  error: ApiAuthError;
}

export class ApiAuthException extends Error {
  code: ApiAuthError['code'];
  details?: string;
  requestId: string;

  constructor(error: ApiAuthError) {
    super(error.message);
    this.name = 'ApiAuthException';
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;
  }

  toResponse(): NextResponse<{ error: ApiAuthError }> {
    return NextResponse.json(
      {
        error: {
          code: this.code,
          message: this.message,
          details: this.details,
          requestId: this.requestId,
        },
      },
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'x-request-id': this.requestId,
        },
      }
    );
  }
}

// =====================================================
// Helper Functions
// =====================================================

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : 'unknown';
}

function hasAuthTokenCookie(cookieNames: string[], projectRef: string): boolean {
  const pattern = new RegExp(`^sb-${projectRef}-auth-token(\\.\\d+)?$`);
  return cookieNames.some(name => pattern.test(name));
}

// =====================================================
// Main Entry Point
// =====================================================

/**
 * API Routes 用の認証済み Supabase クライアントを取得
 *
 * 【重要】
 * - 認証必須の API でのみ使用
 * - 認証失敗時は ApiAuthException を throw
 * - 返された applyCookies を必ずレスポンスに適用すること
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     const { supabase, user, applyCookies, requestId } = await createApiAuthClient(request);
 *
 *     const { data, error } = await supabase.from('posts').select('*');
 *
 *     const response = NextResponse.json({ data });
 *     return applyCookies(response);
 *   } catch (e) {
 *     if (e instanceof ApiAuthException) {
 *       return e.toResponse();
 *     }
 *     throw e;
 *   }
 * }
 * ```
 */
export async function createApiAuthClient(
  request: NextRequest
): Promise<ApiAuthResult> {
  const requestId = crypto.randomUUID();
  const projectRef = getProjectRef();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  // =====================================================
  // Step 1: Cookie 取得
  // =====================================================
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const hasAuthToken = hasAuthTokenCookie(cookieNames, projectRef);

  // Cookie 診断ログ
  console.log('[api-auth] Cookie check', {
    sha,
    requestId,
    path: request.nextUrl.pathname,
    hasAuthToken,
    cookieCount: allCookies.length,
  });

  // auth-token Cookie がない場合は即座にエラー
  if (!hasAuthToken) {
    throw new ApiAuthException({
      code: 'NO_AUTH_COOKIE',
      message: 'No auth cookie found. Please login.',
      requestId,
    });
  }

  // =====================================================
  // Step 2: Supabase クライアント作成
  // - mutableCookies で setAll → getAll の整合性を保つ
  // - cookiesToSetOnResponse で Set-Cookie を追跡
  // =====================================================
  const mutableCookies = [...allCookies];
  const cookiesToSetOnResponse: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return mutableCookies;
        },
        setAll(cookiesToSet) {
          // 【重要】握り潰し禁止 - 必ず追跡する
          cookiesToSet.forEach(({ name, value, options }) => {
            // レスポンス用に追跡
            cookiesToSetOnResponse.push({
              name,
              value,
              options: { ...options, path: '/' },
            });

            // mutableCookies も更新して getAll() との整合性を保つ
            const existingIndex = mutableCookies.findIndex(c => c.name === name);
            if (existingIndex !== -1) {
              mutableCookies[existingIndex] = { name, value };
            } else {
              mutableCookies.push({ name, value });
            }

            // 診断ログ
            console.log('[api-auth] setAll', {
              sha,
              requestId,
              cookieName: name,
              valueLength: value?.length || 0,
            });
          });
        },
      },
    }
  );

  // =====================================================
  // Step 3: getUser() で認証（唯一の Source of Truth）
  // - getSession() は使用禁止
  // - getClaims() は使用禁止
  // =====================================================
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // 認証結果ログ
  console.log('[api-auth] getUser result', {
    sha,
    requestId,
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userId: user?.id || null,
    errorCode: getUserError?.code || null,
    errorMessage: getUserError?.message || null,
    setCookieCount: cookiesToSetOnResponse.length,
  });

  // 認証失敗
  if (getUserError || !user) {
    throw new ApiAuthException({
      code: 'NO_USER_SESSION',
      message: 'Session exists but could not get user. Please login again.',
      details: getUserError?.message || 'No user returned from getUser()',
      requestId,
    });
  }

  // =====================================================
  // Step 4: applyCookies ヘルパーを返す
  // - 呼び出し側が必ずレスポンスに適用すること
  // =====================================================
  const applyCookies = <T>(response: NextResponse<T>): NextResponse<T> => {
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(
        name,
        value,
        options as Parameters<typeof response.cookies.set>[2]
      );
    });

    // リクエストID をヘッダーに追加
    response.headers.set('x-request-id', requestId);

    return response;
  };

  return {
    supabase,
    user,
    applyCookies,
    requestId,
  };
}

// =====================================================
// Optional: 認証任意バージョン（user が null でも OK）
// =====================================================

export interface ApiAuthOptionalResult {
  /** Supabase クライアント */
  supabase: SupabaseClient;
  /** ユーザー（未認証の場合は null） */
  user: User | null;
  /** Cookie を適用するヘルパー関数 */
  applyCookies: <T>(response: NextResponse<T>) => NextResponse<T>;
  /** リクエストID（診断用） */
  requestId: string;
}

/**
 * API Routes 用の Supabase クライアントを取得（認証任意）
 *
 * 認証失敗時も例外を投げず、user: null を返す。
 * 認証が必須でない API（ログイン状態で挙動が変わる公開 API 等）で使用。
 */
export async function createApiAuthClientOptional(
  request: NextRequest
): Promise<ApiAuthOptionalResult> {
  const requestId = crypto.randomUUID();
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ||
              process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
              'unknown';

  // Cookie 取得
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Supabase クライアント作成
  const mutableCookies = [...allCookies];
  const cookiesToSetOnResponse: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return mutableCookies;
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToSetOnResponse.push({
              name,
              value,
              options: { ...options, path: '/' },
            });

            const existingIndex = mutableCookies.findIndex(c => c.name === name);
            if (existingIndex !== -1) {
              mutableCookies[existingIndex] = { name, value };
            } else {
              mutableCookies.push({ name, value });
            }
          });
        },
      },
    }
  );

  // getUser（エラーでも継続）
  const { data: { user } } = await supabase.auth.getUser();

  console.log('[api-auth-optional] getUser result', {
    sha,
    requestId,
    path: request.nextUrl.pathname,
    hasUser: !!user,
  });

  const applyCookies = <T>(response: NextResponse<T>): NextResponse<T> => {
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set(
        name,
        value,
        options as Parameters<typeof response.cookies.set>[2]
      );
    });
    response.headers.set('x-request-id', requestId);
    return response;
  };

  return {
    supabase,
    user,
    applyCookies,
    requestId,
  };
}
