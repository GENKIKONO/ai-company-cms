'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OpsLoginForm() {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passphrase.trim()) {
      setError('パスフレーズを入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ops/login_api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ passphrase }),
      });

      if (response.ok) {
        // 成功時は /ops/probe にリダイレクト
        router.push('/ops/probe');
        router.refresh();
      } else {
        const errorData = await response.json();
        
        // エラーコードに応じた日本語メッセージ
        switch (errorData.code) {
          case 'INVALID_PASSPHRASE':
            setError('パスフレーズが正しくありません');
            break;
          case 'EMPTY_PASSPHRASE':
            setError('パスフレーズを入力してください');
            break;
          case 'NOT_ADMIN':
            setError('管理者アカウントではありません');
            break;
          case 'MISSING_SESSION':
            setError('先にSupabaseにログインしてください');
            break;
          case 'OPS_PASSWORD_NOT_SET':
            setError('サーバー設定エラー（管理者にお問い合わせください）');
            break;
          case 'VALIDATION_ERROR':
            setError('入力値が無効です');
            break;
          case 'INTERNAL_ERROR':
            setError('内部エラーが発生しました');
            break;
          default:
            setError(errorData.reason || '認証に失敗しました');
        }
      }
    } catch (error) {
      console.error('Ops login error:', error);
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="passphrase" className="sr-only">
          運用パスフレーズ
        </label>
        <input
          id="passphrase"
          name="passphrase"
          type="password"
          autoComplete="current-password"
          required
          className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="運用パスフレーズ"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          disabled={loading}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                認証エラー
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '認証中...' : '管理者としてログイン'}
        </button>
      </div>

      <div className="text-center">
        <a
          href="/auth/login"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← 一般ログインに戻る
        </a>
      </div>
    </form>
  );
}