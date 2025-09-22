#!/usr/bin/env node

/**
 * UAT APIエンドポイント検証スクリプト
 * 本番環境の主要エンドポイントが正しく応答するかチェック
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'https://aiohub.jp';
const TIMEOUT = 10000; // 10秒

console.log('🔌 AIO Hub UAT - APIエンドポイント検証開始\n');

let hasErrors = false;
const results = [];

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
        'User-Agent': 'AIO-Hub-UAT/1.0',
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
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
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
    
    req.end();
  });
}

/**
 * エンドポイントテスト実行
 */
async function testEndpoint(path, expectedStatus = 200, description = '') {
  const url = `${BASE_URL}${path}`;
  console.log(`📡 テスト: ${description || path}`);
  
  const result = await makeRequest(url);
  
  if (!result.success) {
    console.log(`❌ 接続失敗: ${result.error}`);
    hasErrors = true;
    results.push({
      endpoint: path,
      status: 'ERROR',
      details: result.error,
      responseTime: result.responseTime
    });
    return false;
  }
  
  const statusOK = result.statusCode === expectedStatus || 
                   (Array.isArray(expectedStatus) && expectedStatus.includes(result.statusCode));
  
  if (statusOK) {
    console.log(`✅ ステータス: ${result.statusCode} (${result.responseTime}ms)`);
    results.push({
      endpoint: path,
      status: 'OK',
      details: `${result.statusCode} - ${result.responseTime}ms`,
      responseTime: result.responseTime
    });
  } else {
    console.log(`❌ ステータス: ${result.statusCode} (期待: ${expectedStatus})`);
    hasErrors = true;
    results.push({
      endpoint: path,
      status: 'ERROR',
      details: `ステータス${result.statusCode} (期待: ${expectedStatus})`,
      responseTime: result.responseTime
    });
  }
  
  return statusOK;
}

/**
 * JSON APIテスト（認証付き）
 */
