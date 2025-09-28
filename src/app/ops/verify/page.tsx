import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase-server';
import { requireOpsAdminPage, getOpsAdminStatus } from '@/lib/ops-guard';

export default async function OpsVerifyPage() {
  // 管理者運用認証ガード
  await requireOpsAdminPage();
  
  // 管理者状態の詳細情報を取得
  const opsStatus = await getOpsAdminStatus();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Administrator Verification
                </h1>
                <p className="text-gray-600">
                  System operations and administration panel
                </p>
              </div>
              <div>
                <form method="post" action="/api/ops/logout_api">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    管理者ログアウト
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-800 mb-2">
                ✅ Access Granted
              </h2>
              <p className="text-green-700 text-sm">
                Administrator verified: {user?.email}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">
                🔧 Admin Gate Status
              </h2>
              <div className="text-blue-700 text-sm space-y-1">
                <div>Email: {opsStatus.adminCheck?.isAdminEmail ? '✅' : '❌'} {opsStatus.supabaseAuth?.email}</div>
                <div>Ops Cookie: {opsStatus.opsAdmin?.isValid ? '✅' : '❌'} {opsStatus.opsAdmin?.cookieValue || 'N/A'}</div>
                <div>Authorized: {opsStatus.overall?.isAuthorized ? '✅' : '❌'}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              System Diagnostics
            </h3>
            
            {/* Auth Paths Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">🔐 Auth Paths</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Signout (POST):</span>
                  <a
                    href="/auth/signout"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.preventDefault();
                      fetch('/auth/signout', { method: 'POST', credentials: 'include' })
                        .then(response => alert(`POST /auth/signout: ${response.status} ${response.statusText}`))
                        .catch(err => alert(`Error: ${err.message}`));
                    }}
                  >
                    Test POST→303
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Session Diag:</span>
                  <a
                    href="/api/diag/session"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>

            {/* Org Create Section */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">🏢 Org Create</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Debug Mode:</span>
                  <a
                    href="/api/my/organization?debug=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    GET ?debug=1
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">Create Form:</span>
                  <a
                    href="/organizations/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Test UI
                  </a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">API Status:</span>
                  <button
                    onClick={() => {
                      fetch('/api/my/organization?debug=1', { credentials: 'include' })
                        .then(r => r.json())
                        .then(data => {
                          console.log('Org API Response:', data);
                          alert(`Status: ${data.code || 'OK'}, Details in console`);
                        })
                        .catch(err => alert(`Error: ${err.message}`));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Test API
                  </button>
                </div>
              </div>
            </div>

            <h4 className="text-md font-medium text-gray-800 mb-3">⚡ Quick Actions</h4>
            <div className="space-y-3">
              <a
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Health Check
              </a>
              <a
                href="/api/diag/ui"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-3"
              >
                Diagnostic UI
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ml-3"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}