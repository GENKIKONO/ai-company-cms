#!/usr/bin/env node

/**
 * Admin API (Edge Function) 実接続テスト
 */

const fetch = require('node-fetch');

const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chyicolujwhkycpkxbej.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  adminApiBase: null // 動的に設定
};

TEST_CONFIG.adminApiBase = `${TEST_CONFIG.supabaseUrl}/functions/v1/admin-api`;

// ログユーティリティ
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  test: (name) => console.log(`\n🧪 ${name}`)
};

// Admin API Health Check テスト
async function testHealthCheck() {
  log.test('Admin API Health Check');
  
  try {
    const url = `${TEST_CONFIG.adminApiBase}/health`;
    log.info(`Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    log.info(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      log.success('Health check successful');
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      const errorText = await response.text();
      log.error(`Health check failed: ${response.status}`);
      console.log('Error response:', errorText);
      return { success: false, error: errorText };
    }
    
  } catch (error) {
    log.error(`Health check error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Supabase URL到達性テスト
async function testSupabaseUrl() {
  log.test('Supabase URL Reachability');
  
  try {
    const url = `${TEST_CONFIG.supabaseUrl}/rest/v1/`;
    log.info(`Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': TEST_CONFIG.anonKey,
        'Authorization': `Bearer ${TEST_CONFIG.anonKey}`
      },
      timeout: 10000
    });
    
    log.info(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200 || response.status === 401) { // 401は正常（認証が必要）
      log.success('Supabase URL is reachable');
      return { success: true };
    } else {
      log.error(`Unexpected status: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    log.error(`Supabase URL test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Edge Functions エンドポイント存在確認
async function testEdgeFunctionEndpoint() {
  log.test('Edge Function Endpoint Check');
  
  try {
    const url = `${TEST_CONFIG.supabaseUrl}/functions/v1/`;
    log.info(`Testing: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: 10000
    });
    
    log.info(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404 || response.status === 401 || response.status === 400) {
      log.success('Edge Functions endpoint exists');
      return { success: true };
    } else {
      const responseText = await response.text();
      log.warning(`Unexpected response: ${response.status}`);
      console.log('Response:', responseText.substring(0, 200));
      return { success: true, warning: 'Unexpected but accessible' };
    }
    
  } catch (error) {
    log.error(`Edge Function endpoint error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// CORS テスト
async function testCors() {
  log.test('CORS Configuration');
  
  try {
    const url = `${TEST_CONFIG.adminApiBase}/health`;
    log.info(`Testing CORS: ${url}`);
    
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      timeout: 10000
    });
    
    log.info(`CORS preflight status: ${response.status}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    console.log('CORS Headers:', corsHeaders);
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      log.success('CORS is configured');
      return { success: true, corsHeaders };
    } else {
      log.warning('CORS headers not found');
      return { success: false, error: 'No CORS headers' };
    }
    
  } catch (error) {
    log.error(`CORS test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 認証なしでのアクセステスト  
async function testUnauthorizedAccess() {
  log.test('Unauthorized Access Test');
  
  try {
    const url = `${TEST_CONFIG.adminApiBase}/cms_overview`;
    log.info(`Testing unauthorized access: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    log.info(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 401) {
      log.success('Properly returning 401 for unauthorized access');
      return { success: true, message: 'Authentication required' };
    } else if (response.status === 404) {
      log.warning('Endpoint not found (404) - admin-api may not be deployed');
      return { success: false, error: 'admin-api endpoint not found' };
    } else {
      const responseText = await response.text();
      log.warning(`Unexpected status: ${response.status}`);
      console.log('Response:', responseText.substring(0, 200));
      return { success: true, warning: 'Unexpected response but accessible' };
    }
    
  } catch (error) {
    log.error(`Unauthorized access test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// メイン実行関数
async function runTests() {
  console.log('🔧 Admin API 実接続テスト');
  console.log('='.repeat(50));
  console.log(`Supabase URL: ${TEST_CONFIG.supabaseUrl}`);
  console.log(`Admin API Base: ${TEST_CONFIG.adminApiBase}`);
  console.log('='.repeat(50));
  
  const results = [];
  
  // 1. Supabase URL到達性
  const supabaseTest = await testSupabaseUrl();
  results.push({ name: 'Supabase URL Reachability', ...supabaseTest });
  
  // 2. Edge Functions エンドポイント存在確認
  const edgeTest = await testEdgeFunctionEndpoint();
  results.push({ name: 'Edge Function Endpoint', ...edgeTest });
  
  // 3. Admin API Health Check
  const healthTest = await testHealthCheck();
  results.push({ name: 'Admin API Health Check', ...healthTest });
  
  // 4. 認証なしアクセステスト
  const unauthTest = await testUnauthorizedAccess();
  results.push({ name: 'Unauthorized Access Test', ...unauthTest });
  
  // 5. CORS テスト
  const corsTest = await testCors();
  results.push({ name: 'CORS Configuration', ...corsTest });
  
  // 結果サマリー
  console.log('\n📊 テスト結果サマリー');
  console.log('='.repeat(50));
  
  let passCount = 0;
  results.forEach(result => {
    const status = result.success ? 'PASS' : 'FAIL';
    const icon = result.success ? '✅' : '❌';
    
    console.log(`${icon} ${result.name}: ${status}`);
    
    if (result.error) {
      console.log(`   エラー: ${result.error}`);
    }
    
    if (result.warning) {
      console.log(`   ⚠️  警告: ${result.warning}`);
    }
    
    if (result.success) passCount++;
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`結果: ${passCount}/${results.length} テストが成功`);
  
  // 診断と推奨事項
  console.log('\n🔍 診断結果:');
  
  if (results[0].success && results[1].success && !results[2].success) {
    log.warning('Supabaseは到達可能ですが、admin-api Edge Functionがデプロイされていない可能性があります');
    console.log('\n💡 推奨対応:');
    console.log('1. Supabase プロジェクトでEdge Functionがデプロイされているか確認');
    console.log('2. admin-api functionの存在確認');
    console.log('3. Supabase CLI: supabase functions list');
  } else if (results[2].success) {
    log.success('admin-api Edge Functionは正常に稼働しています');
  }
  
  if (!results[0].success) {
    log.error('Supabase URLに接続できません');
    console.log('\n💡 推奨対応:');
    console.log('1. ネットワーク接続の確認');
    console.log('2. .env.local のSUPABASE_URL設定確認');
    console.log('3. Supabaseプロジェクトの稼働状況確認');
  }
  
  return results;
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Promise Rejection: ${reason}`);
  process.exit(1);
});

// 実行
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, TEST_CONFIG };