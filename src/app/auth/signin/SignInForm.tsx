'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';
import { logger } from '@/lib/utils/logger';

interface SignInFormProps {
  redirectUrl?: string;
}

export default function SignInForm({ redirectUrl }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
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
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。確認メールをご確認ください。';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
        }
        
        setError(errorMessage);
        return;
      }

      // ログイン成功でダッシュボードへ遷移
      const targetUrl = redirectUrl || '/dashboard';
      router.replace(targetUrl);
      
    } catch (err) {
      logger.error('Sign in error:', err);
      setError('ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
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
          {isLoading ? 'サインイン中...' : 'サインイン'}
        </button>
      </div>
    </form>
  );
}