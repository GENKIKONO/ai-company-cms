'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';
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
      const { data, error: signInError } = await supabaseBrowser.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        let errorMessage = signInError.message;
        
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
        } else if (signInError.message.includes('Email not confirmed') || 
                   signInError.message.includes('email_not_confirmed') ||
                   signInError.message.includes('signup_disabled')) {
          errorMessage = 'メールアドレスが確認されていません。';
          setShowResendConfirmation(true);
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
        }
        
        setError(errorMessage);
        return;
      }

      // ログイン成功 - セッション確認を行う
      if (data.session) {
        // Cookieが設定されるまで少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cookieを確認してセッションが設定されているかチェック
        const cookieString = document.cookie;
        const hasSupabaseAuthToken = /sb-[^=;]+-auth-token=/.test(cookieString);
        
        if (!hasSupabaseAuthToken) {
          logger.warn('[LoginForm] セッションCookieが設定されていません、もう少し待機します');
          // さらに1秒待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // ダッシュボードへ遷移
        const targetUrl = redirectUrl || '/dashboard';
        logger.debug('[LoginForm] リダイレクト開始', targetUrl);
        
        // 強制的にページをリロードして認証状態を確実に反映
        window.location.href = targetUrl;
      } else {
        setError('ログインに失敗しました。セッションが作成されませんでした。');
      }
      
    } catch (err) {
      logger.error('Login error:', err);
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
                className="text-sm text-[var(--bg-primary)] hover:text-blue-500 underline disabled:opacity-50"
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
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[var(--bg-primary)] focus:border-[var(--bg-primary)] sm:text-sm"
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
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-[var(--bg-primary)] focus:border-[var(--bg-primary)] sm:text-sm"
            placeholder="パスワード"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--bg-primary)] hover:bg-[var(--bg-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </div>
    </form>
  );
}