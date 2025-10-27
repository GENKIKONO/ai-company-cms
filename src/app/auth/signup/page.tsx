'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase-client';
import { BackLink } from '@/components/ui/back-link';
import { getAppUrl } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';

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
      logger.error('Signup error:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.08),transparent_50%)]" />
      
      <div className="relative max-w-lg w-full mx-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-12">
          <div className="mb-8">
            <BackLink fallbackUrl="/" />
          </div>
          
          <div className="text-center mb-10">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              AIO Hub に新規登録
            </h1>
            <p className="text-lg text-gray-600">
              AI企業情報プラットフォーム
            </p>
          </div>
          <form className="space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
              {error}
              {error.includes('すでに登録されています') && (
                <div className="mt-3 text-sm">
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 underline mr-4">
                    ログインページへ
                  </Link>
                  <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-500 underline">
                    パスワードリセット
                  </Link>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-700 px-6 py-4 rounded-2xl">
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
          
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 transition-all duration-300"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 transition-all duration-300"
                placeholder="パスワード（6文字以上）"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-500 transition-all duration-300"
                placeholder="パスワード（確認）"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-2xl px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {isLoading ? '登録中...' : 'アカウント作成'}
            </button>
          </div>

          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-gray-600 mb-4">
              すでにアカウントをお持ちの方
            </p>
            <Link 
              href="/auth/login" 
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 font-semibold rounded-2xl px-6 py-3 transition-all duration-300 border border-gray-200"
            >
              ログイン
            </Link>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}