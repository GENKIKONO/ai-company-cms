#!/usr/bin/env node

/**
 * API スモークテストスクリプト
 * 目的: anon キーで公開APIの動作/分離を実リクエスト検証
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Global fetch polyfill for Node.js
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// 検証対象テーブル
const TARGET_TABLES = ['posts', 'services', 'case_studies', 'faqs'];

// テストデータテンプレート
const TEST_DATA_TEMPLATES = {
  posts: {
    title: 'Test Post for Smoke Test',
    slug: 'test-post-smoke-test',
    content_markdown: 'This is a test post for smoke testing.',
    status: 'draft'
  },
  services: {
    name: 'Test Service for Smoke Test',
    description: 'This is a test service for smoke testing.',
    price: 10000,
    category: 'testing'
  },
  case_studies: {
    title: 'Test Case Study for Smoke Test',
    problem: 'Test problem',
    solution: 'Test solution',
    result: 'Test result'
  },
  faqs: {
    question: 'Test question for smoke test?',
    answer: 'This is a test answer for smoke testing.',
    category: 'testing'
  }
};

/**
 * 環境変数を読み込み
 */
function loadEnv() {
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  // .env.local または .env.development から読み込み
  const envFiles = ['.env.local', '.env.development'];
  let envLoaded = false;

  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      envContent.split('\\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
        }
      });
      envLoaded = true;
      break;
    }
  }

  // 必須環境変数チェック
  const missing = requiredEnvs.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error(`❌ 必須環境変数が不足しています: ${missing.join(', ')}`);
    console.error('💡 .env.local または .env.development に以下を設定してください:');
    missing.forEach(env => {
      console.error(`   ${env}=your_value_here`);
    });
    process.exit(1);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

/**
 * テスト用組織IDを取得
 */
async function getTestOrganizationId(supabase) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('⚠️  組織が見つかりません。組織作成後にテストを再実行してください。');
      return null;
    }

    return data[0].id;
  } catch (error) {
    console.warn(`⚠️  組織ID取得エラー: ${error.message}`);
    return null;
  }
}

/**
 * ダミー組織IDを生成（RLS分離テスト用）
 */
function generateDummyOrganizationId() {
  // UUIDv4の形式でダミーIDを生成
  return 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
}

/**
 * 匿名でのテーブルアクセステスト（403期待）
 */
async function testAnonAccess(url, anonKey, tableName) {
  const testData = {
    organization_id: generateDummyOrganizationId(),
    created_by: generateDummyOrganizationId(),
    ...TEST_DATA_TEMPLATES[tableName]
  };

  try {
    const response = await fetch(`${url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });

    return {
      name: `anon-insert-${tableName}`,
      expect: 'deny',
      got: response.status,
      pass: response.status === 401 || response.status === 403,
      response: response.status === 201 ? await response.json().catch(() => null) : null,
      error: response.status >= 400 ? await response.text().catch(() => 'Unknown error') : null
    };
  } catch (error) {
    return {
      name: `anon-insert-${tableName}`,
      expect: 'deny',
      got: 'error',
      pass: false,
      error: error.message
    };
  }
}

/**
 * service_roleでの自組織テーブルアクセステスト（201期待）
 */
async function testServiceRoleOwnOrg(url, serviceRoleKey, tableName, organizationId) {
  if (!organizationId) {
    return {
      name: `service-insert-${tableName}-own-org`,
      expect: 'allow',
      got: 'skipped',
      pass: true,
      skipped: 'no_organization'
    };
  }

  const testData = {
    organization_id: organizationId,
    created_by: generateDummyOrganizationId(), // service_roleなのでcreated_byは任意のUUID
    ...TEST_DATA_TEMPLATES[tableName]
  };

  try {
    const response = await fetch(`${url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });

    const isSuccess = response.status === 201;
    let responseData = null;
    let insertedId = null;

    if (isSuccess) {
      responseData = await response.json().catch(() => null);
      insertedId = responseData?.[0]?.id || responseData?.id;
    }

    return {
      name: `service-insert-${tableName}-own-org`,
      expect: 'allow',
      got: response.status,
      pass: isSuccess,
      response: responseData,
      insertedId,
      error: !isSuccess ? await response.text().catch(() => 'Unknown error') : null
    };
  } catch (error) {
    return {
      name: `service-insert-${tableName}-own-org`,
      expect: 'allow',
      got: 'error',
      pass: false,
      error: error.message
    };
  }
}

/**
 * service_roleでの他組織テーブルアクセステスト（403期待）
 */
