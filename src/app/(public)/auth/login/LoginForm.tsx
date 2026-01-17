'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

interface LoginFormProps {
  redirectUrl?: string;
}

export default function LoginForm({ redirectUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Route Handler 経由でサーバーサイドログイン（Cookie を確実に発行）
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          redirectTo: redirectUrl || '/dashboard',
        }),
        credentials: 'include', // Cookie を確実に受け取る
      });

      const result = await response.json();

      if (!response.ok) {
        // 401時は絶対に /dashboard に遷移しない
        const errorMessage = result.error || result.message || 'ログインに失敗しました。';
        const errorCode = result.code || 'unknown';

        if (errorMessage.includes('メールアドレスが確認されていません')) {
          setShowResendConfirmation(true);
        }

        // エラーコードも表示（診断用）
        setError(`${errorMessage} (code: ${errorCode})`);
        logger.warn('[LoginForm] Login failed - NOT navigating to dashboard', {
          requestId: result.requestId,
          code: errorCode,
          error: errorMessage,
          status: response.status,
        });
        // 明示的に return してナビゲーションを防止
        return;
      }

      logger.debug('[LoginForm] ログイン成功、リダイレクト開始', { requestId: result.requestId });

      // Cookie が設定された状態でリダイレクト
      // router.refresh() で RSC を再取得してからナビゲーション
      router.refresh();

      const targetUrl = result.redirectTo || '/dashboard';
      router.replace(targetUrl); // replace で履歴を汚さない

    } catch (err) {
      logger.error('Login error:', { data: err });
      setError('ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setResendMessage('メールアドレスを入力してください。');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: 'signup'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResendMessage('確認メールを再送信しました。メールをご確認ください。');
        setShowResendConfirmation(false);
      } else {
        setResendMessage(result.error || '再送信に失敗しました。');
      }
    } catch (err) {
      setResendMessage('ネットワークエラーが発生しました。');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
          {showResendConfirmation && (
            <div className="mt-3">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="text-sm text-[var(--aio-primary)] hover:text-[var(--aio-primary)] underline disabled:opacity-50"
              >
                {resendLoading ? '再送信中...' : '確認メールを再送信'}
              </button>
            </div>
          )}
        </div>
      )}

      {resendMessage && (
        <div className={`px-4 py-3 rounded ${
          resendMessage.includes('再送信しました') 
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-yellow-50 border border-yellow-200 text-yellow-600'
        }`}>
          {resendMessage}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)] sm:text-sm"
            placeholder="email@example.com"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[var(--aio-primary)] focus:border-[var(--aio-primary)] sm:text-sm"
            placeholder="パスワード"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--aio-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </div>
    </form>
  );
}