'use client';

import { useState } from 'react';
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
        // Handle specific error codes
        switch (result.code) {
          case 'validation_error':
            setError('メールアドレスの形式が正しくありません。');
            break;
          case 'rate_limited':
            const retryAfter = result.retryAfter || 60;
            setError(`送信制限に達しました。${retryAfter}秒後に再度お試しください。`);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex justify-start">
          <BackLink fallbackUrl="/auth/login" />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードを忘れた方
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録済みのメールアドレスを入力してください
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
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'メール送信中...' : 'パスワードリセットメールを送信'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                ログイン画面に戻る
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}