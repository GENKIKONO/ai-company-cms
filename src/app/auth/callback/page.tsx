'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-client';

export default function CallbackPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error: authError } = await supabaseBrowser.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          setError('認証に失敗しました');
          return;
        }

        // 直接ダッシュボードへ遷移（DBトリガーでプロフィールは自動作成）
        router.push('/dashboard');
        
      } catch (err) {
        console.error('Callback error:', err);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
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