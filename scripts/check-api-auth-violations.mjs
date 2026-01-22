#!/usr/bin/env node
/**
 * API Routes 認証パターン違反検出スクリプト
 *
 * 【検出対象】
 * 1. API Routes 内での createClient（server.ts）の使用
 * 2. API Routes 内での getSession() の使用
 * 3. API Routes 内での getClaims() の使用
 * 4. withOrgAuth/getUserWithClient の使用（非推奨パターン）
 *
 * 【正しい実装】
 * - createApiAuthClient（認証必須）
 * - createApiAuthClientOptional（認証任意）
 *
 * @see src/lib/supabase/api-auth.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const API_DIR = 'src/app/api';

// 禁止パターン
const FORBIDDEN_PATTERNS = [
  {
    // server.ts からの createClient import
    pattern: /from\s+['"]@\/lib\/supabase\/server['"]/,
    message: 'API Routes では createClient（server.ts）の使用は禁止です。createApiAuthClient（api-auth.ts）を使用してください。',
    severity: 'error',
  },
  {
    // getSession() の使用
    pattern: /\.auth\.getSession\s*\(/,
    message: 'API Routes では getSession() の使用は禁止です。getUser() が唯一の Source of Truth です。',
    severity: 'error',
  },
  {
    // getClaims() の使用
    pattern: /\.auth\.getClaims\s*\(/,
    message: 'API Routes では getClaims() の使用は禁止です。getUser() が唯一の Source of Truth です。',
    severity: 'error',
  },
  {
    // withOrgAuth の使用（非推奨）
    pattern: /withOrgAuth/,
    message: 'withOrgAuth は非推奨です。createApiAuthClient を使用してください。',
    severity: 'warning',
  },
  {
    // getUserWithClient の使用（非推奨）
    pattern: /getUserWithClient/,
    message: 'getUserWithClient は非推奨です。createApiAuthClient を使用してください。',
    severity: 'warning',
  },
  {
    // createAuthError の使用（非推奨）
    pattern: /createAuthError/,
    message: 'createAuthError は非推奨です。ApiAuthException を使用してください。',
    severity: 'warning',
  },
];

// 許可パターン（これらが含まれる場合は正しい実装とみなす）
const CORRECT_PATTERNS = [
  /createApiAuthClient/,
  /createApiAuthClientOptional/,
];

async function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  // 正しい実装が含まれているかチェック
  const hasCorrectPattern = CORRECT_PATTERNS.some(pattern => pattern.test(content));

  // 禁止パターンをチェック
  for (const { pattern, message, severity } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      // 行番号を特定
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          violations.push({
            file: filePath,
            line: index + 1,
            message,
            severity,
            code: line.trim().substring(0, 80),
          });
        }
      });
    }
  }

  return violations;
}

async function main() {
  console.log('='.repeat(70));
  console.log('API Routes 認証パターン違反チェック');
  console.log('='.repeat(70));
  console.log('');

  // API Routes のファイルを取得
  const files = await glob(`${API_DIR}/**/route.ts`);
  console.log(`検査対象ファイル数: ${files.length}`);
  console.log('');

  let errorCount = 0;
  let warningCount = 0;
  const allViolations = [];

  for (const file of files) {
    const violations = await checkFile(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
      violations.forEach(v => {
        if (v.severity === 'error') errorCount++;
        if (v.severity === 'warning') warningCount++;
      });
    }
  }

  // 結果表示
  if (allViolations.length === 0) {
    console.log('✅ 違反なし - すべての API Routes が正しい認証パターンを使用しています');
    console.log('');
    process.exit(0);
  }

  // 違反をグループ化して表示
  const byFile = {};
  allViolations.forEach(v => {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  });

  console.log('⚠️  違反が検出されました:');
  console.log('');

  for (const [file, violations] of Object.entries(byFile)) {
    console.log(`📁 ${file}`);
    for (const v of violations) {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} L${v.line}: ${v.message}`);
      console.log(`      > ${v.code}...`);
    }
    console.log('');
  }

  console.log('='.repeat(70));
  console.log(`合計: ${errorCount} error(s), ${warningCount} warning(s)`);
  console.log('');
  console.log('【修正方法】');
  console.log('- import { createApiAuthClient, ApiAuthException } from "@/lib/supabase/api-auth";');
  console.log('- const { supabase, user, applyCookies } = await createApiAuthClient(request);');
  console.log('- すべてのレスポンスを applyCookies() でラップする');
  console.log('');
  console.log('@see src/lib/supabase/api-auth.ts');
  console.log('='.repeat(70));

  // error がある場合は exit code 1
  if (errorCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch(err => {
  console.error('スクリプトエラー:', err);
  process.exit(1);
});
