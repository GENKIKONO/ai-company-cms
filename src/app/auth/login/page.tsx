'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BackLink } from '@/components/ui/back-link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
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
        // Handle specific error messages in Japanese
        let errorMessage = signInError.message;
        let showResend = false;
        
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email not confirmed') ||
            signInError.message.includes('not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。下記から確認メールを再送信できます。';
          showResend = true;
        } else if (signInError.message.includes('Invalid login credentials') ||
                   signInError.message.includes('invalid credentials')) {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません。メール確認がお済みでない場合は、下記から確認メールを再送信してください。';
          showResend = true;
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
        } else if (signInError.message.includes('Email rate limit exceeded')) {
          errorMessage = 'メール送信の制限に達しました。しばらく時間をおいてからお試しください。';
        } else if (signInError.message.includes('Signup not allowed')) {
          errorMessage = 'サインアップが許可されていません。管理者にお問い合わせください。';
        }
        
        setError(errorMessage);
        setShowResendButton(showResend);
        return;
      }

      // ここで必ず同一オリジン + Cookie同送
      const response = await fetch('/api/auth/sync', { 
        method: 'POST', 
        credentials: 'include',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? 'Failed to sync profile');
      }

      // sync成功後にのみ遷移
      router.replace('/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'ログインに失敗しました。';
      
      if (err instanceof Error) {
        if (err.message.includes('Failed to sync user profile')) {
          errorMessage = 'ユーザープロフィール同期に失敗しました。再度ログインをお試しください。';
        } else if (err.message.includes('network') || err.message.includes('NetworkError')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してお試しください。';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('メールアドレスを入力してください。');
      return;
    }
    
    setResendLoading(true);
    setError('');
    setResendSuccess('');
    
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
        setResendSuccess('確認メールを再送信しました。メールをご確認ください。');
        setShowResendButton(false);
      } else {
        // Handle specific error codes
        let errorMessage = result.error || '再送信に失敗しました';
        
        switch (result.code) {
          case 'rate_limited':
            errorMessage = `送信制限に達しました。${result.retryAfter || 60}秒後に再度お試しください。`;
            break;
          case 'validation_error':
            errorMessage = 'メールアドレスの形式が正しくありません。';
            break;
          case 'user_not_found':
            errorMessage = 'ユーザーが見つかりません。先にサインアップを行ってください。';
            break;
          case 'already_confirmed':
            errorMessage = 'このメールアドレスは既に確認済みです。パスワードをお忘れの場合は、パスワードリセットをご利用ください。';
            break;
          default:
            break;
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。インターネット接続を確認してお試しください。');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex justify-start">
          <BackLink fallbackUrl="/" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AIO Hub にログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI企業情報プラットフォーム
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
              {showResendButton && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="text-sm text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
                  >
                    {resendLoading ? '再送信中...' : '確認メールを再送信'}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {resendSuccess}
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="パスワード"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              <a href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                パスワードを忘れた方はこちら
              </a>
            </p>
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <a href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
                新規登録
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}