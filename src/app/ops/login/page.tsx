import { redirect } from 'next/navigation';
import { checkOpsAdmin } from '@/lib/ops-guard';
import OpsLoginForm from './OpsLoginForm';

interface OpsLoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OpsLoginPage({ searchParams }: OpsLoginPageProps) {
  // 既に管理者認証済みならverifyページにリダイレクト
  const authResult = await checkOpsAdmin();
  if (authResult.isAuthorized) {
    redirect('/ops/verify');
  }

  const params = await searchParams;
  const reason = typeof params.reason === 'string' ? params.reason : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理者運用ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            運用管理用の特別なアクセスです
          </p>
          {reason && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {reason === 'forbidden' && 'アクセスには管理者認証が必要です'}
                    {reason === 'expired' && 'セッションが期限切れです'}
                    {reason !== 'forbidden' && reason !== 'expired' && reason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <OpsLoginForm />

        <div className="text-center">
          <div className="text-sm text-gray-500">
            <div className="mb-2">前提条件:</div>
            <div className="text-xs space-y-1">
              <div>✓ Supabase認証済み（管理者アカウント）</div>
              <div>✓ 運用パスフレーズの入力</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}