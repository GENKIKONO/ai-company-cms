'use client';

import { useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSessionClient, onAuthChangeClient } from '@/lib/core/auth-state.client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        // Core経由でセッション取得
        const currentSession = await getSessionClient();

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user || null);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('認証エラーが発生しました'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // Core経由で認証状態変更リスナー登録
    let subscription: { unsubscribe: () => void } | null = null;

    onAuthChangeClient(
      (event: AuthChangeEvent, newSession: Session | null) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user || null);
          setError(null);

          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    ).then(result => {
      subscription = result.data.subscription;
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
  };
}