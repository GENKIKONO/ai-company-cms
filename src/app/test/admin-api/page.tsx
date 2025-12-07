'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: 'pending' | 'success' | 'error';
  statusCode?: number;
  response?: any;
  error?: string;
  duration?: number;
}

export default function AdminApiTestPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 組織ID・認証トークン取得
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const supabase = supabaseBrowser;
        
        // 認証ユーザー取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (authError || sessionError || !user || !session) {
          // 認証エラー: authError?.message || sessionError?.message
          return;
        }

        setAuthToken(session.access_token);

        // 組織ID取得
        const { data: userOrg, error: orgError } = await supabase
          .from('user_organizations')
          .select('organization_id, organizations(name)')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .single();

        if (orgError || !userOrg) {
          // 組織取得エラー: orgError?.message
          return;
        }

        setOrganizationId(userOrg.organization_id);

      } catch (error) {
        // 初期化エラー: error
      }
    };

    initializeAuth();
  }, []);

  // Admin API テスト実行
  const testAdminApi = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    if (!authToken) {
      return;
    }

    const testId = `${method} ${endpoint}`;
    
    // テスト開始
    const startTime = Date.now();
    setTestResults(prev => [
      ...prev.filter(r => r.endpoint !== endpoint || r.method !== method),
      { endpoint, method, status: 'pending' }
    ]);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const fullUrl = `${supabaseUrl}/functions/v1/admin-api${endpoint}`;

      // Testing: ${method} ${fullUrl}
      // Auth Token: ${authToken.substring(0, 20)}...

      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      };

      if (body && method !== 'GET') {
        requestConfig.body = JSON.stringify(body);
      }

      const response = await fetch(fullUrl, requestConfig);
      const duration = Date.now() - startTime;

      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = { message: await response.text() };
      }

      const result: ApiTestResult = {
        endpoint,
        method,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        response: responseData,
        duration
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      setTestResults(prev => [
        ...prev.filter(r => r.endpoint !== endpoint || r.method !== method),
        result
      ]);

      // Test completed: ${testId}

    } catch (error) {
      const duration = Date.now() - startTime;
      const result: ApiTestResult = {
        endpoint,
        method,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        duration
      };

      setTestResults(prev => [
        ...prev.filter(r => r.endpoint !== endpoint || r.method !== method),
        result
      ]);

      // Test failed: ${testId}
    }
  };

  // 全テスト実行
  const runAllTests = async () => {
    if (!organizationId || !authToken) {
      alert('組織IDまたは認証トークンが取得できていません');
      return;
    }

    setIsLoading(true);
    setTestResults([]);

    // 1. Health Check
    await testAdminApi('/health');
    
    // 2. CMS Overview
    await testAdminApi(`/cms_overview?organization_id=${organizationId}`);
    
    // 3. Site Settings (GET)
    await testAdminApi(`/site-settings?organization_id=${organizationId}`);
    
    // 4. CMS Sections (GET)
    await testAdminApi(`/cms-sections?organization_id=${organizationId}`);
    
    // 5. CMS Assets (GET)
    await testAdminApi(`/cms-assets?organization_id=${organizationId}`);

    // 6. Site Settings (POST) - Test data
    await testAdminApi('/site-settings', 'POST', {
      organization_id: organizationId,
      key: 'test_setting',
      value: 'test_value',
      data_type: 'text',
      description: 'Test setting for API verification',
      is_public: false
    });

    // 7. Check Permission
    await testAdminApi(`/check-permission?organization_id=${organizationId}`);

    setIsLoading(false);
  };

  // 個別テスト実行
  const runIndividualTest = (testName: string) => {
    if (!organizationId || !authToken) {
      alert('組織IDまたは認証トークンが取得できていません');
      return;
    }

    switch (testName) {
      case 'health':
        testAdminApi('/health');
        break;
      case 'cms_overview':
        testAdminApi(`/cms_overview?organization_id=${organizationId}`);
        break;
      case 'site-settings-get':
        testAdminApi(`/site-settings?organization_id=${organizationId}`);
        break;
      case 'cms-sections-get':
        testAdminApi(`/cms-sections?organization_id=${organizationId}`);
        break;
      case 'site-settings-post':
        testAdminApi('/site-settings', 'POST', {
          organization_id: organizationId,
          key: `test_${Date.now()}`,
          value: 'test_value',
          data_type: 'text',
          is_public: false
        });
        break;
      case 'permission-check':
        testAdminApi(`/check-permission?organization_id=${organizationId}`);
        break;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin API接続テスト
        </h1>
        <p className="text-gray-600">
          Supabase Edge Function (admin-api) への接続をテストします
        </p>
      </div>

      {/* 認証・組織情報 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3">認証情報</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>組織ID:</strong>
            <div className="font-mono bg-white p-2 rounded mt-1">
              {organizationId || '取得中...'}
            </div>
          </div>
          <div>
            <strong>認証トークン:</strong>
            <div className="font-mono bg-white p-2 rounded mt-1">
              {authToken ? `${authToken.substring(0, 30)}...` : '取得中...'}
            </div>
          </div>
        </div>
      </div>

      {/* テスト操作 */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={!organizationId || !authToken || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {isLoading ? '実行中...' : '全テスト実行'}
        </button>

        <div className="flex flex-wrap gap-2">
          {[
            { key: 'health', label: 'Health Check' },
            { key: 'cms_overview', label: 'CMS Overview' },
            { key: 'site-settings-get', label: 'Site Settings (GET)' },
            { key: 'cms-sections-get', label: 'CMS Sections (GET)' },
            { key: 'site-settings-post', label: 'Site Settings (POST)' },
            { key: 'permission-check', label: 'Permission Check' }
          ].map(test => (
            <button
              key={test.key}
              onClick={() => runIndividualTest(test.key)}
              disabled={!organizationId || !authToken}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 disabled:bg-gray-300"
            >
              {test.label}
            </button>
          ))}
        </div>
      </div>

      {/* テスト結果 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">テスト結果</h3>
        
        {testResults.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            テストを実行してください
          </div>
        )}

        {testResults.map((result, index) => (
          <div
            key={`${result.method}-${result.endpoint}-${index}`}
            className={`p-4 rounded-lg border ${
              result.status === 'success' ? 'bg-green-50 border-green-200' :
              result.status === 'error' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold">{result.method}</span>
                <span className="ml-2 font-mono text-sm">{result.endpoint}</span>
              </div>
              <div className="flex items-center gap-2">
                {result.duration && (
                  <span className="text-xs text-gray-500">{result.duration}ms</span>
                )}
                {result.statusCode && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.statusCode < 300 ? 'bg-green-100 text-green-800' :
                    result.statusCode < 400 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.statusCode}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded ${
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {result.status}
                </span>
              </div>
            </div>

            {result.error && (
              <div className="text-red-600 text-sm mb-2">
                <strong>エラー:</strong> {result.error}
              </div>
            )}

            {result.response && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">レスポンス詳細</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}