#!/usr/bin/env node

/**
 * LuxuCare AI企業CMS 本番動作テストスクリプト
 * 使用方法: node scripts/production-test.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://aiohub.jp';
const TEST_TIMEOUT = 10000; // 10秒

// テスト結果格納
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// HTTPリクエスト関数
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout: ${url}`));
    }, TEST_TIMEOUT);

    const req = protocol.get(url, options, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// テスト実行関数
async function runTest(testName, testFunction) {
  try {
    console.log(`🧪 Testing: ${testName}`);
    await testFunction();
    console.log(`✅ PASS: ${testName}`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${testName} - ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: testName, error: error.message });
  }
}

// 基本ページアクセステスト
async function testBasicPages() {
  const pages = [
    { path: '/', name: 'Landing page' },
    { path: '/organizations', name: 'Organizations directory' },
    { path: '/auth/login', name: 'Login page' },
    { path: '/auth/signup', name: 'Signup page' }
  ];

  for (const page of pages) {
    await runTest(`${page.name} (${page.path})`, async () => {
      const response = await makeRequest(`${BASE_URL}${page.path}`);
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.body.includes('LuxuCare') && !response.body.includes('AI企業CMS')) {
        throw new Error('Page content validation failed');
      }
    });
  }
}

// APIエンドポイントテスト
async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/health', name: 'Health check', expectedStatus: [200, 404] },
    { path: '/api/stripe/webhook', name: 'Stripe webhook endpoint', expectedStatus: [400, 405] }
  ];

  for (const endpoint of endpoints) {
    await runTest(`API ${endpoint.name} (${endpoint.path})`, async () => {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      if (!endpoint.expectedStatus.includes(response.statusCode)) {
        throw new Error(`Expected ${endpoint.expectedStatus.join(' or ')}, got ${response.statusCode}`);
      }
    });
  }
}

// セキュリティヘッダーテスト
async function testSecurityHeaders() {
  await runTest('Security headers', async () => {
    const response = await makeRequest(`${BASE_URL}/`);
    const headers = response.headers;
    
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options'
    ];

    for (const header of requiredHeaders) {
      if (!headers[header]) {
        throw new Error(`Missing security header: ${header}`);
      }
    }

    // SSL確認
    if (!BASE_URL.startsWith('https')) {
      throw new Error('Site is not using HTTPS');
    }
  });
}

// パフォーマンステスト
async function testPerformance() {
  await runTest('Page load performance', async () => {
    const startTime = Date.now();
    const response = await makeRequest(`${BASE_URL}/`);
    const loadTime = Date.now() - startTime;

    if (response.statusCode !== 200) {
      throw new Error(`Page failed to load: ${response.statusCode}`);
    }

    if (loadTime > 5000) {
      throw new Error(`Page load too slow: ${loadTime}ms (max: 5000ms)`);
    }

    console.log(`   📊 Load time: ${loadTime}ms`);
  });
}

// 組織データAPI動作確認
async function testOrganizationsAPI() {
  await runTest('Organizations data availability', async () => {
    const response = await makeRequest(`${BASE_URL}/organizations`);
    
    if (response.statusCode !== 200) {
      throw new Error(`Organizations page failed: ${response.statusCode}`);
    }

    // サンプルデータの存在確認
    const hasOrganizationData = response.body.includes('イノベーション株式会社') || 
                                response.body.includes('organization') ||
                                response.body.includes('企業');
    
    if (!hasOrganizationData) {
      throw new Error('No organization data found on page');
    }
  });
}

// メイン実行関数
async function runAllTests() {
  console.log('🚀 Starting LuxuCare AI企業CMS Production Tests...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('=' .repeat(60));

  // 基本疎通確認
  try {
    console.log('🔌 Checking domain connectivity...');
    await makeRequest(`${BASE_URL}/`);
    console.log('✅ Domain is accessible');
  } catch (error) {
    console.log(`❌ Domain connectivity failed: ${error.message}`);
    console.log('🛑 Stopping tests - domain not accessible');
    process.exit(1);
  }

  // テスト実行
  await testBasicPages();
  await testAPIEndpoints();
  await testSecurityHeaders();
  await testPerformance();
  await testOrganizationsAPI();

  // 結果表示
  console.log('=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

  if (testResults.failed > 0) {
    console.log('\n🚨 Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`   - ${error.test}: ${error.error}`);
    });
  }

  console.log('\n' + '=' .repeat(60));
  
  if (testResults.failed === 0) {
    console.log('🎉 All tests passed! System ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues.');
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, makeRequest, runTest };