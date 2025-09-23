'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BackLink } from '@/components/ui/back-link';

function ResetPasswordConfirmContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have the necessary URL parameters
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    
    if (!accessToken || !refreshToken) {
      setError('無効なリセットリンクです。新しいパスワードリセットリクエストを送信してください。');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError('パスワードの更新に失敗しました。もう一度お試しください。');
        return;
      }

      setSuccess('パスワードが正常に更新されました。ログイン画面にリダイレクトします。');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);

    } catch (err) {
      console.error('Password update error:', err);
      setError('パスワードの更新に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const accessToken = searchParams.get('access_token');
  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="flex justify-start">
            <BackLink fallbackUrl="/auth/forgot-password" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              無効なリンク
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              このパスワードリセットリンクは無効です。
            </p>
            <div className="mt-4">
              <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                新しいパスワードリセットリクエストを送信
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex justify-start">
          <BackLink fallbackUrl="/auth/login" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            新しいパスワードを設定
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            新しいパスワードを入力してください
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                新しいパスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="新しいパスワード（6文字以上）"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード（確認）
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="パスワード（確認）"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'パスワード更新中...' : 'パスワードを更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  );
}