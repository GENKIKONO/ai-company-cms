#!/usr/bin/env node

/**
 * 環境変数検証スクリプト
 * 必須環境変数の存在と値フォーマットをチェック
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';

// .env.local を読み込み（存在する場合）
try {
  config({ path: '.env.local' });
} catch (err) {
  // .env.localが存在しない場合は無視
}

console.log('🔍 環境変数検証を開始...\n');

// 検証結果を格納
const results = [];
let allPassed = true;

// 検証関数
function verifyEnv(key, description, validators = []) {
  const value = process.env[key];
  const result = {
    key,
    description,
    exists: !!value,
    value: value ? value.substring(0, 20) + '...' : null,
    validations: []
  };

  if (!value) {
    result.status = 'MISSING';
    result.message = 'Missing required environment variable';
    allPassed = false;
  } else {
    let validationsPassed = true;
    
    for (const validator of validators) {
      const validation = validator(value);
      result.validations.push(validation);
      if (!validation.passed) {
        validationsPassed = false;
      }
    }
    
    result.status = validationsPassed ? 'PASS' : 'FAIL';
    if (!validationsPassed) {
      allPassed = false;
    }
  }
  
  results.push(result);
}

// バリデーター関数
const validators = {
  isHttpsUrl: (value) => ({
    rule: 'HTTPS URL format',
    passed: /^https:\/\//.test(value),
    message: value.startsWith('https://') ? null : 'Must start with https://'
  }),
  
  isAioHubDomain: (value) => ({
    rule: 'AIO Hub domain',
    passed: value === 'https://aiohub.jp',
    message: value === 'https://aiohub.jp' ? null : 'Must be exactly https://aiohub.jp'
  }),
  
  isSupabaseUrl: (value) => ({
    rule: 'Supabase URL format',
    passed: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(value),
    message: /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(value) ? null : 'Invalid Supabase URL format'
  }),
  
  isExpectedSupabaseProject: (value) => ({
    rule: 'Expected Supabase project',
    passed: value === 'https://chyicolujwhkycpkxbej.supabase.co',
    message: value === 'https://chyicolujwhkycpkxbej.supabase.co' ? null : 'Unexpected Supabase project'
  }),
  
  isJwtToken: (value) => ({
    rule: 'JWT token format',
    passed: /^eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*$/.test(value),
    message: /^eyJ/.test(value) ? null : 'Invalid JWT token format'
  }),
  
  isResendApiKey: (value) => ({
    rule: 'Resend API key format',
    passed: /^re_[A-Za-z0-9_]+$/.test(value),
    message: /^re_/.test(value) ? null : 'Invalid Resend API key format'
  }),
  
  isEmailAddress: (value) => ({
    rule: 'Email address format',
    passed: /^[^@]+@[^@]+\.[^@]+$/.test(value),
    message: /^[^@]+@[^@]+\.[^@]+$/.test(value) ? null : 'Invalid email address format'
  }),
  
  noLocalhost: (value) => ({
    rule: 'No localhost URLs',
    passed: !value.includes('localhost') && !value.includes('127.0.0.1'),
    message: !value.includes('localhost') && !value.includes('127.0.0.1') ? null : 'localhost URLs not allowed in production'
  })
};

// 必須環境変数の検証
console.log('📋 必須環境変数チェック');
console.log('='.repeat(50));

verifyEnv('NEXT_PUBLIC_APP_URL', 'アプリケーション URL', [
  validators.isHttpsUrl,
  validators.isAioHubDomain,
  validators.noLocalhost
]);

verifyEnv('NEXT_PUBLIC_SUPABASE_URL', 'Supabase プロジェクト URL', [
  validators.isHttpsUrl,
  validators.isSupabaseUrl,
  validators.isExpectedSupabaseProject,
  validators.noLocalhost
]);

verifyEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon キー', [
  validators.isJwtToken
]);

verifyEnv('SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role キー', [
  validators.isJwtToken
]);

// オプション環境変数の確認
console.log('\n📋 オプション環境変数チェック');
console.log('='.repeat(50));

const optionalVars = [
  {
    key: 'RESEND_API_KEY',
    description: 'Resend API キー（補助通知用）',
    validators: [validators.isResendApiKey]
  },
  {
    key: 'RESEND_FROM_EMAIL', 
    description: 'Resend 送信元メールアドレス',
    validators: [validators.isEmailAddress]
  }
];

for (const envVar of optionalVars) {
  const value = process.env[envVar.key];
  if (value) {
    verifyEnv(envVar.key, envVar.description, envVar.validators);
  } else {
    results.push({
      key: envVar.key,
      description: envVar.description,
      status: 'OPTIONAL',
      message: 'Optional variable not set (補助通知機能は無効)'
    });
  }
}

// 結果出力（表形式）
console.log('\n📊 環境変数検証結果');
console.log('='.repeat(80));
console.log('| 項目                     | ステータス | 詳細');
console.log('|--------------------------|------------|------------------------------------------');

for (const result of results) {
  const statusIcon = {
    'PASS': '✅ PASS',
    'FAIL': '❌ FAIL',
    'MISSING': '⚠️  MISS',
    'OPTIONAL': '📝 OPT '
  }[result.status];

  const detail = result.status === 'PASS' ? result.value.substring(0, 30) + '...' :
                 result.status === 'FAIL' ? result.message.substring(0, 30) + '...' :
                 result.status === 'MISSING' ? 'Required variable missing' :
                 'Optional (not set)';

  console.log(`| ${result.key.padEnd(24)} | ${statusIcon}   | ${detail}`);
}

console.log('|--------------------------|------------|------------------------------------------');

// サマリー行
const passCount = results.filter(r => r.status === 'PASS').length;
const failCount = results.filter(r => r.status === 'FAIL' || r.status === 'MISSING').length;
const optionalCount = results.filter(r => r.status === 'OPTIONAL').length;

console.log(`| 総計                     | ${passCount}✅ ${failCount}❌ ${optionalCount}📝    | Pass: ${passCount}, Fail: ${failCount}, Optional: ${optionalCount}`);
console.log('='.repeat(80));

// 総合判定
console.log('🎯 総合判定');
console.log('='.repeat(50));

console.log(`✅ PASS: ${passCount} 件`);
if (failCount > 0) {
  console.log(`❌ FAIL: ${failCount} 件`);
}
console.log(`📝 OPTIONAL: ${optionalCount} 件`);

if (allPassed) {
  console.log('\n🎉 全ての必須環境変数が正しく設定されています！');
  console.log('商用レベルデプロイの準備が完了しています。');
  process.exit(0);
} else {
  console.log('\n⚠️  環境変数の設定に問題があります。');
  console.log('上記の問題を解決してから再度実行してください。');
  process.exit(1);
}