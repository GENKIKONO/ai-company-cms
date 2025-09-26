#!/usr/bin/env node

/**
 * Supabase設定検証スクリプト
 * 管理APIキーなしでできる範囲でSupabaseの設定を確認
 * 人手チェック用のガイドも出力
 */

import { config } from 'dotenv';
// Node.js 18+ の組み込み fetch を使用

// .env.local を読み込み
try {
  config({ path: '.env.local' });
} catch (err) {
  // ignore
}

console.log('🔍 Supabase設定検証を開始...\n');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let allPassed = true;
const results = [];

function addResult(check, status, message, details = null) {
  results.push({ check, status, message, details });
  if (status === 'FAIL') allPassed = false;
}

// 基本設定確認
console.log('📋 基本設定確認');
console.log('='.repeat(50));

if (!SUPABASE_URL) {
  addResult('Supabase URL', 'FAIL', 'NEXT_PUBLIC_SUPABASE_URL が設定されていません');
} else if (!SUPABASE_URL.includes('chyicolujwhkycpkxbej')) {
  addResult('Supabase URL', 'FAIL', '想定外のSupabaseプロジェクトです');
} else {
  addResult('Supabase URL', 'PASS', 'https://chyicolujwhkycpkxbej.supabase.co');
}

if (!ANON_KEY) {
  addResult('Anon Key', 'FAIL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません');
} else if (!ANON_KEY.startsWith('eyJ')) {
  addResult('Anon Key', 'FAIL', 'JWT形式ではありません');
} else {
  addResult('Anon Key', 'PASS', 'JWT形式で設定されています');
}

if (!SERVICE_ROLE_KEY) {
  addResult('Service Role Key', 'FAIL', 'SUPABASE_SERVICE_ROLE_KEY が設定されていません');
} else if (!SERVICE_ROLE_KEY.startsWith('eyJ')) {
  addResult('Service Role Key', 'FAIL', 'JWT形式ではありません');
} else if (SERVICE_ROLE_KEY === ANON_KEY) {
  addResult('Service Role Key', 'FAIL', 'Anon Keyと同じ値になっています');
} else {
  addResult('Service Role Key', 'PASS', 'JWT形式で正しく設定されています');
}

// ネットワーク接続確認
console.log('\\n🌐 ネットワーク接続確認');
console.log('='.repeat(50));

