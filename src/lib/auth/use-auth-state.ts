/**
 * useAuthState - クライアント側の認証状態判定 Hook
 *
 * 【重要】この Hook が唯一のクライアント側認証状態判定ロジック
 * - Cookie の有無（概念的 - クライアントでは直接確認できないため supabase.auth.getUser() で判定）
 * - supabase.auth.getUser() の結果
 * - organization_membership の有無
 * → ここで AuthState を1つ返す
 *
 * dashboard / posts / services / faqs すべてこの戻り値だけを見る。
 * 個別に supabase を叩くことは禁止。
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuthState, AuthStateResult } from './auth-state';

export interface UseAuthStateOptions {
  /** 自動的に組織メンバーシップもチェックするか */
  checkOrganization?: boolean;
}

export interface UseAuthStateReturn {
  /** 現在の認証状態（4状態のいずれか） */
  authState: AuthState;
  /** 読み込み中か */
  isLoading: boolean;
  /** 完全な診断結果 */
  result: AuthStateResult | null;
  /** 再チェック関数 */
  refresh: () => Promise<void>;
}

/**
 * クライアント側の認証状態を判定する Hook
 *
 * @example
 * ```tsx
 * const { authState, isLoading, result } = useAuthState();
 *
 * if (isLoading) return <Loading />;
 *
 * switch (authState) {
 *   case 'UNAUTHENTICATED':
 *   case 'AUTH_FAILED':
 *     return <LoginPrompt whyBlocked={result?.whyBlocked} />;
 *   case 'AUTHENTICATED_NO_ORG':
 *     return <CreateOrgPrompt />;
 *   case 'AUTHENTICATED_READY':
 *     return <DashboardContent />;
 * }
 * ```
 */
export function useAuthState(options: UseAuthStateOptions = {}): UseAuthStateReturn {
  const { checkOrganization = true } = options;

  const [authState, setAuthState] = useState<AuthState>('UNAUTHENTICATED');
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<AuthStateResult | null>(null);

  // Ref to track fetch counter and prevent stale updates
  const fetchCounterRef = useRef(0);
  const isMountedRef = useRef(true);

  const determineState = useCallback(async () => {
    fetchCounterRef.current += 1;
    const currentFetchId = fetchCounterRef.current;
    const requestId = crypto.randomUUID();

    const isStale = () => currentFetchId !== fetchCounterRef.current || !isMountedRef.current;

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Step 1: getUser() でセッション確認
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (isStale()) return;

      // getUser() エラー → AUTH_FAILED
      if (getUserError) {
        const newResult: AuthStateResult = {
          authState: 'AUTH_FAILED',
          hasCookie: false, // クライアントでは直接確認できないため
          getUserStatus: 'error',
          getUserError: getUserError.message,
          organizationStatus: 'missing',
          whyBlocked: `getUser failed: ${getUserError.message}`,
          requestId,
        };
        setAuthState('AUTH_FAILED');
        setResult(newResult);
        return;
      }

      // user なし → UNAUTHENTICATED
      if (!user) {
        const newResult: AuthStateResult = {
          authState: 'UNAUTHENTICATED',
          hasCookie: false,
          getUserStatus: 'no_user',
          organizationStatus: 'missing',
          whyBlocked: 'No user session',
          requestId,
        };
        setAuthState('UNAUTHENTICATED');
        setResult(newResult);
        return;
      }

      // 組織チェックをスキップする場合
      if (!checkOrganization) {
        const newResult: AuthStateResult = {
          authState: 'AUTHENTICATED_READY',
          hasCookie: true,
          getUserStatus: 'success',
          organizationStatus: 'ok', // スキップ時は ok 扱い
          whyBlocked: null,
          userId: user.id,
          userEmail: user.email,
          requestId,
        };
        setAuthState('AUTHENTICATED_READY');
        setResult(newResult);
        return;
      }

      // Step 2: organization_membership の有無をチェック
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (isStale()) return;

      // メンバーシップ取得エラー → AUTH_FAILED（DBエラー扱い）
      if (membershipError) {
        const newResult: AuthStateResult = {
          authState: 'AUTH_FAILED',
          hasCookie: true,
          getUserStatus: 'success',
          organizationStatus: 'error',
          whyBlocked: `organization_members query failed: ${membershipError.message}`,
          userId: user.id,
          userEmail: user.email,
          requestId,
        };
        setAuthState('AUTH_FAILED');
        setResult(newResult);
        return;
      }

      // メンバーシップなし → AUTHENTICATED_NO_ORG
      if (!memberships || memberships.length === 0) {
        const newResult: AuthStateResult = {
          authState: 'AUTHENTICATED_NO_ORG',
          hasCookie: true,
          getUserStatus: 'success',
          organizationStatus: 'missing',
          whyBlocked: 'User has no organization membership',
          userId: user.id,
          userEmail: user.email,
          requestId,
        };
        setAuthState('AUTHENTICATED_NO_ORG');
        setResult(newResult);
        return;
      }

      // すべてOK → AUTHENTICATED_READY
      const newResult: AuthStateResult = {
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
      setAuthState('AUTHENTICATED_READY');
      setResult(newResult);
    } catch (err) {
      if (isStale()) return;

      const newResult: AuthStateResult = {
        authState: 'AUTH_FAILED',
        hasCookie: false,
        getUserStatus: 'error',
        getUserError: err instanceof Error ? err.message : 'Unknown error',
        organizationStatus: 'error',
        whyBlocked: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`,
        requestId,
      };
      setAuthState('AUTH_FAILED');
      setResult(newResult);
    } finally {
      if (!isStale()) {
        setIsLoading(false);
      }
    }
  }, [checkOrganization]);

  useEffect(() => {
    isMountedRef.current = true;
    determineState();

    return () => {
      isMountedRef.current = false;
    };
  }, [determineState]);

  return {
    authState,
    isLoading,
    result,
    refresh: determineState,
  };
}
