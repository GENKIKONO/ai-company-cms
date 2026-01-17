#!/usr/bin/env node
/**
 * Cookie Bridge Pattern CI Check
 *
 * Route Handler で危険な Supabase SSR Cookie ブリッジパターンを検出する。
 *
 * 禁止パターン:
 * 1. setAll で配列に収集するだけで request.cookies を更新しない
 *    → 後続の getAll が古い値を返し、auth-token が設定されない
 *
 * 許可パターン:
 * - middleware.ts での request/response パターン (公式)
 * - Route Handler で request.cookies.set + response.cookies.set の両方を呼ぶパターン
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
    name: 'setAll without request.cookies.set',
    // setAll 内で response.cookies.set のみを呼び、request.cookies.set を呼ばないパターン
    // これは後続の getAll が古い値を返す原因になる
    check: (content) => {
      // createServerClient を使っているか
      if (!content.includes('createServerClient')) return false;

      // setAll の実装を探す
      const setAllMatch = content.match(/setAll\s*\([^)]*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s);
      if (!setAllMatch) return false;

      const setAllBody = setAllMatch[1];

      // request.cookies.set を呼んでいるか
      const hasRequestCookiesSet = /request\.cookies\.set/.test(setAllBody);

      // response.cookies.set または cookieStore.set を呼んでいるか
      const hasResponseCookiesSet = /response\.cookies\.set|cookieStore\.set/.test(setAllBody);

      // response側だけ設定してrequest側を更新していない場合は危険
      if (hasResponseCookiesSet && !hasRequestCookiesSet) {
        // ただし cookies() (next/headers) を使っている場合は OK
        // cookies() は自動的に同期されるため
        const usesCookiesAPI = /import\s*\{[^}]*cookies[^}]*\}\s*from\s*['"]next\/headers['"]/.test(content);
        if (usesCookiesAPI) return false;

        return true;
      }

      return false;
    },
    message: 'setAll 内で request.cookies.set を呼ばずに response.cookies.set のみを呼ぶと、後続の getAll が古い値を返します。request.cookies.set(name, value) も追加してください。',
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
  if (!content.includes("from '@supabase/ssr'") && !content.includes('from "@supabase/ssr"')) {
    return errors;
  }

  // 禁止パターンのチェック
  for (const { name, check, message } of FORBIDDEN_PATTERNS) {
    if (check(content)) {
      errors.push({
        file: relativePath,
        pattern: name,
        message,
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
    console.log('✅ Cookie Bridge Pattern: すべてのファイルが安全なパターンを使用しています\n');
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
  console.log('   setAll(cookiesToSet) {');
  console.log('     // 重要: request.cookies も更新すること');
  console.log('     cookiesToSet.forEach(({ name, value }) => {');
  console.log('       request.cookies.set(name, value);  // ← これが重要');
  console.log('     });');
  console.log('     cookiesToSet.forEach(({ name, value, options }) => {');
  console.log('       response.cookies.set(name, value, options);');
  console.log('     });');
  console.log('   }');
  console.log('');

  process.exit(1);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