async function checkSupabaseConnection() {
  if (!SUPABASE_URL || !ANON_KEY) {
    addResult('基本接続', 'SKIP', '環境変数が不足しているためスキップ');
    return;
  }

  try {
    // 基本的なヘルスチェック
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });

    if (response.status === 200) {
      addResult('REST API接続', 'PASS', 'Supabase REST APIに正常接続');
    } else {
      addResult('REST API接続', 'FAIL', `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    addResult('REST API接続', 'FAIL', `接続エラー: ${error.message}`);
  }

  try {
    // auth endpoint の確認
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': ANON_KEY
      }
    });

    if (authResponse.ok) {
      const authSettings = await authResponse.json();
      addResult('Auth API接続', 'PASS', 'Supabase Auth APIに正常接続');
      
      // external oauth providers の確認
      if (authSettings.external) {
        const providers = Object.keys(authSettings.external).filter(k => authSettings.external[k]);
        if (providers.length > 0) {
          addResult('OAuth設定', 'INFO', `設定済みプロバイダ: ${providers.join(', ')}`);
        }
      }
    } else {
      addResult('Auth API接続', 'FAIL', `HTTP ${authResponse.status}: Auth API接続失敗`);
    }
  } catch (error) {
    addResult('Auth API接続', 'FAIL', `Auth接続エラー: ${error.message}`);
  }
}

// データベーステーブル存在確認（可能な範囲で）
async function checkDatabaseTables() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    addResult('テーブル確認', 'SKIP', 'Service Role Keyが不足しているためスキップ');
    return;
  }

  try {
    // app_usersテーブルの存在確認
    const response = await fetch(`${SUPABASE_URL}/rest/v1/app_users?select=id&limit=0`, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    });

    if (response.status === 200) {
      addResult('app_users テーブル', 'PASS', 'app_usersテーブルが存在し、アクセス可能');
    } else if (response.status === 404) {
      addResult('app_users テーブル', 'FAIL', 'app_usersテーブルが存在しません');
    } else if (response.status === 401 || response.status === 403) {
      addResult('app_users テーブル', 'FAIL', 'Service Role Keyの権限が不足しています');
    } else {
      addResult('app_users テーブル', 'WARN', `HTTP ${response.status}: 予期しないレスポンス`);
    }
  } catch (error) {
    addResult('app_users テーブル', 'FAIL', `接続エラー: ${error.message}`);
  }
}

// 実行
await checkSupabaseConnection();
await checkDatabaseTables();

// 結果出力
console.log('\\n📊 検証結果');
console.log('='.repeat(50));

for (const result of results) {
  const statusIcon = {
    'PASS': '✅',
    'FAIL': '❌',
    'WARN': '⚠️',
    'INFO': '📝',
    'SKIP': '⏭️'
  }[result.status];

  console.log(`${statusIcon} ${result.check}: ${result.message}`);
  if (result.details) {
    console.log(`   ${result.details}`);
  }
}

// 人手チェック用ガイド
console.log('\\n🛠️  人手チェック用ガイド');
console.log('='.repeat(50));
console.log('以下の項目はSupabaseダッシュボードで手動確認してください：');
console.log('');

console.log('📍 Authentication → URL Configuration');
console.log('   ✓ Site URL: https://aiohub.jp');
console.log('   ✓ Redirect URLs: https://aiohub.jp/*');
console.log('   ✓ localhost が含まれていないこと');
console.log('');

console.log('📍 Authentication → Email Templates');
console.log('   ✓ Confirm signup: 日本語テンプレート設定済み');
console.log('   ✓ Reset password: 日本語テンプレート設定済み');
console.log('   ✓ {{ .ConfirmationURL }} が正しく含まれている');
console.log('');

console.log('📍 SQL Editor で以下を実行して確認:');
console.log('');
console.log('-- トリガー存在確認');
console.log('SELECT tgname FROM pg_trigger WHERE tgname = \\'on_auth_user_created\\';');
console.log('-- 期待結果: 1件');
console.log('');
console.log('-- RLSポリシー確認'); 
console.log('SELECT policyname FROM pg_policies WHERE tablename = \\'app_users\\';');
console.log('-- 期待結果: 3件のポリシー');
console.log('');
console.log('-- テーブル構造確認');
console.log('SELECT column_name FROM information_schema.columns');
console.log('WHERE table_name = \\'app_users\\' ORDER BY ordinal_position;');
console.log('-- 期待結果: id, email, role, partner_id, created_at, updated_at');

// SQL確認用クエリファイルの案内
console.log('\\n📁 SQL確認用ファイル');
console.log('='.repeat(50));
console.log('詳細な確認クエリ: supabase/sql/verify-auth-setup.sql');
console.log('↑ このファイルをSQL Editorで実行すると包括的な確認ができます');

// 総合判定
console.log('\\n🎯 総合判定');
console.log('='.repeat(50));

const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL').length;
const warnCount = results.filter(r => r.status === 'WARN').length;

console.log(`✅ PASS: ${passCount} 件`);
if (failCount > 0) {
  console.log(`❌ FAIL: ${failCount} 件`);
}
if (warnCount > 0) {
  console.log(`⚠️  WARN: ${warnCount} 件`);
}

if (allPassed && failCount === 0) {
  console.log('\\n🎉 自動確認項目はすべてPASSです！');
  console.log('上記の人手チェック項目も確認して、Supabase設定を完了させてください。');
  process.exit(0);
} else {
  console.log('\\n⚠️  問題が検出されました。');
  console.log('FAILした項目を修正してから再度実行してください。');
  process.exit(1);
}