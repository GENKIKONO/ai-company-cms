/**
 * determineAuthState - 認証状態を一元的に判定する関数
 *
 * 【重要】この関数が唯一の認証状態判定ロジック
 * - Cookie の有無
 * - supabase.auth.getUser() の結果
 * - organization_membership の有無
 * → ここで AuthState を1つ返す
 *
 * dashboard / posts / services / faqs すべてこの戻り値だけを見る。
 * 個別に supabase を叩くことは禁止。
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { AuthState, AuthStateResult } from './auth-state';

// Supabase auth cookie パターン
const SB_AUTH_COOKIE_PATTERNS = [
  /^sb-.*-auth-token$/,
  /^sb-.*-auth-token\.\d+$/,
  /^sb-.*-refresh-token$/,
  /^sb-.*-refresh-token\.\d+$/,
  /^supabase-auth-token$/,
];

/**
 * Cookie から Supabase auth cookie の有無を判定
 */
function hasSbAuthCookie(cookieNames: string[]): boolean {
  return cookieNames.some(name =>
    SB_AUTH_COOKIE_PATTERNS.some(pattern => pattern.test(name))
  );
}

/**
 * 認証状態を一元的に判定（サーバーサイド専用）
 *
 * @returns AuthStateResult - 4状態のいずれかと診断情報
 */
export async function determineAuthState(): Promise<AuthStateResult> {
  const requestId = crypto.randomUUID();

  // Step 1: Cookie の有無をチェック
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const cookieNames = allCookies.map(c => c.name);
  const hasCookie = hasSbAuthCookie(cookieNames);

  // Cookie なし → UNAUTHENTICATED
  if (!hasCookie) {
    return {
      authState: 'UNAUTHENTICATED',
      hasCookie: false,
      getUserStatus: 'no_user',
      organizationStatus: 'missing',
      whyBlocked: 'No auth cookie found',
      requestId,
    };
  }

  // Step 2: Supabase クライアント作成 & getUser()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return allCookies;
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component での cookie 設定エラーをハンドル
          }
        },
      },
    }
  );

  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // getUser() エラー → AUTH_FAILED
  if (getUserError) {
    return {
      authState: 'AUTH_FAILED',
      hasCookie: true,
      getUserStatus: 'error',
      getUserError: getUserError.message,
      organizationStatus: 'missing',
      whyBlocked: `getUser failed: ${getUserError.message}`,
      requestId,
    };
  }

  // user なし → AUTH_FAILED
  if (!user) {
    return {
      authState: 'AUTH_FAILED',
      hasCookie: true,
      getUserStatus: 'no_user',
      organizationStatus: 'missing',
      whyBlocked: 'Cookie present but no user session',
      requestId,
    };
  }

  // Step 3: organization_membership の有無をチェック
  const { data: memberships, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  // メンバーシップ取得エラー → AUTH_FAILED（DBエラー扱い）
  if (membershipError) {
    return {
      authState: 'AUTH_FAILED',
      hasCookie: true,
      getUserStatus: 'success',
      organizationStatus: 'error',
      whyBlocked: `organization_members query failed: ${membershipError.message}`,
      userId: user.id,
      userEmail: user.email,
      requestId,
    };
  }

  // メンバーシップなし → AUTHENTICATED_NO_ORG
  if (!memberships || memberships.length === 0) {
    return {
      authState: 'AUTHENTICATED_NO_ORG',
      hasCookie: true,
      getUserStatus: 'success',
      organizationStatus: 'missing',
      whyBlocked: 'User has no organization membership',
      userId: user.id,
      userEmail: user.email,
      requestId,
    };
  }

  // すべてOK → AUTHENTICATED_READY
  return {
    authState: 'AUTHENTICATED_READY',
    hasCookie: true,
    getUserStatus: 'success',
    organizationStatus: 'ok',
    whyBlocked: null,
    userId: user.id,
    userEmail: user.email,
    organizationId: memberships[0].organization_id,
    requestId,
  };
}

/**
 * 認証状態のサマリーをログ用に生成
 */
export function summarizeAuthState(result: AuthStateResult): string {
  const parts = [
    `authState=${result.authState}`,
    `hasCookie=${result.hasCookie}`,
    `getUserStatus=${result.getUserStatus}`,
    `organizationStatus=${result.organizationStatus}`,
  ];

  if (result.whyBlocked) {
    parts.push(`whyBlocked="${result.whyBlocked}"`);
  }

  return parts.join(', ');
}
