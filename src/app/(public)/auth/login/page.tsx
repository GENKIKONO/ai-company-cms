import Link from 'next/link';
import LoginForm from './LoginForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LoginPageProps {
  searchParams: Promise<{
    redirect?: string;
    reason?: string;  // 診断用: middleware リダイレクト理由
    rid?: string;     // 診断用: request ID (短縮)
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  // Note: Middlewareが/auth/loginアクセス時に古いSupabase Cookieをクリア済み
  // ここではセッション確認不要（Cookieクリア済みなので必ず未ログイン状態）

  // 診断情報
  const redirectReason = resolvedSearchParams.reason;
  const requestIdShort = resolvedSearchParams.rid;

  // ログインフォームを表示
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">

      <div className="relative max-w-lg w-full mx-4">
        {/* 診断バナー: middleware 307 リダイレクトの場合に表示 */}
        {redirectReason && (
          <div className="mb-4 p-4 bg-[var(--aio-warning-muted)] border border-[var(--aio-warning)] rounded-2xl text-sm">
            <div className="font-semibold text-[var(--aio-warning)] mb-1">
              セッションが切れました
            </div>
            <div className="text-[var(--color-text-secondary)] font-mono text-xs">
              reason: {redirectReason}
              {requestIdShort && <> | rid: {requestIdShort}</>}
            </div>
          </div>
        )}

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-12">
          <div className="text-center mb-10">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-[var(--aio-primary)] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              AIOHub にログイン
            </h1>
            <p className="text-lg text-gray-600">
              AI企業情報プラットフォーム
            </p>
          </div>
          
          <LoginForm redirectUrl={resolvedSearchParams.redirect} />
          
          <div className="mt-8 text-center space-y-4">
            <Link 
              href="/auth/forgot-password" 
              className="block text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)] font-medium transition-colors"
            >
              パスワードを忘れた方はこちら
            </Link>
            
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 mb-4">
                アカウントをお持ちでない方
              </p>
              <Link 
                href="/auth/signup" 
                className="inline-flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl px-6 py-3 transition-all duration-300 border border-gray-200"
              >
                新規登録
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}