import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server';
import LoginForm from './LoginForm';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LoginPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  
  // SSRでセッション確認
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    // ログイン済みなら /dashboard に redirect
    if (user) {
      const redirectUrl = resolvedSearchParams.redirect || '/dashboard';
      redirect(redirectUrl);
    }
  } catch (error) {
    logger.error('[Login] Session check error', error instanceof Error ? error : new Error(String(error)));
  }

  // ログインフォームを表示
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      
      <div className="relative max-w-lg w-full mx-4">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-12">
          <div className="text-center mb-10">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              AIO Hub にログイン
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