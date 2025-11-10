/**
 * 本番用受け入れテスト
 * ビルド後に実行してHTTPSエンドポイントの疎通確認
 */
/* eslint-disable no-console */

export async function runProdAcceptanceTest(): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp';
  const statusUrl = `${baseUrl}/api/ops/status`;
  
  console.log('[PROD_ACCEPTANCE] Starting acceptance test...');
  console.log(`[PROD_ACCEPTANCE] Base URL: ${baseUrl}`);
  console.log(`[PROD_ACCEPTANCE] Testing: ${statusUrl}`);
  
  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const status = response.status;
    const isExpectedStatus = status === 200 || status === 403;
    
    console.log(`[PROD_ACCEPTANCE] Status: ${status} ${response.statusText}`);
    console.log(`[PROD_ACCEPTANCE] Expected status (200/403): ${isExpectedStatus ? '✅' : '❌'}`);
    
    if (isExpectedStatus) {
      console.log('[PROD_ACCEPTANCE] ✅ Ops status endpoint is reachable');
    } else {
      console.warn(`[PROD_ACCEPTANCE] ⚠️ Unexpected status: ${status}`);
    }
    
    // Manual test flow URLs
    console.log('\n[PROD_ACCEPTANCE] Manual test flow URLs:');
    console.log(`1. Normal login: ${baseUrl}/auth/login`);
    console.log(`2. Ops login: ${baseUrl}/ops/login`);
    console.log(`3. Ops probe: ${baseUrl}/ops/probe`);
    console.log(`4. Status API: ${baseUrl}/api/ops/status`);
    
  } catch (error) {
    console.error(`[PROD_ACCEPTANCE] ❌ Test failed:`, error);
    console.error('[PROD_ACCEPTANCE] Network or connectivity issue detected');
  }
  
  console.log('[PROD_ACCEPTANCE] Acceptance test completed.');
}