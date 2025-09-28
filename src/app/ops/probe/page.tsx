import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { requireOpsAdminPage } from '@/lib/ops-guard';

interface StatusData {
  hasSession: boolean;
  userEmail: string;
  isAdminEmail: boolean;
  hasOpsCookie: boolean;
  env: {
    hasAdminEmailEnv: boolean;
    hasOpsPasswordEnv: boolean;
    opsPasswordLength: number;
  };
  cookie: {
    domainUsed: string;
    rawHost: string;
  };
  ts: string;
}

async function getOpsStatus(): Promise<StatusData | null> {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://aiohub.jp'}/api/ops/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[getOpsStatus] Error:', error);
    return null;
  }
}

export default async function OpsProbe() {
  // 管理者運用認証ガード
  await requireOpsAdminPage();
  
  const status = await getOpsStatus();
  
  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Ops Probe - Status Error
            </h1>
            <p className="text-red-700">
              ステータス情報の取得に失敗しました。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const checks = [
    {
      id: 'session',
      name: 'Supabase セッションあり',
      status: status.hasSession,
      message: status.hasSession ? 'セッション正常' : 'Supabaseセッションが見つかりません'
    },
    {
      id: 'admin_email',
      name: 'ADMIN_EMAIL と一致（大小区別なし・trim）',
      status: status.isAdminEmail,
      message: status.isAdminEmail ? '管理者メール確認済み' : 'ADMIN_EMAILと一致しません'
    },
    {
      id: 'ops_cookie',
      name: 'ops_admin クッキーあり',
      status: status.hasOpsCookie,
      message: status.hasOpsCookie ? 'ops_adminクッキー有効' : 'ops_adminクッキーが設定されていません'
    },
    {
      id: 'password_length',
      name: 'ADMIN_OPS_PASSWORD の長さ > 15',
      status: status.env.opsPasswordLength > 15,
      message: status.env.opsPasswordLength > 15 
        ? `パスワード長OK (${status.env.opsPasswordLength}文字)` 
        : `パスワードが短すぎます (${status.env.opsPasswordLength}文字)`
    },
    {
      id: 'domain',
      name: 'Cookie Domain が適切',
      status: status.cookie.domainUsed.includes('aiohub.jp') || status.cookie.rawHost === 'aiohub.jp',
      message: `Domain: ${status.cookie.domainUsed} (Host: ${status.cookie.rawHost})`
    }
  ];

  const allGreen = checks.every(check => check.status);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Ops Probe - 管理者認証診断
                </h1>
                <p className="text-gray-600">
                  管理者ログインの実施チェック項目を確認します
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  最終更新: {new Date(status.ts).toLocaleString('ja-JP')}
                </p>
              </div>
              <div className="space-y-2">
                <form method="post" action="/api/ops/logout_api">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    ops_admin クッキー削除
                  </button>
                </form>
                <div>
                  <a
                    href="/ops/verify"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Verify に戻る
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 総合ステータス */}
          <div className={`mb-6 p-4 rounded-lg border ${allGreen 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h2 className={`text-lg font-semibold mb-2 ${allGreen 
              ? 'text-green-800' 
              : 'text-yellow-800'
            }`}>
              {allGreen ? '✅ 全チェック通過' : '⚠️ 要確認項目あり'}
            </h2>
            <p className={`text-sm ${allGreen ? 'text-green-700' : 'text-yellow-700'}`}>
              ユーザー: {status.userEmail} | Cookie: {status.hasOpsCookie ? '有効' : '無効'}
            </p>
          </div>

          {/* チェック項目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {checks.map((check) => (
              <div
                key={check.id}
                className={`p-4 rounded-lg border ${check.status 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start">
                  <div className={`text-lg mr-3 ${check.status ? 'text-green-600' : 'text-red-600'}`}>
                    {check.status ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${check.status ? 'text-green-800' : 'text-red-800'}`}>
                      {check.name}
                    </h3>
                    <p className={`text-sm mt-1 ${check.status ? 'text-green-700' : 'text-red-700'}`}>
                      {check.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 環境変数情報 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              環境変数設定状況
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-3 rounded border ${status.env.hasAdminEmailEnv 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-sm font-medium">ADMIN_EMAIL</div>
                <div className={`text-xs ${status.env.hasAdminEmailEnv ? 'text-green-600' : 'text-red-600'}`}>
                  {status.env.hasAdminEmailEnv ? '設定済み' : '未設定'}
                </div>
              </div>
              <div className={`p-3 rounded border ${status.env.hasOpsPasswordEnv 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-sm font-medium">ADMIN_OPS_PASSWORD</div>
                <div className={`text-xs ${status.env.hasOpsPasswordEnv ? 'text-green-600' : 'text-red-600'}`}>
                  {status.env.hasOpsPasswordEnv ? `設定済み (${status.env.opsPasswordLength}文字)` : '未設定'}
                </div>
              </div>
              <div className="p-3 rounded border bg-blue-50 border-blue-200">
                <div className="text-sm font-medium">Cookie Domain</div>
                <div className="text-xs text-blue-600">
                  {status.cookie.domainUsed}
                </div>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <a
                href="/ops/login"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ログイン画面
              </a>
              <a
                href="/api/ops/status"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Status API
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ダッシュボード
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}