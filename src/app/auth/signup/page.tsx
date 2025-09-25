'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BackLink } from '@/components/ui/back-link';
import { getAppUrl } from '@/lib/utils/env';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const router = useRouter();

  // Countdown timer for retry after rate limiting
  useEffect(() => {
    if (retryAfter !== null && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev === null || prev <= 1) {
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleSignup = async (e: React.FormEvent) => {
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
      // 統一化されたAPP_URL使用（常にhttps://aiohub.jp）
      const redirectTo = `${getAppUrl()}/auth/confirm`;
      
      const { error: signUpError } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signUpError) {
        // Handle specific error messages in Japanese
        let errorMessage = signUpError.message;
        let showExistingUserActions = false;
        
        if (signUpError.message.includes('User already registered') || 
            signUpError.message.includes('already registered') ||
            signUpError.message.includes('Email address already in use')) {
          errorMessage = 'このメールアドレスはすでに登録されています';
          showExistingUserActions = true;
        } else if (signUpError.message.includes('Invalid email') || 
                   signUpError.message.includes('invalid email')) {
          errorMessage = 'メールアドレスの形式が正しくありません';
        } else if (signUpError.message.includes('Password')) {
          errorMessage = 'パスワードの形式が正しくありません';
        }
        
        setError(errorMessage);
        
        // Show appropriate action links for existing users
        if (showExistingUserActions) {
          setError(errorMessage + ' ログイン、またはパスワードをお忘れの方は下記のリンクをご利用ください。');
        }
        
        return;
      }

      setSuccess('確認メールを送信しました。メールをご確認の上、リンクをクリックしてアカウントを有効化してください。');
      setShowResendButton(true);
      
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'アカウント作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setError('');
    setRetryAfter(null);
    
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
        setSuccess('確認メールを再送信しました。メールをご確認ください。');
      } else {
        // Handle specific error codes from the API
        const errorCode = result.code;
        let errorMessage = result.error || '再送信に失敗しました';
        
        switch (errorCode) {
          case 'rate_limited':
            const retrySeconds = result.retryAfter || 60;
            setRetryAfter(retrySeconds);
            errorMessage = `送信制限に達しました。${retrySeconds}秒後に再度お試しください。`;
            break;
          case 'validation_error':
            errorMessage = 'メールアドレスの形式が正しくありません。';
            break;
          case 'generate_link_failed':
            errorMessage = 'システムエラーが発生しました。しばらく時間をおいてからお試しください。';
            break;
          case 'resend_send_failed':
            errorMessage = 'メール送信に失敗しました。しばらく時間をおいてからお試しください。';
            break;
          case 'internal_error':
            errorMessage = 'システムエラーが発生しました。問題が続く場合はサポートまでお問い合わせください。';
            break;
          default:
            // Use the error message from the API or fallback
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
            AIO Hub に新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI企業情報プラットフォーム
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
              {error.includes('すでに登録されています') && (
                <div className="mt-3 text-sm">
                  <a href="/auth/login" className="text-blue-600 hover:text-blue-500 underline mr-4">
                    ログインページへ
                  </a>
                  <a href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500 underline">
                    パスワードリセット
                  </a>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {success}
              {showResendButton && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendLoading || retryAfter !== null}
                    className="text-sm text-blue-600 hover:text-blue-500 underline disabled:opacity-50"
                  >
                    {resendLoading 
                      ? '再送信中...' 
                      : retryAfter !== null 
                        ? `${retryAfter}秒後に再送信可能` 
                        : 'メールが届かない場合は再送信'
                    }
                  </button>
                </div>
              )}
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="パスワード（6文字以上）"
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
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登録中...' : 'アカウント作成'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちの方は{' '}
              <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                ログイン
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}