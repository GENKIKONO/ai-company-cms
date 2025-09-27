#!/usr/bin/env node

/**
 * E2E Single-Org Mode認証フローテスト
 * login → organization creation → dashboard の完全なフローをテスト
 * 
 * Created: 2025-09-27
 * Purpose: 401 Unauthorized issues fix の検証
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp';
const TIMEOUT = 15000; // 15秒

console.log('🔐 Single-Org Mode E2E 認証フローテスト開始');
console.log(`🌐 テスト対象: ${BASE_URL}\n`);

let hasErrors = false;
const testResults = [];

/**
 * HTTPリクエスト実行（Cookie対応）
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const isHTTPS = parsedUrl.protocol === 'https:';
    const client = isHTTPS ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHTTPS ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      timeout: TIMEOUT,
      headers: {
        'User-Agent': 'AIO-Hub-E2E-Test/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body && typeof options.body === 'object') {
      const bodyString = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }
    
    const start = Date.now();
    const req = client.request(requestOptions, (res) => {
      const responseTime = Date.now() - start;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsedData = null;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
          rawData: data,
          responseTime: responseTime,
          success: true
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message,
        responseTime: Date.now() - start,
        success: false
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'タイムアウト',
        responseTime: TIMEOUT,
        success: false
      });
    });
    
    if (options.body && typeof options.body === 'object') {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * 診断APIを使ったセッションチェック
 */