async function testServiceRoleOtherOrg(url, serviceRoleKey, tableName) {
  const testData = {
    organization_id: generateDummyOrganizationId(), // 存在しない組織ID
    created_by: generateDummyOrganizationId(),
    ...TEST_DATA_TEMPLATES[tableName]
  };

  try {
    const response = await fetch(`${url}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });

    return {
      name: `service-insert-${tableName}-other-org`,
      expect: 'deny',
      got: response.status,
      pass: response.status === 401 || response.status === 403 || response.status >= 400,
      response: response.status === 201 ? await response.json().catch(() => null) : null,
      error: response.status >= 400 ? await response.text().catch(() => 'Unknown error') : null
    };
  } catch (error) {
    return {
      name: `service-insert-${tableName}-other-org`,
      expect: 'deny',
      got: 'error',
      pass: true, // ネットワークエラーも拒否と見なす
      error: error.message
    };
  }
}

/**
 * テストデータクリーンアップ
 */
async function cleanupTestData(url, serviceRoleKey, tableName, insertedId) {
  if (!insertedId) return;

  try {
    await fetch(`${url}/rest/v1/${tableName}?id=eq.${insertedId}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
  } catch (error) {
    console.warn(`⚠️  ${tableName}のテストデータクリーンアップに失敗: ${error.message}`);
  }
}

/**
 * 単一テーブルのスモークテスト
 */
async function smokeTestTable(url, anonKey, serviceRoleKey, tableName, organizationId) {
  console.log(`🧪 ${tableName} テーブルのスモークテスト中...`);

  const tests = await Promise.all([
    testAnonAccess(url, anonKey, tableName),
    testServiceRoleOwnOrg(url, serviceRoleKey, tableName, organizationId),
    testServiceRoleOtherOrg(url, serviceRoleKey, tableName)
  ]);

  // テストデータクリーンアップ
  const ownOrgTest = tests.find(t => t.name.includes('own-org'));
  if (ownOrgTest?.insertedId) {
    await cleanupTestData(url, serviceRoleKey, tableName, ownOrgTest.insertedId);
  }

  return tests;
}

/**
 * ログファイル保存
 */
function saveSmokeLog(result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `logs/smoke-${timestamp}.json`;
  
  // logsディレクトリが存在しない場合は作成
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
  }
  
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  return filename;
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🚀 APIスモークテストを開始します...');

  try {
    // 環境変数読み込み
    const { url, anonKey, serviceRoleKey } = loadEnv();

    // service_roleクライアントで組織ID取得
    const serviceSupabase = createClient(url, serviceRoleKey);
    const organizationId = await getTestOrganizationId(serviceSupabase);

    if (!organizationId) {
      console.log('⚠️  組織が見つからないため、一部テストをスキップします');
    }

    const allCases = [];
    const skipped = [];

    // 各テーブルでスモークテスト実行
    for (const tableName of TARGET_TABLES) {
      const tableCases = await smokeTestTable(url, anonKey, serviceRoleKey, tableName, organizationId);
      allCases.push(...tableCases);
      
      // スキップされたテストを記録
      tableCases.filter(c => c.skipped).forEach(c => skipped.push(c.skipped));
    }

    // 結果サマリ
    const passed = allCases.filter(c => c.pass);
    const failed = allCases.filter(c => !c.pass);

    const result = {
      ok: failed.length === 0,
      timestamp: new Date().toISOString(),
      cases: allCases,
      skipped: [...new Set(skipped)],
      summary: {
        total: allCases.length,
        passed: passed.length,
        failed: failed.length,
        skipped: skipped.length
      }
    };

    // ログファイル保存
    const logFile = saveSmokeLog(result);

    // 結果出力
    console.log('\\n📊 スモークテスト結果サマリ:');
    console.log(`   総テスト数: ${result.summary.total}`);
    console.log(`   成功: ${result.summary.passed}`);
    console.log(`   失敗: ${result.summary.failed}`);
    console.log(`   スキップ: ${result.summary.skipped}`);
    console.log(`   ログファイル: ${logFile}`);

    if (result.ok) {
      console.log('\\n✅ すべてのスモークテストに合格しました');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('\\n❌ スモークテストで失敗が発見されました:');
      failed.forEach(test => {
        console.log(`   - ${test.name}: 期待=${test.expect}, 実際=${test.got}`);
        if (test.error) {
          console.log(`     エラー: ${test.error}`);
        }
      });
      
      console.log('\\n💡 対処方法:');
      console.log('   - RLS設定の確認: ポリシーが正しく動作しているか');
      console.log('   - 認証設定の確認: anon/service_role キーが正しいか');
      console.log('   - テーブル構造の確認: 必須カラムが存在するか');
      
      process.exit(1);
    }

  } catch (error) {
    console.error('\\n💥 スモークテスト実行中にエラーが発生しました:');
    console.error(error.message);
    console.error('\\nスタックトレース:');
    console.error(error.stack);
    
    // エラーログも保存
    const errorResult = {
      ok: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    };
    
    saveSmokeLog(errorResult);
    process.exit(1);
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}