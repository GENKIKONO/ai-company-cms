'use client';

import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

interface LoginFormProps {
  redirectUrl?: string;
}

// クライアントサイドで requestId を生成
function generateRequestId(): string {
  return `lf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function LoginForm({ redirectUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // Task B: 診断用 - 最後に発火したリクエストの情報
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const [lastResponseInfo, setLastResponseInfo] = useState<string | null>(null);

  // Task C: API疎通確認用
  const [apiCheckResult, setApiCheckResult] = useState<string | null>(null);
  const [apiCheckLoading, setApiCheckLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setLastResponseInfo(null);

    // Task B: クライアントサイドで requestId を生成
    const clientRequestId = generateRequestId();
    setLastRequestId(clientRequestId);

    try {
      // Step 1: 古いSupabase Cookieをクリア
      // MiddlewareではなくAPIで明示的にクリアすることで、
      // prefetchによる意図しないCookieクリアを防ぐ
      try {
        const clearResponse = await fetch('/api/auth/clear-session', {
          method: 'POST',
          credentials: 'include',
        });
        const clearResult = await clearResponse.json();
        if (clearResult.cleared?.length > 0) {
          logger.debug('[LoginForm] Cleared old cookies before login', {
            cleared: clearResult.cleared,
          });
        }
      } catch (clearErr) {
        // クリア失敗は致命的ではないので続行
        logger.warn('[LoginForm] Failed to clear old cookies', { error: clearErr });
      }

      // Step 2: Route Handler 経由でサーバーサイドログイン（Cookie を確実に発行）
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-request-id': clientRequestId, // サーバーログとの紐付け用
        },
        body: JSON.stringify({
          email,
          password,
          redirectTo: redirectUrl || '/dashboard',
          clientRequestId, // body にも含める
        }),
        credentials: 'include', // Cookie を確実に受け取る
      });

      const result = await response.json();

      // Task B: レスポンス情報を記録
      setLastResponseInfo(`status=${response.status} ok=${result.ok} serverRequestId=${result.requestId || 'n/a'}`);

      // 契約: 200 かつ ok:true の時だけ遷移する
      // 401/404/500 はすべてエラー表示のみ（遷移禁止）
      if (!response.ok || result.ok !== true) {
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
          resultOk: result.ok,
        });
        // 明示的に return してナビゲーションを防止
        return;
      }

      logger.debug('[LoginForm] ログイン成功（200 + ok:true）、リダイレクト開始', { requestId: result.requestId });

      // Cookie が設定された状態でダッシュボードへ遷移
      // 注意: router.refresh()は現在ページ(/auth/login)をリフレッシュするため、
      // Middlewareが再度Cookieをクリアしてしまう。直接遷移する。
      const targetUrl = result.redirectTo || '/dashboard';
      window.location.href = targetUrl; // 完全なページ遷移でCookieを確実に保持

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

  // Task C: API疎通確認
  const handleApiCheck = async () => {
    setApiCheckLoading(true);
    setApiCheckResult(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include',
      });
      const result = await response.json();
      if (result.ok && result.sha) {
        setApiCheckResult(`OK: sha=${result.sha.slice(0, 12)}...`);
      } else {
        setApiCheckResult(`Error: ${JSON.stringify(result)}`);
      }
    } catch (err) {
      setApiCheckResult(`Network Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setApiCheckLoading(false);
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

      {/* Task B & C: 診断情報表示 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700 font-medium">
            診断情報 (Debug)
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded font-mono space-y-2">
            {/* Task B: 最後のリクエスト情報 */}
            <div>
              <span className="font-semibold">Last Request ID:</span>{' '}
              {lastRequestId || '(未発火)'}
            </div>
            <div>
              <span className="font-semibold">Last Response:</span>{' '}
              {lastResponseInfo || '(未取得)'}
            </div>

            {/* Task C: API疎通確認 */}
            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={handleApiCheck}
                disabled={apiCheckLoading}
                className="text-[var(--aio-primary)] hover:underline disabled:opacity-50"
              >
                {apiCheckLoading ? 'チェック中...' : 'API疎通チェック (GET /api/auth/login)'}
              </button>
              {apiCheckResult && (
                <div className="mt-1 text-gray-600">{apiCheckResult}</div>
              )}
            </div>
          </div>
        </details>
      </div>
    </form>
  );
}