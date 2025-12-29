'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackLink } from '@/components/ui/back-link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('パスワードリセットメールを送信しました。メールをご確認の上、リンクをクリックしてパスワードを変更してください。');
      } else {
        // Handle specific error codes (商用レベル統合版)
        switch (result.code) {
          case 'validation_error':
            setError('メールアドレスの形式が正しくありません。');
            break;
          case 'rate_limited':
            const retryAfter = result.retryAfter || 60;
            setError(`送信制限に達しました。${retryAfter}秒後に再度お試しください。`);
            break;
          case 'user_not_found':
            setError('入力されたメールアドレスは登録されていません。アカウントを作成してください。');
            break;
          case 'generate_link_failed':
            setError('リセットメールの生成に失敗しました。しばらく時間をおいてからお試しください。');
            break;
          case 'resend_failed':
            setError('メール送信に失敗しました。しばらく時間をおいてからお試しください。');
            break;
          case 'internal_error':
            setError('システムエラーが発生しました。問題が続く場合はサポートまでお問い合わせください。');
            break;
          default:
            setError(result.error || 'エラーが発生しました。もう一度お試しください。');
        }
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。インターネット接続を確認してお試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      
      <div className="relative max-w-lg w-full mx-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-12">
          <div className="mb-8">
            <BackLink fallbackUrl="/auth/login" />
          </div>
          
          <div className="text-center mb-10">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              パスワードを忘れた方
            </h1>
            <p className="text-lg text-gray-600">
              登録済みのメールアドレスを入力してください
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 px-6 py-4 rounded-2xl">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-700 px-6 py-4 rounded-2xl">
                {success}
              </div>
            )}

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
                className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 placeholder-gray-500 transition-all duration-300"
                placeholder="email@example.com"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="w-full bg-[var(--aio-primary)] hover:bg-[var(--aio-primary-hover)] text-white font-semibold rounded-2xl px-8 py-4 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--aio-info)] focus:ring-offset-2"
              >
                {isLoading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
              </button>
            </div>

            <div className="text-center pt-6 border-t border-gray-200">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl px-6 py-3 transition-all duration-300 border border-gray-200"
              >
                ログイン画面に戻る
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}