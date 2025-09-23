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

// Test utilities
class TestRunner {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  async test(name, testFn) {
    process.stdout.write(`📋 ${name}... `);
    
    try {
      const result = await testFn();
      if (result.success) {
        console.log(colorize('✓ PASS', 'green'));
        this.passed++;
        this.results.push({ name, status: 'PASS', details: result.details });
      } else {
        console.log(colorize('✗ FAIL', 'red'));
        this.failed++;
        this.results.push({ name, status: 'FAIL', error: result.error, details: result.details });
      }
    } catch (error) {
      console.log(colorize('✗ ERROR', 'red'));
      this.failed++;
      this.results.push({ name, status: 'ERROR', error: error.message });
    }
  }
  
  async fetch(path, options = {}) {
    const url = `${this.baseUrl}${path}`;\n    const response = await fetch(url, {\n      ...options,\n      headers: {\n        'Content-Type': 'application/json',\n        ...options.headers\n      }\n    });\n    \n    return {\n      ok: response.ok,\n      status: response.status,\n      statusText: response.statusText,\n      json: async () => {\n        try {\n          return await response.json();\n        } catch {\n          return null;\n        }\n      },\n      text: async () => {\n        try {\n          return await response.text();\n        } catch {\n          return '';\n        }\n      }\n    };\n  }\n  \n  printSummary() {\n    console.log('\\n' + colorize('='.repeat(80), 'cyan'));\n    console.log(colorize('🔍 認証システム回帰テスト結果', 'bold'));\n    console.log(colorize('='.repeat(80), 'cyan'));\n    \n    const total = this.passed + this.failed;\n    console.log(`📊 総合結果: ${colorize(this.passed, 'green')}/${total} テスト通過`);\n    \n    if (this.failed > 0) {\n      console.log(colorize(`❌ ${this.failed}件のテストが失敗しました`, 'red'));\n      console.log('\\n' + colorize('失敗したテスト:', 'red'));\n      \n      this.results.filter(r => r.status !== 'PASS').forEach(result => {\n        console.log(`  • ${result.name}: ${result.error || 'Unknown error'}`);\n        if (result.details) {\n          console.log(`    詳細: ${result.details}`);\n        }\n      });\n    } else {\n      console.log(colorize('✅ 全てのテストが成功しました!', 'green'));\n    }\n    \n    console.log('\\n' + colorize('='.repeat(80), 'cyan'));\n    return this.failed === 0;\n  }\n}\n\n// Individual test functions\nasync function createTestSuite(baseUrl) {\n  const runner = new TestRunner(baseUrl);\n  const adminToken = await generateAdminToken();\n  \n  // Test 1: Environment configuration check\n  await runner.test('環境設定確認', async () => {\n    const response = await runner.fetch('/api/ops/env-check');\n    const data = await response.json();\n    \n    if (!response.ok) {\n      return { success: false, error: `HTTP ${response.status}: ${data?.error || 'Unknown error'}` };\n    }\n    \n    if (!data.appUrlConfigured) {\n      return { success: false, error: 'NEXT_PUBLIC_APP_URL not configured' };\n    }\n    \n    if (process.env.NODE_ENV === 'production' && !data.appUrlIsProduction) {\n      return { success: false, error: 'Production environment but non-production APP_URL' };\n    }\n    \n    return { success: true, details: `APP_URL: ${data.appUrl}` };\n  });\n  \n  // Test 2: Configuration validation\n  await runner.test('設定検証API', async () => {\n    const response = await runner.fetch('/api/ops/config-check');\n    const data = await response.json();\n    \n    if (!response.ok) {\n      return { success: false, error: `HTTP ${response.status}: ${data?.error || 'Unknown error'}` };\n    }\n    \n    if (!data.success) {\n      return { success: false, error: data.error || 'Config check failed' };\n    }\n    \n    if (!data.data.supabase.connected) {\n      return { success: false, error: 'Supabase connection failed' };\n    }\n    \n    return { success: true, details: `Warnings: ${data.warnings?.length || 0}` };\n  });\n  \n  // Test 3: Admin auth status API\n  await runner.test('管理者認証API', async () => {\n    const testEmail = 'nonexistent@test.example.com';\n    \n    const response = await runner.fetch('/api/admin/auth/status', {\n      method: 'POST',\n      headers: {\n        'x-admin-token': adminToken\n      },\n      body: JSON.stringify({ email: testEmail })\n    });\n    \n    const data = await response.json();\n    \n    if (!response.ok) {\n      return { success: false, error: `HTTP ${response.status}: ${data?.error || 'Unknown error'}` };\n    }\n    \n    if (!data.success) {\n      return { success: false, error: data.error || 'Auth status check failed' };\n    }\n    \n    // For non-existent user, should return exists: false\n    if (data.data.exists !== false) {\n      return { success: false, error: 'Expected non-existent user to return exists: false' };\n    }\n    \n    return { success: true, details: `Request ID: ${data.requestId}` };\n  });\n  \n  // Test 4: Admin JWT validation\n  await runner.test('JWT認証検証', async () => {\n    // Test with invalid token\n    const response = await runner.fetch('/api/admin/auth/status', {\n      method: 'POST',\n      headers: {\n        'x-admin-token': 'invalid-token'\n      },\n      body: JSON.stringify({ email: 'test@example.com' })\n    });\n    \n    if (response.status !== 401) {\n      return { success: false, error: `Expected 401 for invalid token, got ${response.status}` };\n    }\n    \n    return { success: true, details: 'Invalid token correctly rejected' };\n  });\n  \n  // Test 5: Email resend API validation\n  await runner.test('メール再送信API', async () => {\n    const response = await runner.fetch('/api/auth/resend-confirmation', {\n      method: 'POST',\n      body: JSON.stringify({\n        email: 'invalid-email-format',\n        type: 'signup'\n      })\n    });\n    \n    const data = await response.json();\n    \n    // Should return validation error for invalid email\n    if (response.ok) {\n      return { success: false, error: 'Expected validation error for invalid email format' };\n    }\n    \n    if (data.code !== 'validation_error') {\n      return { success: false, error: `Expected validation_error, got ${data.code}` };\n    }\n    \n    return { success: true, details: 'Email validation working correctly' };\n  });\n  \n  // Test 6: Profile sync API validation\n  await runner.test('プロフィール同期API', async () => {\n    // Test without authentication\n    const response = await runner.fetch('/api/auth/sync', {\n      method: 'POST'\n    });\n    \n    if (response.status !== 401) {\n      return { success: false, error: `Expected 401 for unauthenticated request, got ${response.status}` };\n    }\n    \n    const data = await response.json();\n    \n    if (!data.requestId) {\n      return { success: false, error: 'Missing requestId in response' };\n    }\n    \n    return { success: true, details: 'Unauthenticated request correctly rejected' };\n  });\n  \n  // Test 7: Password reset API validation\n  await runner.test('パスワードリセット要求', async () => {\n    const response = await runner.fetch('/api/auth/reset-password', {\n      method: 'POST',\n      body: JSON.stringify({\n        email: 'invalid-email-format'\n      })\n    });\n    \n    // Should return validation error\n    if (response.ok) {\n      return { success: false, error: 'Expected validation error for invalid email' };\n    }\n    \n    return { success: true, details: 'Password reset validation working' };\n  });\n  \n  // Test 8: Rate limiting behavior (if implemented)\n  await runner.test('レート制限動作', async () => {\n    // This is a simple test - in practice you'd want to test actual rate limiting\n    const response = await runner.fetch('/api/auth/resend-confirmation', {\n      method: 'POST',\n      body: JSON.stringify({\n        email: 'test@example.com',\n        type: 'signup'\n      })\n    });\n    \n    // Should return some response (either success or controlled error)\n    if (response.status >= 500) {\n      return { success: false, error: `Server error: ${response.status}` };\n    }\n    \n    return { success: true, details: `Status: ${response.status}` };\n  });\n  \n  return runner;\n}\n\n// Main function\nasync function main() {\n  const args = process.argv.slice(2);\n  let baseUrl = null;\n  let verbose = false;\n  \n  for (let i = 0; i < args.length; i++) {\n    const arg = args[i];\n    if (arg === '--url' && i + 1 < args.length) {\n      baseUrl = args[i + 1];\n      i++;\n    } else if (arg === '--verbose' || arg === '-v') {\n      verbose = true;\n    } else if (arg === '--help' || arg === '-h') {\n      console.log(colorize('🔍 認証システム回帰テストスイート', 'bold'));\n      console.log('\\n使用方法:');\n      console.log('  npm run test:auth-regression -- [--url <base-url>] [--verbose]');\n      console.log('  node scripts/ops/regression-test-auth.mjs [--url <base-url>] [--verbose]');\n      console.log('\\nオプション:');\n      console.log('  --url <base-url>   テスト対象のベースURL (デフォルト: 環境変数から取得)');\n      console.log('  --verbose, -v      詳細な出力を表示');\n      console.log('  --help, -h         このヘルプを表示');\n      console.log('\\n例:');\n      console.log('  npm run test:auth-regression');\n      console.log('  npm run test:auth-regression -- --url https://aiohub.jp');\n      console.log('  npm run test:auth-regression -- --verbose');\n      return;\n    }\n  }\n  \n  // Load environment and set default base URL\n  await loadEnv();\n  \n  if (!baseUrl) {\n    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';\n  }\n  \n  // Remove trailing slash\n  baseUrl = baseUrl.replace(/\\/$/, '');\n  \n  // Production safety check\n  if (process.env.NODE_ENV === 'production' && baseUrl.includes('localhost')) {\n    console.error(colorize('❌ エラー: 本番環境でlocalhostのテストは実行できません', 'red'));\n    process.exit(1);\n  }\n  \n  console.log(colorize('🚀 認証システム回帰テストを開始します...', 'blue'));\n  console.log(`🌐 テスト対象: ${baseUrl}`);\n  console.log(`🛡️  環境: ${process.env.NODE_ENV || 'development'}`);\n  \n  if (verbose) {\n    console.log(colorize('📋 詳細モードが有効です', 'dim'));\n  }\n  \n  console.log('\\n' + colorize('テスト実行中...', 'cyan'));\n  \n  try {\n    const runner = await createTestSuite(baseUrl);\n    const success = runner.printSummary();\n    \n    if (success) {\n      console.log(colorize('\\n🎉 全ての回帰テストが成功しました!', 'green'));\n      process.exit(0);\n    } else {\n      console.log(colorize('\\n💥 一部のテストが失敗しました。', 'red'));\n      console.log(colorize('修正後、再度テストを実行してください。', 'yellow'));\n      process.exit(1);\n    }\n    \n  } catch (error) {\n    console.error(colorize(`\\n❌ テスト実行中にエラーが発生しました: ${error.message}`, 'red'));\n    \n    if (verbose && error.stack) {\n      console.error(colorize('\\nスタックトレース:', 'dim'));\n      console.error(error.stack);\n    }\n    \n    console.log('\\n' + colorize('💡 トラブルシューティング:', 'yellow'));\n    console.log('   • サーバーが起動していることを確認してください');\n    console.log('   • 環境変数が正しく設定されていることを確認してください');\n    console.log('   • ネットワーク接続を確認してください');\n    console.log('   • ベースURLが正しいことを確認してください');\n    \n    process.exit(1);\n  }\n}\n\n// Run the script\nmain().catch(error => {\n  console.error(colorize(`予期しないエラー: ${error.message}`, 'red'));\n  process.exit(1);\n});