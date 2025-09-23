'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-client';

// Next.js 15: Force dynamic rendering to resolve useSearchParams prerender warning
export const dynamic = 'force-dynamic';

function ConfirmPageContent() {
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          setError('無効な確認リンクです');
          return;
        }

        const { error: verifyError } = await supabaseBrowser.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (verifyError) {
          console.error('Email verification error:', verifyError);
          setError('メール確認に失敗しました');
          return;
        }

        setConfirmed(true);

        // ユーザー同期API呼び出し
        const response = await fetch('/api/auth/sync', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to sync user profile');
        }

        const syncResult = await response.json();
        console.log('User sync result:', syncResult);

        // 3秒後にダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        
      } catch (err) {
        console.error('Confirmation error:', err);
        setError(err instanceof Error ? err.message : 'メール確認中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [router, searchParams]);

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

  const handleResendConfirmation = async () => {
    const email = searchParams.get('email');
    if (!email) {
      setResendMessage('メールアドレスが見つかりません。再度サインアップをお試しください。');
      return;
    }

    setResendLoading(true);
    setResendMessage('');
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
        setResendMessage('確認メールを再送信しました。メールをご確認ください。');
      } else {
        // Handle specific error codes from the API
        const errorCode = result.code;
        let errorMessage = result.error || '再送信に失敗しました。';
        
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
        
        setResendMessage(errorMessage);
      }
    } catch (err) {
      setResendMessage('ネットワークエラーが発生しました。インターネット接続を確認してお試しください。');
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">メール確認中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              確認エラー
            </h2>
            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
            
            {resendMessage && (
              <div className={`mt-4 px-4 py-3 rounded ${
                resendMessage.includes('再送信しました') 
                  ? 'bg-green-50 border border-green-200 text-green-600'
                  : 'bg-yellow-50 border border-yellow-200 text-yellow-600'
              }`}>
                {resendMessage}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <button
                onClick={handleResendConfirmation}
                disabled={resendLoading || retryAfter !== null}
                className="w-full flex justify-center py-2 px-4 border border-blue-300 rounded-md text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading 
                  ? '再送信中...' 
                  : retryAfter !== null 
                    ? `${retryAfter}秒後に再送信可能` 
                    : '確認メールを再送信'
                }
              </button>
              
              <div className="text-center">
                <a href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                  ログインページに戻る
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              確認完了
            </h2>
            <div className="mt-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              メール確認が完了しました！
            </div>
            <p className="mt-4 text-gray-600">
              3秒後にダッシュボードにリダイレクトします...
            </p>
            <div className="mt-6">
              <a href="/dashboard" className="font-medium text-blue-600 hover:text-blue-500">
                今すぐダッシュボードに移動
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  );
}