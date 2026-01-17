'use client';

/**
 * 管理者ログインページ
 *
 * Route: /auth/admin-login (via (public) route group)
 * Layout: (public)/layout.tsx provides Header/Footer
 * ToastProvider: Root layout provides
 *
 * 認証は POST /api/auth/login を経由（クライアントサイド signInWithPassword 禁止）
 *
 * @see docs/architecture/boundaries.md
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useErrorToast } from '@/components/ui/toast';
import { logger } from '@/lib/utils/logger';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const errorToast = useErrorToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // POST /api/auth/login を経由してログイン（Cookie を確実に発行）
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          redirectTo: '/management-console',
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok || result.ok !== true) {
        logger.error('Admin login failed', { result });
        errorToast(result.error || result.message || 'ログインに失敗しました');
        return;
      }

      // 管理者権限チェック
      const verifyResponse = await fetch('/api/admin/verify', {
        credentials: 'include',
      });
      const verifyResult = await verifyResponse.json();
      logger.debug('Admin verification result', verifyResult);

      if (!verifyResult.isAdmin) {
        // 管理者でない場合はログアウト
        await fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
        });
        errorToast(`管理者権限がありません。デバッグ情報: ${JSON.stringify(verifyResult.debug)}`);
        return;
      }

      // 管理コンソールにリダイレクト
      router.refresh();
      router.push('/management-console');

    } catch (error) {
      logger.error('Admin login error', { error });
      errorToast('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          管理コンソール
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          管理者アカウントでログインしてください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)] sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--aio-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