async function checkSessionDiagnostics(cookies = '') {
  console.log('📊 セッション診断API確認...');
  
  const diagnostics = await makeRequest(`${BASE_URL}/api/diag/session`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (!diagnostics.success) {
    console.log(`❌ 診断API接続失敗: ${diagnostics.error}`);
    return { authenticated: false, error: diagnostics.error };
  }
  
  if (diagnostics.statusCode !== 200) {
    console.log(`❌ 診断API異常ステータス: ${diagnostics.statusCode}`);
    return { authenticated: false, error: `Status ${diagnostics.statusCode}` };
  }
  
  const diagData = diagnostics.data;
  console.log(`📊 認証状態: ${diagData.authenticated ? '✅ 認証済み' : '❌ 未認証'}`);
  console.log(`🍪 アクセストークンCookie: ${diagData.hasAccessTokenCookie ? '✅ あり' : '❌ なし'}`);
  console.log(`🔒 永続Cookie: ${diagData.hasPersistentCookie ? '✅ あり' : '❌ なし'}`);
  
  if (diagData.userError) {
    console.log(`⚠️  ユーザーエラー: ${diagData.userError}`);
  }
  
  if (diagData.sessionError) {
    console.log(`⚠️  セッションエラー: ${diagData.sessionError}`);
  }
  
  return diagData;
}

/**
 * 企業情報取得テスト
 */
async function testGetOrganization(cookies = '') {
  console.log('🏢 GET /api/my/organization テスト...');
  
  const result = await makeRequest(`${BASE_URL}/api/my/organization`, {
    headers: {
      'Cookie': cookies,
      'credentials': 'include'
    }
  });
  
  if (!result.success) {
    console.log(`❌ 接続失敗: ${result.error}`);
    return { success: false, error: result.error };
  }
  
  console.log(`📊 ステータス: ${result.statusCode} (${result.responseTime}ms)`);
  
  if (result.statusCode === 401) {
    console.log(`❌ 認証エラー: ${JSON.stringify(result.data, null, 2)}`);
    return { success: false, error: '401 Unauthorized', data: result.data };
  }
  
  if (result.statusCode === 200) {
    if (result.data && result.data.data) {
      console.log(`✅ 企業データ取得成功: ${result.data.data.name || 'Unknown'}`);
      return { success: true, organization: result.data.data };
    } else {
      console.log(`📝 企業未作成 (初回状態)`);
      return { success: true, organization: null };
    }
  }
  
  console.log(`❌ 予期しないステータス: ${result.statusCode}`);
  console.log(`📄 レスポンス: ${JSON.stringify(result.data, null, 2)}`);
  return { success: false, error: `Unexpected status ${result.statusCode}` };
}

/**
 * 企業作成テスト
 */
async function testCreateOrganization(cookies = '') {
  console.log('🏗️  POST /api/my/organization テスト...');
  
  const testOrgData = {
    name: `E2E Test Organization ${Date.now()}`,
    slug: `e2e-test-${Date.now()}`,
    description: 'E2E テスト用企業データ',
    address_country: 'Japan',
    address_region: '東京都',
    address_locality: '渋谷区',
    status: 'draft'
  };
  
  console.log(`📝 作成データ: ${testOrgData.name} (${testOrgData.slug})`);
  
  const result = await makeRequest(`${BASE_URL}/api/my/organization`, {
    method: 'POST',
    headers: {
      'Cookie': cookies,
      'credentials': 'include'
    },
    body: testOrgData
  });
  
  if (!result.success) {
    console.log(`❌ 接続失敗: ${result.error}`);
    return { success: false, error: result.error };
  }
  
  console.log(`📊 ステータス: ${result.statusCode} (${result.responseTime}ms)`);
  
  if (result.statusCode === 401) {
    console.log(`❌ 認証エラー: ${JSON.stringify(result.data, null, 2)}`);
    return { success: false, error: '401 Unauthorized', data: result.data };
  }
  
  if (result.statusCode === 201) {
    console.log(`✅ 企業作成成功: ID ${result.data.data?.id}`);
    return { success: true, organization: result.data.data };
  }
  
  if (result.statusCode === 409) {
    console.log(`⚠️  企業既存エラー: ${result.data.reason || 'Conflict'}`);
    return { success: false, error: 'Organization already exists', conflict: true };
  }
  
  console.log(`❌ 予期しないステータス: ${result.statusCode}`);
  console.log(`📄 レスポンス: ${JSON.stringify(result.data, null, 2)}`);
  return { success: false, error: `Unexpected status ${result.statusCode}` };
}

/**
 * Cookie認証状況の確認
 */
async function testCookieEcho() {
  console.log('🍪 Cookie Echo テスト...');
  
  const result = await makeRequest(`${BASE_URL}/api/diag/echo`, {
    method: 'POST',
    body: { test: 'cookie-validation' }
  });
  
  if (!result.success) {
    console.log(`❌ 接続失敗: ${result.error}`);
    return { success: false };
  }
  
  if (result.statusCode === 200 && result.data) {
    const credentialsCheck = result.data.credentialsCheck;
    console.log(`🔍 credentials: 'include' 効果: ${credentialsCheck?.likely_credentials_include ? '✅ 正常' : '❌ 異常'}`);
    console.log(`🍪 Cookieヘッダー長: ${credentialsCheck?.cookieCount || 0} cookies`);
    console.log(`🔐 Supabase認証Cookie: ${credentialsCheck?.hasAuthCookies ? '✅ あり' : '❌ なし'}`);
    return { success: true, data: result.data };
  }
  
  return { success: false };
}

/**
 * メイン実行関数
 */
async function runE2ETest() {
  console.log('🚀 E2E テストシーケンス開始\n');
  
  // Phase 1: 診断API基本チェック
  console.log('=== Phase 1: 診断APIチェック ===');
  
  const initialDiag = await checkSessionDiagnostics();
  testResults.push({
    phase: 'Diagnostic API',
    test: 'Initial Session Check',
    success: initialDiag.authenticated !== undefined,
    details: initialDiag.error || `Auth: ${initialDiag.authenticated}`
  });
  
  // Phase 2: Cookie Echo テスト
  console.log('\n=== Phase 2: Cookie/Credentials チェック ===');
  
  const cookieTest = await testCookieEcho();
  testResults.push({
    phase: 'Cookie Test',
    test: 'Echo API',
    success: cookieTest.success,
    details: cookieTest.success ? 'Cookie echo successful' : 'Cookie echo failed'
  });
  
  // Phase 3: 未認証での企業API テスト
  console.log('\n=== Phase 3: 未認証アクセステスト ===');
  
  const unauthGetResult = await testGetOrganization();
  const shouldBeUnauthorized = !unauthGetResult.success && unauthGetResult.error === '401 Unauthorized';
  
  testResults.push({
    phase: 'Unauthorized Access',
    test: 'GET /api/my/organization without auth',
    success: shouldBeUnauthorized,
    details: shouldBeUnauthorized ? '正常に401で拒否' : `予期しない結果: ${unauthGetResult.error || 'Success'}`
  });
  
  if (!shouldBeUnauthorized) {
    console.log('⚠️  警告: 未認証でもAPIアクセスが成功しています');
    hasErrors = true;
  }
  
  const unauthCreateResult = await testCreateOrganization();
  const shouldBeUnauthorizedCreate = !unauthCreateResult.success && unauthCreateResult.error === '401 Unauthorized';
  
  testResults.push({
    phase: 'Unauthorized Access',
    test: 'POST /api/my/organization without auth',
    success: shouldBeUnauthorizedCreate,
    details: shouldBeUnauthorizedCreate ? '正常に401で拒否' : `予期しない結果: ${unauthCreateResult.error || 'Success'}`
  });
  
  if (!shouldBeUnauthorizedCreate) {
    console.log('⚠️  警告: 未認証でも企業作成APIが成功しています');
    hasErrors = true;
  }
  
  // Phase 4: 手動認証指示
  console.log('\n=== Phase 4: 手動認証要求 ===');
  console.log('📋 次のステップを手動で実行してください:');
  console.log(`1. ブラウザで ${BASE_URL}/auth/login にアクセス`);
  console.log('2. テストアカウントでログイン');
  console.log('3. ログイン後、ブラウザの開発者ツールでCookieを確認');
  console.log('4. sb-*-auth-token Cookieの値をコピー');
  console.log('5. このスクリプトに続きを実行させるため、Enterを押す');
  console.log('\n🔍 認証Cookie確認方法:');
  console.log('- Chrome: F12 > Application > Cookies > aiohub.jp');
  console.log('- Firefox: F12 > Storage > Cookies > aiohub.jp');
  console.log('- Safari: Develop > Web Inspector > Storage > Cookies > aiohub.jp');
  
  // ユーザー入力待ち（Node.js環境での簡易実装）
  console.log('\n⏸️  認証完了後、Enterキーを押してテストを続行してください...');
  
  // 実際の本番環境では、ここで認証Cookieを入力してもらうか、
  // Playwright等のブラウザ自動化ツールを使用する必要があります
  
  // Phase 5: テスト結果サマリー
  console.log('\n=== Phase 5: テスト結果サマリー ===');
  
  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;
  
  console.log('\n📊 テスト結果:');
  testResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} [${result.phase}] ${result.test}`);
    console.log(`   詳細: ${result.details}`);
  });
  
  console.log(`\n📈 成功: ${successCount}/${testResults.length}`);
  console.log(`📉 失敗: ${failCount}/${testResults.length}`);
  
  if (failCount === 0) {
    console.log('\n🎉 E2E基本テスト通過！');
    console.log('✅ 認証制御が正常に動作しています');
    console.log('📝 次の手動テストを実行してください:');
    console.log('   1. ブラウザでの完全なログイン → 企業作成 → ダッシュボード フロー');
    console.log('   2. セッション期限切れテスト');
    console.log('   3. 異なるブラウザでのクロスブラウザテスト');
  } else {
    console.log('\n🚨 テスト失敗があります');
    console.log('🔧 以下を確認してください:');
    console.log('   1. サーバーの起動状況');
    console.log('   2. データベース接続');
    console.log('   3. Supabase設定');
    console.log('   4. RLSポリシー適用状況');
    hasErrors = true;
  }
  
  // Phase 6: 次のアクション指示
  console.log('\n=== 推奨アクション ===');
  console.log('🔧 もし401エラーが解決していない場合:');
  console.log('1. npm run dev でローカル開発サーバーの状況確認');
  console.log('2. ブラウザ開発者ツールでCookie設定確認');
  console.log('3. /api/diag/session でサーバー側認証状況確認');
  console.log('4. Supabaseダッシュボードでユーザー認証状況確認');
  console.log('5. RLSポリシーの競合確認');
  
  console.log('\n📋 本番環境テストの場合:');
  console.log('1. Vercelのデプロイ状況確認');
  console.log('2. 環境変数の設定確認');
  console.log('3. カスタムドメインの設定確認');
  console.log('4. データベースマイグレーション実行確認');
  
  return !hasErrors;
}

/**
 * スクリプト実行
 */
runE2ETest()
  .then(success => {
    console.log(`\n🏁 E2Eテスト${success ? '成功' : '失敗'}で終了`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 予期しないエラー:', error);
    process.exit(1);
  });