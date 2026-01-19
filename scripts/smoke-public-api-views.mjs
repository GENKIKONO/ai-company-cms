#!/usr/bin/env node
/**
 * 🔥 Public API Views Smoke Test
 *
 * VIEW経由の公開APIが正常動作することを確認するスモークテスト
 *
 * 使用方法:
 *   BASE_URL=https://aiohub.jp node scripts/smoke-public-api-views.mjs
 *   BASE_URL=http://localhost:3000 node scripts/smoke-public-api-views.mjs
 *
 * チェック項目:
 * 1. 各エンドポイントが200を返すこと
 * 2. 禁止キーがレスポンスに含まれないこと
 */

// 禁止キー（organizationレベル）
const BLOCKED_ORGANIZATION_KEYS = [
  'created_by',
  'user_id',
  'feature_flags',
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'partner_id',
  'trial_end',
  'data_status',
  'verified_by',
  'verified_at',
  'verification_source',
  'content_hash',
  'source_urls',
  'archived',
  'deleted_at',
];

// テスト対象エンドポイント
const TEST_ENDPOINTS = [
  {
    path: '/api/public/organizations/luxucare',
    description: '組織詳細API',
    checkBlockedKeys: true,
    dataPath: 'data.organization'
  },
  {
    path: '/api/public/organizations',
    description: '組織一覧API',
    checkBlockedKeys: true,
    dataPath: 'data[0]'
  },
  {
    path: '/api/public/stats',
    description: '統計API',
    checkBlockedKeys: false
  }
];

const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL;

if (!BASE_URL) {
  console.error('❌ BASE_URL または NEXT_PUBLIC_APP_URL を設定してください');
  console.error('例: BASE_URL=https://aiohub.jp node scripts/smoke-public-api-views.mjs');
  process.exit(1);
}

console.log('🔥 Public API Views Smoke Test\n');
console.log('='.repeat(60));
console.log(`Base URL: ${BASE_URL}\n`);

let hasErrors = false;
let passed = 0;
let failed = 0;

/**
 * オブジェクト内に禁止キーが含まれているかチェック
 */
function findBlockedKeys(obj, blockedKeys) {
  if (!obj || typeof obj !== 'object') return [];
  return blockedKeys.filter(key => key in obj);
}

/**
 * データパスからオブジェクトを取得
 */
function getDataByPath(obj, path) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return null;
    current = current[part];
  }
  return current;
}

async function runTests() {
  for (const endpoint of TEST_ENDPOINTS) {
    const url = `${BASE_URL}${endpoint.path}`;
    console.log(`\n📍 ${endpoint.description}`);
    console.log(`   ${url}`);

    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.log(`   ❌ Status: ${response.status} ${response.statusText}`);
        hasErrors = true;
        failed++;
        continue;
      }

      console.log(`   ✅ Status: ${response.status}`);

      const json = await response.json();

      // 禁止キーチェック
      if (endpoint.checkBlockedKeys && endpoint.dataPath) {
        const targetData = getDataByPath(json, endpoint.dataPath);
        if (targetData) {
          const foundBlockedKeys = findBlockedKeys(targetData, BLOCKED_ORGANIZATION_KEYS);
          if (foundBlockedKeys.length > 0) {
            console.log(`   ❌ 禁止キー検出: ${foundBlockedKeys.join(', ')}`);
            hasErrors = true;
            failed++;
            continue;
          }
          console.log('   ✅ 禁止キーなし');
        }
      }

      passed++;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      hasErrors = true;
      failed++;
    }
  }

  // サマリー
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 結果: ${passed}/${TEST_ENDPOINTS.length} 成功`);

  if (hasErrors) {
    console.log('❌ 一部のテストが失敗しました');
    process.exit(1);
  } else {
    console.log('✅ 全てのテストに合格しました');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
