'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';

interface LoginFormProps {
  redirectUrl?: string;
}

export default function LoginForm({ redirectUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'メールアドレスが確認されていません。確認メールをご確認ください。';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = '試行回数が上限に達しました。しばらく時間をおいてからお試しください。';
        }
        
        setError(errorMessage);
        return;
      }

      // ログイン成功 - セッション確認を行う
      if (data.session) {
        // Cookieを確認してセッションが設定されているかチェック
        const cookieString = document.cookie;
        const hasSupabaseAuthToken = /sb-[^=;]+-auth-token=/.test(cookieString);
        
        if (!hasSupabaseAuthToken) {
          console.warn('[LoginForm] セッションCookieが設定されていません');
        }

        // ダッシュボードへ遷移
        const targetUrl = redirectUrl || '/dashboard';
        router.replace(targetUrl);
      } else {
        setError('ログインに失敗しました。セッションが作成されませんでした。');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError('ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
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
    </form>
  );
}