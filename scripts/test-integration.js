#!/usr/bin/env node

/**
 * Supabase統合テストスクリプト
 * Next.js + Supabase Realtime + Edge Functions の動作確認
 */

const readline = require('readline');

// テスト設定
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  tests: [
    {
      name: 'Realtime接続テスト',
      url: '/test/realtime',
      description: 'Supabase Realtimeの接続とイベント受信をテスト'
    },
    {
      name: 'Admin API接続テスト', 
      url: '/test/admin-api',
      description: 'Edge Function (admin-api) への接続をテスト'
    },
    {
      name: 'CMS管理画面',
      url: '/admin/cms',
      description: 'Realtime統合されたCMS管理画面'
    }
  ]
};

// コンソール出力ヘルパー
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  step: (step, msg) => console.log(`\n🔸 Step ${step}: ${msg}`)
};

// APIヘルスチェック
async function checkApiHealth() {
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      log.success('Next.js APIサーバーが正常に稼働中');
      return true;
    } else {
      log.error('APIヘルスチェックが失敗');
      return false;
    }
  } catch (error) {
    log.error(`APIヘルスチェックエラー: ${error.message}`);
    return false;
  }
}

// テスト実行ガイド
function displayTestGuide() {
  console.log('\n📋 Supabase統合テスト実行ガイド\n');
  
  console.log('以下の手順でテストを実行してください:\n');
  
  TEST_CONFIG.tests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   URL: ${TEST_CONFIG.baseUrl}${test.url}`);
    console.log(`   説明: ${test.description}\n`);
  });
  
  console.log('🔍 各テストで確認すべき項目:\n');
  
  console.log('【Realtime接続テスト】');
  console.log('  ✓ 組織IDの正常取得');
  console.log('  ✓ Realtimeチャンネル接続成功');
  console.log('  ✓ posts/qa_entriesテーブルの変更監視');
  console.log('  ✓ テストデータ挿入時のリアルタイム反映');
  
  console.log('\n【Admin API接続テスト】');
  console.log('  ✓ 認証トークンの正常取得');
  console.log('  ✓ Edge Function (admin-api) への接続成功');
  console.log('  ✓ Health Check');
  console.log('  ✓ CMS Overview');
  console.log('  ✓ Site Settings CRUD操作');
  console.log('  ✓ Permission Check');
  
  console.log('\n【CMS管理画面】');
  console.log('  ✓ Realtime接続状態の表示');
  console.log('  ✓ CMSデータの表示');
  console.log('  ✓ CRUD操作後のリアルタイム更新');
  console.log('  ✓ エラーハンドリング');
}

// インタラクティブテストメニュー
async function runInteractiveTests() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise((resolve) => {
    rl.question(prompt, resolve);
  });

  try {
    console.log('\n🚀 インタラクティブテストモード\n');
    
    while (true) {
      console.log('実行したいテストを選択してください:');
      console.log('1. Realtime接続テスト');
      console.log('2. Admin API接続テスト');
      console.log('3. CMS管理画面');
      console.log('4. ブラウザで全テストページを開く');
      console.log('5. 終了');
      
      const choice = await question('\n選択 (1-5): ');
      
      switch (choice) {
        case '1':
          console.log(`\n🌐 ブラウザで開いてください: ${TEST_CONFIG.baseUrl}/test/realtime`);
          break;
        case '2':
          console.log(`\n🌐 ブラウザで開いてください: ${TEST_CONFIG.baseUrl}/test/admin-api`);
          break;
        case '3':
          console.log(`\n🌐 ブラウザで開いてください: ${TEST_CONFIG.baseUrl}/admin/cms`);
          break;
        case '4':
          console.log('\n🌐 全テストページ:');
          TEST_CONFIG.tests.forEach(test => {
            console.log(`   ${TEST_CONFIG.baseUrl}${test.url}`);
          });
          break;
        case '5':
          console.log('\nテストを終了します。');
          rl.close();
          return;
        default:
          console.log('\n❌ 無効な選択です。1-5で選択してください。');
      }
      
      console.log('\n' + '='.repeat(50));
    }

  } catch (error) {
    log.error(`テスト実行エラー: ${error.message}`);
  } finally {
    rl.close();
  }
}

// 自動化テストレポート作成
async function generateTestReport() {
  log.step(1, '自動化テストレポートを作成中...');
  
  const report = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // API基本チェック
  const healthCheck = await checkApiHealth();
  report.tests.push({
    name: 'API Health Check',
    status: healthCheck ? 'PASS' : 'FAIL',
    details: healthCheck ? 'APIサーバーが正常稼働' : 'APIサーバーエラー'
  });
  
  // 各テストページの存在確認
  for (const test of TEST_CONFIG.tests) {
    try {
      const response = await fetch(`${TEST_CONFIG.baseUrl}${test.url}`);
      const status = response.ok ? 'PASS' : 'FAIL';
      
      report.tests.push({
        name: test.name,
        status,
        details: response.ok ? 'ページ表示成功' : `HTTP ${response.status}`
      });
    } catch (error) {
      report.tests.push({
        name: test.name,
        status: 'FAIL',
        details: error.message
      });
    }
  }
  
  // レポート出力
  console.log('\n📊 テストレポート');
  console.log('='.repeat(50));
  console.log(`実行日時: ${report.timestamp}`);
  console.log();
  
  report.tests.forEach(test => {
    const statusIcon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.status}`);
    console.log(`   詳細: ${test.details}`);
  });
  
  console.log('\n' + '='.repeat(50));
  
  const passCount = report.tests.filter(t => t.status === 'PASS').length;
  const totalCount = report.tests.length;
  
  console.log(`結果: ${passCount}/${totalCount} テストが成功`);
  
  if (passCount === totalCount) {
    log.success('全テストが成功しました！');
  } else {
    log.warning(`${totalCount - passCount}個のテストが失敗しています。`);
  }
  
  return report;
}

// メイン実行
async function main() {
  console.log('🔧 Supabase統合テスト');
  console.log('='.repeat(50));
  
  // コマンドライン引数確認
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    displayTestGuide();
    return;
  }
  
  if (args.includes('--report')) {
    await generateTestReport();
    return;
  }
  
  if (args.includes('--interactive') || args.includes('-i')) {
    await runInteractiveTests();
    return;
  }
  
  // デフォルト: テストガイド表示
  log.step(1, 'サーバー稼働状況確認');
  const isHealthy = await checkApiHealth();
  
  if (!isHealthy) {
    log.error('開発サーバーが起動していません。npm run dev を実行してください。');
    process.exit(1);
  }
  
  displayTestGuide();
  
  console.log('\n🎯 テスト実行オプション:');
  console.log('  node scripts/test-integration.js --interactive  # インタラクティブモード');
  console.log('  node scripts/test-integration.js --report       # 自動テストレポート');
  console.log('  node scripts/test-integration.js --help         # ヘルプ表示');
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  log.error(`未処理のPromise拒否: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`未処理の例外: ${error.message}`);
  process.exit(1);
});

// 実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkApiHealth,
  generateTestReport,
  TEST_CONFIG
};