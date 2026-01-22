#!/usr/bin/env node
/**
 * オリジン安全性チェックスクリプト
 *
 * 【検出対象】
 * 1. src/ 内で https://aiohub.jp/api/ を使っている箇所（絶対URL禁止）
 * 2. CSP connect-src に 'self' が含まれているか確認
 *
 * @see src/lib/serverFetch.ts - 内部APIは必ず相対パスで呼ぶこと
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = 'src';
const MIDDLEWARE_PATH = 'src/middleware.ts';

// ========================================
// 1. 絶対URLチェック
// ========================================
const FORBIDDEN_URL_PATTERNS = [
  {
    // aiohub.jp への直接API呼び出し
    pattern: /https:\/\/aiohub\.jp\/api\//,
    message: '絶対URLでのAPI呼び出しは禁止です。相対パス（/api/...）を使用してください。',
    severity: 'error',
    // ドキュメント・コメント内は除外
    exclude: /^\s*\*|^\s*\/\//,
  },
];

// 許可される例外（ドキュメント、モニタリング用）
const ALLOWED_FILES = [
  'src/app/api/monitor/route.ts', // ドキュメント内のリンク
];

async function checkAbsoluteUrls() {
  const files = await glob(`${SRC_DIR}/**/*.{ts,tsx}`, { ignore: ['**/node_modules/**'] });
  const violations = [];

  for (const filePath of files) {
    // 許可されたファイルはスキップ
    if (ALLOWED_FILES.some(allowed => filePath.includes(allowed))) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (const { pattern, message, severity, exclude } of FORBIDDEN_URL_PATTERNS) {
      lines.forEach((line, index) => {
        // 除外パターンにマッチする行はスキップ
        if (exclude && exclude.test(line)) {
          return;
        }

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

// ========================================
// 2. CSP connect-src チェック
// ========================================
async function checkCspConnectSrc() {
  if (!fs.existsSync(MIDDLEWARE_PATH)) {
    return [{
      file: MIDDLEWARE_PATH,
      line: 0,
      message: 'middleware.ts が見つかりません。CSPの設定を確認してください。',
      severity: 'error',
    }];
  }

  const content = fs.readFileSync(MIDDLEWARE_PATH, 'utf-8');
  const violations = [];

  // connect-src に 'self' が含まれているか確認
  const connectSrcMatch = content.match(/connect-src\s+([^"]+)/);
  if (!connectSrcMatch) {
    violations.push({
      file: MIDDLEWARE_PATH,
      line: 0,
      message: 'CSP connect-src が見つかりません。',
      severity: 'error',
    });
  } else if (!connectSrcMatch[1].includes("'self'")) {
    violations.push({
      file: MIDDLEWARE_PATH,
      line: 0,
      message: "CSP connect-src に 'self' が含まれていません。内部APIへのアクセスがブロックされます。",
      severity: 'error',
    });
  }

  return violations;
}

// ========================================
// メイン
// ========================================
async function main() {
  console.log('='.repeat(70));
  console.log('オリジン安全性チェック');
  console.log('='.repeat(70));
  console.log('');

  let errorCount = 0;
  let warningCount = 0;

  // 1. 絶対URLチェック
  console.log('📍 1. 絶対URL使用チェック...');
  const urlViolations = await checkAbsoluteUrls();
  if (urlViolations.length > 0) {
    console.log('');
    for (const v of urlViolations) {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${v.file}:${v.line}`);
      console.log(`   ${v.message}`);
      console.log(`   > ${v.code}...`);
      if (v.severity === 'error') errorCount++;
      else warningCount++;
    }
  } else {
    console.log('   ✅ 問題なし');
  }
  console.log('');

  // 2. CSP connect-src チェック
  console.log("📍 2. CSP connect-src 'self' チェック...");
  const cspViolations = await checkCspConnectSrc();
  if (cspViolations.length > 0) {
    console.log('');
    for (const v of cspViolations) {
      const icon = v.severity === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${v.file}`);
      console.log(`   ${v.message}`);
      if (v.severity === 'error') errorCount++;
      else warningCount++;
    }
  } else {
    console.log("   ✅ connect-src に 'self' が含まれています");
  }
  console.log('');

  // 結果
  console.log('='.repeat(70));
  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ オリジン安全性チェック: すべてOK');
    process.exit(0);
  } else {
    console.log(`合計: ${errorCount} error(s), ${warningCount} warning(s)`);
    console.log('');
    console.log('【修正方法】');
    console.log('- 内部APIは必ず相対パス（/api/...）で呼ぶ');
    console.log('- serverFetch() を使用する（現在のオリジンを自動検出）');
    console.log("- CSP connect-src には必ず 'self' を含める");
    console.log('');
    console.log('@see src/lib/serverFetch.ts');
    console.log('='.repeat(70));
    process.exit(errorCount > 0 ? 1 : 0);
  }
}

main().catch(err => {
  console.error('スクリプトエラー:', err);
  process.exit(1);
});
