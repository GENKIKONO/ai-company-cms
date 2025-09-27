#!/usr/bin/env node

/**
 * クイック認証APIテスト
 * /api/my/organization エンドポイントの基本動作確認
 * 
 * Created: 2025-09-27
 * Purpose: 401 Unauthorized issues の迅速な検証
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TIMEOUT = 10000;

console.log('⚡ Quick Auth API テスト');
console.log(`🌐 対象: ${BASE_URL}\n`);

/**
 * HTTPリクエスト実行
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
        'User-Agent': 'Quick-Auth-Test/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
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
          responseTime,
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
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

/**
 * 診断APIテスト
 */
async function testDiagnostics() {
  console.log('📊 診断APIテスト...');
  
  const tests = [
    { path: '/api/diag/session', name: 'セッション診断' },
    { path: '/api/diag/auth-context', name: '認証コンテキスト' },
  ];
  
  for (const test of tests) {
    const result = await makeRequest(`${BASE_URL}${test.path}`);
    
    if (!result.success) {
      console.log(`❌ ${test.name}: 接続失敗 (${result.error})`);
      continue;
    }
    
    if (result.statusCode === 200) {
      console.log(`✅ ${test.name}: OK (${result.responseTime}ms)`);
      if (result.data?.authenticated !== undefined) {
        console.log(`   認証状態: ${result.data.authenticated ? '認証済み' : '未認証'}`);
      }
    } else {
      console.log(`⚠️  ${test.name}: ステータス ${result.statusCode}`);
    }
  }
}

/**
 * 組織APIテスト
 */
async function testOrganizationAPI() {
  console.log('\n🏢 組織APIテスト...');
  
  // GET テスト
  console.log('📖 GET /api/my/organization');
  const getResult = await makeRequest(`${BASE_URL}/api/my/organization`);
  
  if (!getResult.success) {
    console.log(`❌ 接続失敗: ${getResult.error}`);
    return false;
  }
  
  console.log(`📊 ステータス: ${getResult.statusCode} (${getResult.responseTime}ms)`);
  
  if (getResult.statusCode === 401) {
    const errorData = getResult.data;
    if (errorData && errorData.code === 'UNAUTHORIZED' && errorData.reason) {
      console.log(`✅ 認証制御正常: ${errorData.reason}`);
    } else {
      console.log(`⚠️  401レスポンス形式要確認: ${JSON.stringify(errorData)}`);
    }
  } else if (getResult.statusCode === 200) {
    console.log(`⚠️  認証なしでアクセス成功 - 要確認`);
    console.log(`📄 データ: ${JSON.stringify(getResult.data, null, 2)}`);
  } else {
    console.log(`❓ 予期しないステータス: ${getResult.statusCode}`);
    console.log(`📄 レスポンス: ${JSON.stringify(getResult.data, null, 2)}`);
  }
  
  // POST テスト
  console.log('\n✏️  POST /api/my/organization');
  const postResult = await makeRequest(`${BASE_URL}/api/my/organization`, {
    method: 'POST',
    body: {
      name: 'Quick Test Organization',
      slug: 'quick-test-org',
      description: 'Quick test'
    }
  });
  
  if (!postResult.success) {
    console.log(`❌ 接続失敗: ${postResult.error}`);
    return false;
  }
  
  console.log(`📊 ステータス: ${postResult.statusCode} (${postResult.responseTime}ms)`);
  
  if (postResult.statusCode === 401) {
    const errorData = postResult.data;
    if (errorData && errorData.code === 'UNAUTHORIZED' && errorData.reason) {
      console.log(`✅ 認証制御正常: ${errorData.reason}`);
      return true;
    } else {
      console.log(`⚠️  401レスポンス形式要確認: ${JSON.stringify(errorData)}`);
      return false;
    }
  } else if (postResult.statusCode === 201) {
    console.log(`⚠️  認証なしで組織作成成功 - 要確認`);
    console.log(`📄 データ: ${JSON.stringify(postResult.data, null, 2)}`);
    return false;
  } else {
    console.log(`❓ 予期しないステータス: ${postResult.statusCode}`);
    console.log(`📄 レスポンス: ${JSON.stringify(postResult.data, null, 2)}`);
    return false;
  }
}

/**
 * メイン実行
 */
async function main() {
  await testDiagnostics();
  const apiTestResult = await testOrganizationAPI();
  
  console.log('\n📋 テスト結果:');
  
  if (apiTestResult) {
    console.log('✅ 認証制御が正常に動作しています');
    console.log('📝 次のステップ:');
    console.log('   1. ブラウザでログイン後のテスト実行');
    console.log('   2. E2E完全テストの実行: node scripts/e2e-single-org-auth.mjs');
    console.log('   3. 本番環境での検証');
    return true;
  } else {
    console.log('❌ 認証制御に問題があります');
    console.log('🔧 確認事項:');
    console.log('   1. サーバーが起動しているか');
    console.log('   2. Supabase接続設定');
    console.log('   3. RLSポリシーの適用状況');
    console.log('   4. Cookie設定とセキュリティ設定');
    return false;
  }
}

main()
  .then(success => {
    console.log(`\n🏁 テスト${success ? '成功' : '失敗'}で終了`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 予期しないエラー:', error);
    process.exit(1);
  });