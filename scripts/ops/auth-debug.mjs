#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color helper functions
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Load environment variables from .env.local
async function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../../.env.local');
    const { readFile } = await import('fs/promises');
    const envContent = await readFile(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.warn(colorize('Warning: Could not load .env.local file', 'yellow'));
  }
}

// Generate admin JWT token
async function generateAdminToken() {
  const { SignJWT } = await import('jose');
  
  const adminSecret = new TextEncoder().encode(
    process.env.APPROVAL_JWT_SECRET || 'fallback-admin-secret-for-development'
  );
  
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (24 * 60 * 60); // 24時間有効

  return await new SignJWT({ role: 'admin', iat: now, exp })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(adminSecret);
}

// Format status display
function formatStatus(data) {
  if (!data.exists) {
    return colorize('存在しない', 'red');
  }
  
  if (data.is_banned) {
    const banUntil = data.banned_until ? ` (${data.banned_until}まで)` : '';
    return colorize(`BAN${banUntil}`, 'red');
  }
  
  if (!data.is_confirmed) {
    return colorize('未確認', 'yellow');
  }
  
  return colorize('OK', 'green');
}

// Format date
function formatDate(dateString) {
  if (!dateString) return colorize('なし', 'dim');
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
}

// Check auth status via API
async function checkAuthStatus(email, baseUrl) {
  try {
    const adminToken = await generateAdminToken();
    
    const response = await fetch(`${baseUrl}/api/admin/auth/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken
      },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${result.error || 'Unknown error'}`);
    }
    
    return result;
    
  } catch (error) {
    throw new Error(`認証ステータス確認に失敗しました: ${error.message}`);
  }
}

// Display results in a table format
function displayResults(email, result) {
  const { data } = result;
  
  console.log('\n' + colorize('=' .repeat(80), 'cyan'));
  console.log(colorize('🔍 認証ステータス診断結果', 'bold'));
  console.log(colorize('=' .repeat(80), 'cyan'));
  
  console.log(`📧 ${colorize('メール:', 'bold')} ${email}`);
  console.log(`🏷️  ${colorize('リクエストID:', 'bold')} ${result.requestId}`);
  console.log(`📊 ${colorize('総合ステータス:', 'bold')} ${formatStatus(data)}`);
  
  console.log('\n' + colorize('詳細情報:', 'bold'));
  console.log(colorize('-'.repeat(50), 'dim'));
  
  // Basic status
  console.log(`ユーザー存在: ${data.exists ? colorize('✓', 'green') : colorize('✗', 'red')}`);
  
  if (data.exists) {
    console.log(`メール確認: ${data.is_confirmed ? colorize('✓ 確認済み', 'green') : colorize('✗ 未確認', 'yellow')}`);
    console.log(`アカウント状態: ${data.is_banned ? colorize('BAN中', 'red') : colorize('正常', 'green')}`);
    
    console.log('\n' + colorize('タイムスタンプ:', 'bold'));
    console.log(colorize('-'.repeat(30), 'dim'));
    console.log(`作成日時: ${formatDate(data.created_at)}`);
    console.log(`確認日時: ${formatDate(data.email_confirmed_at)}`);
    console.log(`最終ログイン: ${formatDate(data.last_sign_in_at)}`);
    
    if (data.banned_until) {
      console.log(`BAN期限: ${formatDate(data.banned_until)}`);
    }
    
    // Identity information
    if (data.identities && data.identities.length > 0) {
      console.log('\n' + colorize('認証方法:', 'bold'));
      console.log(colorize('-'.repeat(30), 'dim'));
      data.identities.forEach((identity, index) => {
        console.log(`${index + 1}. ${identity.provider || 'unknown'} (${identity.identity_data?.email || 'N/A'})`);
      });
    }
    
    // Metadata (if any interesting data)
    if (data.user_metadata && Object.keys(data.user_metadata).length > 0) {
      console.log('\n' + colorize('ユーザーメタデータ:', 'bold'));
      console.log(colorize('-'.repeat(30), 'dim'));
      console.log(JSON.stringify(data.user_metadata, null, 2));
    }
  }
  
  console.log('\n' + colorize('=' .repeat(80), 'cyan'));
  
  // Action recommendations
  if (!data.exists) {
    console.log(colorize('💡 推奨アクション:', 'yellow'));
    console.log('   • ユーザーが存在しません。サインアップが必要です。');
  } else if (data.is_banned) {
    console.log(colorize('⚠️  警告:', 'red'));
    console.log('   • このユーザーはBANされています。管理者による解除が必要です。');
  } else if (!data.is_confirmed) {
    console.log(colorize('💡 推奨アクション:', 'yellow'));
    console.log('   • メール確認が未完了です。確認メールの再送信を検討してください。');
  } else {
    console.log(colorize('✅ 状態良好:', 'green'));
    console.log('   • 認証に問題はありません。他の要因を確認してください。');
  }
  
  console.log('\n');
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let email = null;
  let baseUrl = null;
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' && i + 1 < args.length) {
      email = args[i + 1];
      i++; // Skip next argument as it's the email value
    } else if (arg === '--url' && i + 1 < args.length) {
      baseUrl = args[i + 1];
      i++; // Skip next argument as it's the URL value
    } else if (arg === '--help' || arg === '-h') {
      console.log(colorize('🔍 認証ステータス診断ツール', 'bold'));
      console.log('\n使用方法:');
      console.log('  npm run debug:auth -- --email <email> [--url <base-url>]');
      console.log('  node scripts/ops/auth-debug.mjs --email <email> [--url <base-url>]');
      console.log('\nオプション:');
      console.log('  --email <email>    診断対象のメールアドレス (必須)');
      console.log('  --url <base-url>   ベースURL (デフォルト: http://localhost:3000)');
      console.log('  --help, -h         このヘルプを表示');
      console.log('\n例:');
      console.log('  npm run debug:auth -- --email user@example.com');
      console.log('  npm run debug:auth -- --email user@example.com --url https://aiohub.jp');
      return;
    }
  }
  
  if (!email) {
    console.error(colorize('❌ エラー: --email オプションが必要です', 'red'));
    console.log('\n使用方法: npm run debug:auth -- --email <email>');
    console.log('ヘルプ: npm run debug:auth -- --help');
    process.exit(1);
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(colorize('❌ エラー: 無効なメールアドレス形式です', 'red'));
    process.exit(1);
  }
  
  // Load environment and set default base URL
  await loadEnv();
  
  if (!baseUrl) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
  
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/$/, '');
  
  console.log(colorize('🚀 認証ステータス診断を開始します...', 'blue'));
  console.log(`📧 対象メール: ${email}`);
  console.log(`🌐 ベースURL: ${baseUrl}`);
  
  try {
    const result = await checkAuthStatus(email, baseUrl);
    displayResults(email, result);
    
  } catch (error) {
    console.error(colorize(`❌ エラー: ${error.message}`, 'red'));
    
    // Suggest troubleshooting steps
    console.log('\n' + colorize('💡 トラブルシューティング:', 'yellow'));
    console.log('   • サーバーが起動していることを確認してください');
    console.log('   • 環境変数 APPROVAL_JWT_SECRET が設定されていることを確認してください');
    console.log('   • 正しいベースURLを指定してください (--url オプション)');
    console.log('   • ネットワーク接続を確認してください');
    
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error(colorize(`予期しないエラー: ${error.message}`, 'red'));
  process.exit(1);
});