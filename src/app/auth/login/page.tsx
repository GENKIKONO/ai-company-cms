import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase-server-unified';
import LoginForm from './LoginForm';

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
    console.error('[Login] Session check error:', error);
  }

  // ログインフォームを表示
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            AIO Hub にログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI企業情報プラットフォーム
          </p>
        </div>
        <LoginForm redirectUrl={resolvedSearchParams.redirect} />
        
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              パスワードを忘れた方はこちら
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}