async function testJSONAPI(path, description = '') {
  const url = `${BASE_URL}${path}`;
  console.log(`🔒 認証APIテスト: ${description || path}`);
  
  const result = await makeRequest(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  if (!result.success) {
    console.log(`❌ 接続失敗: ${result.error}`);
    results.push({
      endpoint: path,
      status: 'ERROR',
      details: result.error,
      responseTime: result.responseTime
    });
    return false;
  }
  
  // 認証が必要なAPIは401を期待
  if (result.statusCode === 401) {
    console.log(`✅ 認証制御: 401 Unauthorized (${result.responseTime}ms)`);
    results.push({
      endpoint: path,
      status: 'OK',
      details: `認証制御正常 - ${result.responseTime}ms`,
      responseTime: result.responseTime
    });
    return true;
  } else if (result.statusCode === 200) {
    console.log(`⚠️  認証なしアクセス: 200 OK (${result.responseTime}ms)`);
    results.push({
      endpoint: path,
      status: 'WARNING',
      details: `認証なしでアクセス可能 - ${result.responseTime}ms`,
      responseTime: result.responseTime
    });
    return true;
  } else {
    console.log(`❌ 予期しないステータス: ${result.statusCode}`);
    results.push({
      endpoint: path,
      status: 'ERROR',
      details: `予期しないステータス: ${result.statusCode}`,
      responseTime: result.responseTime
    });
    return false;
  }
}

/**
 * メイン実行
 */
async function main() {
  console.log('📋 公開ページ確認:');
  
  // 公開ページのテスト
  const publicEndpoints = [
    { path: '/', description: 'トップページ' },
    { path: '/organizations', description: '企業一覧ページ' },
    { path: '/search', description: '検索ページ' },
    { path: '/about', description: 'About ページ' },
    { path: '/privacy', description: 'プライバシーポリシー' },
    { path: '/terms', description: '利用規約' },
  ];
  
  for (const endpoint of publicEndpoints) {
    await testEndpoint(endpoint.path, 200, endpoint.description);
    console.log('');
  }
  
  console.log('🔐 認証関連エンドポイント確認:');
  
  // 認証関連のテスト
  const authEndpoints = [
    { path: '/auth/login', description: 'ログインページ' },
    { path: '/auth/register', description: '登録ページ' },
  ];
  
  for (const endpoint of authEndpoints) {
    await testEndpoint(endpoint.path, 200, endpoint.description);
    console.log('');
  }
  
  console.log('🔒 保護されたAPIエンドポイント確認:');
  
  // 保護されたAPIのテスト（401を期待）
  const protectedAPIs = [
    { path: '/api/organizations', description: '企業API' },
    { path: '/api/organizations/create', description: '企業作成API' },
    { path: '/api/services', description: 'サービスAPI' },
    { path: '/api/user/profile', description: 'プロフィールAPI' },
  ];
  
  for (const api of protectedAPIs) {
    await testJSONAPI(api.path, api.description);
    console.log('');
  }
  
  console.log('🌐 外部連携エンドポイント確認:');
  
  // Webhook・外部連携のテスト
  const webhookEndpoints = [
    { path: '/api/stripe/webhook', expectedStatus: [200, 405], description: 'Stripe Webhook' },
    { path: '/api/resend/webhook', expectedStatus: [200, 405, 404], description: 'Resend Webhook' },
  ];
  
  for (const endpoint of webhookEndpoints) {
    await testEndpoint(endpoint.path, endpoint.expectedStatus, endpoint.description);
    console.log('');
  }
  
  console.log('📄 システムエンドポイント確認:');
  
  // システム・メタ情報のテスト
  const systemEndpoints = [
    { path: '/sitemap.xml', description: 'サイトマップ' },
    { path: '/robots.txt', description: 'robots.txt' },
    { path: '/favicon.ico', description: 'ファビコン' },
  ];
  
  for (const endpoint of systemEndpoints) {
    await testEndpoint(endpoint.path, 200, endpoint.description);
    console.log('');
  }
  
  console.log('❓ 404エラーページ確認:');
  
  // 404ページのテスト
  await testEndpoint('/non-existent-page-for-testing', 404, '存在しないページ (404テスト)');
  console.log('');
  
  // パフォーマンス分析
  console.log('⚡ パフォーマンス分析:');
  const avgResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length;
  const slowResponses = results.filter(r => r.responseTime > 2000);
  
  console.log(`📊 平均レスポンス時間: ${Math.round(avgResponseTime)}ms`);
  
  if (slowResponses.length > 0) {
    console.log(`⚠️  2秒以上のレスポンス: ${slowResponses.length}件`);
    slowResponses.forEach(r => {
      console.log(`   ${r.endpoint}: ${r.responseTime}ms`);
    });
  } else {
    console.log(`✅ すべてのエンドポイントが2秒以内で応答`);
  }
  
  // 結果サマリー
  console.log('\\n📊 検証結果サマリー:');
  const okCount = results.filter(r => r.status === 'OK').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`✅ 正常: ${okCount}件`);
  console.log(`⚠️  警告: ${warningCount}件`);
  console.log(`❌ エラー: ${errorCount}件`);
  
  if (hasErrors) {
    console.log('\\n🚨 APIエンドポイントに問題があります。以下を確認してください:');
    console.log('1. Vercelデプロイ状況');
    console.log('2. ルーティング設定 (next.config.js, pages/api等)');
    console.log('3. 環境変数設定');
    console.log('4. 外部サービス連携状況');
    console.log('\\n🔧 修正後、以下のコマンドで再検証してください:');
    console.log('npm run uat:endpoint-check\\n');
    process.exit(1);
  } else {
    console.log('\\n🎉 すべてのAPIエンドポイントが正常です！');
    console.log('次のステップ: クリティカルテストを実行してください');
    console.log('npm run uat:critical\\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('予期しないエラー:', error);
  process.exit(1);
});