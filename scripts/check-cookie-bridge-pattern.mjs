#!/usr/bin/env node
/**
 * Cookie Bridge Pattern CI Check
 *
 * Route Handler で request.cookies 由来の Supabase SSR Cookie ブリッジを検出し、
 * 公式パターン (cookies() from next/headers) の使用を強制する。
 *
 * 禁止パターン:
 * 1. Route Handler内で request.cookies.getAll() を createServerClient に渡す
 * 2. setAll で response.cookies にコピーするための配列収集パターン
 *
 * 許可パターン:
 * - middleware.ts での request/response パターン (公式)
 * - Route Handler での cookies() (next/headers) パターン (公式)
 * - createServerClient を使用しないRoute Handler
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const ROUTE_HANDLER_PATTERN = 'src/app/**/route.ts';

// これらのファイルは除外
const EXCLUDED_PATHS = [
  // Middleware は request/response パターンが正しい
  'src/utils/supabase/middleware.ts',
  'src/middleware.ts',
  // Webhook などの認証不要なRoute Handler
  'src/app/api/webhooks/',
  // 既知の例外（後で修正予定）
  'src/app/(public)/auth/callback/route.ts',
  // 以下は createClient (server.ts経由) を使用しており、別のレイヤーでCookieを処理
  'src/app/api/ops/simple-validation/route.ts',
  'src/app/api/dashboard/case-studies-stats/route.ts',
  'src/app/api/admin/billing-analytics/',
  // 診断用エンドポイント（意図的に旧パターンを使用してテスト）
  'src/app/api/diag/database/route.ts',
  'src/app/api/health/dashboard-probe/route.ts',
];

// 禁止パターン
const FORBIDDEN_PATTERNS = [
  {
    name: 'request.cookies in Route Handler getAll',
    // createServerClient の cookies.getAll 内で request.cookies.getAll() を使用
    pattern: /createServerClient[\s\S]{0,500}cookies\s*:\s*\{[\s\S]{0,300}getAll\s*\(\s*\)\s*\{[\s\S]{0,100}request\.cookies\.getAll\s*\(\s*\)/,
    message: 'Route Handler では request.cookies.getAll() ではなく cookies() (next/headers) を使用してください',
  },
  {
    name: 'Cookie collection for response.cookies.set',
    // setAll 内で配列に push して、後で response.cookies.set にコピーするパターン
    // 例: supabaseSetCookies.push({ name, value, options })
    pattern: /setAll[\s\S]{0,50}cookiesToSet[\s\S]{0,200}supabaseSetCookies\.push|cookiesToSet\.forEach[\s\S]{0,100}supabaseSetCookies\.push/,
    message: 'setAll 内で配列に収集して response.cookies にコピーするパターンは禁止です。cookieStore.set() を直接呼んでください',
  },
];

function isExcluded(filePath) {
  const relativePath = filePath.replace(/\\/g, '/');
  return EXCLUDED_PATHS.some(excluded => relativePath.includes(excluded));
}

async function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  // 除外パスはスキップ
  if (isExcluded(relativePath)) {
    return errors;
  }

  // createServerClient を直接インポートして使用していないファイルはスキップ
  // createClient (server.ts経由) は別のレイヤーでCookieを処理するので対象外
  if (!content.includes("from '@supabase/ssr'") && !content.includes('from "@supabase/ssr"')) {
    return errors;
  }

  // 禁止パターンのチェック
  for (const { name, pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      errors.push({
        file: relativePath,
        pattern: name,
        message,
        severity: 'error',
      });
    }
  }

  // createServerClient を直接使っている場合、cookies() インポートが必要
  if (content.includes('createServerClient(')) {
    const hasCookiesImport = /import\s*\{[^}]*cookies[^}]*\}\s*from\s*['"]next\/headers['"]/.test(content);
    if (!hasCookiesImport) {
      errors.push({
        file: relativePath,
        pattern: 'Missing cookies() import',
        message: 'createServerClient を直接使用する Route Handler では cookies を next/headers からインポートしてください',
        severity: 'error',
      });
    }
  }

  return errors;
}

async function main() {
  console.log('🔍 Cookie Bridge Pattern Check を開始...\n');

  const files = await glob(ROUTE_HANDLER_PATTERN, { ignore: ['**/node_modules/**'] });
  const allErrors = [];

  for (const file of files) {
    const errors = await checkFile(file);
    allErrors.push(...errors);
  }

  if (allErrors.length === 0) {
    console.log('✅ Cookie Bridge Pattern: すべてのファイルが公式パターンに準拠しています\n');
    process.exit(0);
  }

  console.log('❌ Cookie Bridge Pattern 違反が検出されました:\n');

  for (const error of allErrors) {
    console.log(`  📁 ${error.file}`);
    console.log(`     パターン: ${error.pattern}`);
    console.log(`     メッセージ: ${error.message}`);
    console.log('');
  }

  console.log('📖 修正方法:');
  console.log('   Route Handler で createServerClient を使う場合は以下のパターンを使用:');
  console.log('');
  console.log('   import { cookies } from "next/headers";');
  console.log('   import { createServerClient } from "@supabase/ssr";');
  console.log('');
  console.log('   const cookieStore = await cookies();');
  console.log('   const supabase = createServerClient(..., {');
  console.log('     cookies: {');
  console.log('       getAll() { return cookieStore.getAll(); },');
  console.log('       setAll(cookiesToSet) {');
  console.log('         cookiesToSet.forEach(({ name, value, options }) => {');
  console.log('           cookieStore.set(name, value, options);');
  console.log('         });');
  console.log('       },');
  console.log('     },');
  console.log('   });');
  console.log('');
  console.log('   ※ request.cookies パターンは middleware.ts でのみ使用可');
  console.log('');

  process.exit(1);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
