'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase/client';
import { getCurrentUserClient, refreshSessionClient } from '@/lib/core/auth-state.client';
import { logger } from '@/lib/utils/logger';

export default function CallbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error: authError } = await refreshSessionClient();
        
        if (authError) {
          logger.error('Auth callback error:', { data: authError });
          setError('認証に失敗しました');
          return;
        }

        // セッション情報を取得してユーザーに組織があるかチェック
        const user = await getCurrentUserClient();
        
        if (user) {
          // 組織の有無をチェック（簡易チェック）
          const { data: orgs } = await supabaseBrowser
            .from('organizations')
            .select('id')
            .eq('created_by', user.id)
            .limit(1);
          
          if (orgs && orgs.length > 0) {
            // 組織があればダッシュボードへ
            router.push('/dashboard');
          } else {
            // 組織がなければ組織作成ページへ
            router.push('/organizations/new');
          }
        } else {
          router.push('/dashboard');
        }
        
      } catch (err) {
        logger.error('Callback error:', { data: err });
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--aio-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-600">認証処理中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              認証エラー
            </h2>
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
            <div className="mt-6">
              <Link href="/auth/login" className="font-medium text-[var(--aio-primary)] hover:text-[var(--aio-primary)]">
                ログインページに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}