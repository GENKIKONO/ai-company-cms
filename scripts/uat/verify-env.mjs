#!/usr/bin/env node

/**
 * UAT環境変数検証スクリプト
 * 本番環境の必要な環境変数が正しく設定されているかチェック
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const REQUIRED_ENV_VARS = {
  'NEXTAUTH_URL': {
    expected: 'https://aiohub.jp',
    description: 'NextAuth認証URL（本番）'
  },
  'NEXTAUTH_SECRET': {
    validation: (val) => val && val.length >= 32,
    description: 'NextAuth秘密鍵（32文字以上）'
  },
  'STRIPE_SECRET_KEY': {
    validation: (val) => val && val.startsWith('sk_live_'),
    description: 'Stripe本番シークレットキー'
  },
  'STRIPE_WEBHOOK_SECRET': {
    validation: (val) => val && val.startsWith('whsec_'),
    description: 'Stripe Webhook署名検証キー'
  },
  'RESEND_API_KEY': {
    validation: (val) => val && val.startsWith('re_'),
    description: 'Resend API本番キー'
  },
  'NEXT_PUBLIC_SUPABASE_URL': {
    validation: (val) => val && val.includes('supabase') && val.startsWith('https://'),
    description: 'Supabase本番URL'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    validation: (val) => val && val.length > 100,
    description: 'Supabase本番匿名キー'
  }
};

console.log('🔧 AIO Hub UAT - 環境変数検証開始\n');

let hasErrors = false;
const results = [];

// 環境変数読み込み（.env.local優先）
const envPaths = ['.env.local', '.env'];
let envLoaded = false;

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📄 環境ファイル読み込み: ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️  .env.local または .env ファイルが見つかりません');
}

console.log('\n📋 環境変数確認結果:\n');

// 各環境変数をチェック
Object.entries(REQUIRED_ENV_VARS).forEach(([varName, config]) => {
  const value = process.env[varName];
  let status = '❌';
  let message = '';

  if (!value) {
    message = '未設定';
    hasErrors = true;
  } else if (config.expected && value !== config.expected) {
    message = `期待値と異なる: 期待="${config.expected}", 実際="${value}"`;
    hasErrors = true;
  } else if (config.validation && !config.validation(value)) {
    message = '形式が不正';
    hasErrors = true;
  } else {
    status = '✅';
    message = 'OK';
  }

  const displayValue = value ? 
    (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 
    '(未設定)';

  console.log(`${status} ${varName}`);
  console.log(`   説明: ${config.description}`);
  console.log(`   値: ${displayValue}`);
  console.log(`   状態: ${message}\n`);

  results.push({
    variable: varName,
    status: status === '✅' ? 'OK' : 'ERROR',
    message,
    value: displayValue
  });
});

// Vercel環境変数確認（オプション）
console.log('🌐 Vercel環境確認:');
try {
  const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  console.log('✅ vercel.json 読み込み成功');
} catch (e) {
  console.log('⚠️  vercel.json が見つからない、または不正です');
}

// package.jsonの確認
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json 読み込み成功');
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ build script 設定済み');
  } else {
    console.log('⚠️  build script が見つかりません');
  }
} catch (e) {
  console.log('❌ package.json の読み込みに失敗');
  hasErrors = true;
}

// 結果出力
console.log('\n📊 検証結果サマリー:');
const okCount = results.filter(r => r.status === 'OK').length;
const errorCount = results.filter(r => r.status === 'ERROR').length;

console.log(`✅ 正常: ${okCount}件`);
console.log(`❌ エラー: ${errorCount}件`);

if (hasErrors) {
  console.log('\n🚨 環境変数に問題があります。以下を確認してください:');
  console.log('1. .env.local ファイルに必要な環境変数が設定されているか');
  console.log('2. Vercel Dashboard > Settings > Environment Variables の設定');
  console.log('3. 本番環境用のキーが正しく設定されているか\n');
  
  console.log('🔧 修正後、以下のコマンドで再検証してください:');
  console.log('npm run uat:env-check\n');
  process.exit(1);
} else {
  console.log('\n🎉 すべての環境変数が正しく設定されています！');
  console.log('次のステップ: DNS/SSL確認を実行してください');
  console.log('npm run uat:dns-check\n');
  process.exit(0);
}