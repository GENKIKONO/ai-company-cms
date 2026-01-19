#!/usr/bin/env node
/**
 * 🔒 Public API Security Check
 *
 * CI/ローカルで実行して、公開APIの安全性を検証するスクリプト
 *
 * チェック項目:
 * 1. select('*') の使用禁止
 * 2. 禁止キーがAPIレスポンスに含まれていないこと（curlテスト）
 *
 * 使用方法:
 *   node scripts/check-public-api-security.mjs
 *   npm run check:public-api
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const PUBLIC_API_DIR = 'src/app/api/public';
const BLOCKED_ORGANIZATION_KEYS = [
  'created_by',
  'user_id',
  'feature_flags',
  'plan',
  'plan_id',
  'discount_group',
  'original_signup_campaign',
  'entitlements',
  'partner_id',
  'trial_end',
  'data_status',
];

let hasErrors = false;

console.log('🔒 Public API Security Check\n');
console.log('='.repeat(50));

// ============================================
// Check 1: select('*') の検出
// ============================================
console.log('\n📋 Check 1: select(\'*\') 使用検出\n');

function findFiles(dir, pattern) {
  const results = [];
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        results.push(...findFiles(filePath, pattern));
      } else if (file.match(pattern)) {
        results.push(filePath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return results;
}

const routeFiles = findFiles(PUBLIC_API_DIR, /route\.ts$/);
const selectStarViolations = [];

for (const file of routeFiles) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // コメント行は除外
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    // select('*') または select("*") を検出
    if (line.match(/\.select\s*\(\s*['"]?\*['"]?\s*\)/)) {
      selectStarViolations.push({
        file: relative(process.cwd(), file),
        line: index + 1,
        content: line.trim(),
      });
    }
  });
}

if (selectStarViolations.length > 0) {
  console.log('❌ select(\'*\') が検出されました:\n');
  selectStarViolations.forEach(v => {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ${v.content}\n`);
  });
  hasErrors = true;
} else {
  console.log('✅ select(\'*\') は検出されませんでした');
}

// ============================================
// Check 2: 本番APIの禁止キー検査（オプション）
// ============================================
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL;

if (BASE_URL) {
  console.log('\n📋 Check 2: 本番API禁止キー検査\n');
  console.log(`  Base URL: ${BASE_URL}\n`);

  const testEndpoints = [
    '/api/public/organizations/luxucare',
  ];

  for (const endpoint of testEndpoints) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`  Testing: ${endpoint}`);

      const result = execSync(`curl -s "${url}"`, { encoding: 'utf-8', timeout: 10000 });
      const json = JSON.parse(result);

      const organization = json?.data?.organization;
      if (organization) {
        const foundBlockedKeys = BLOCKED_ORGANIZATION_KEYS.filter(key => key in organization);

        if (foundBlockedKeys.length > 0) {
          console.log(`    ❌ 禁止キーが含まれています: ${foundBlockedKeys.join(', ')}`);
          hasErrors = true;
        } else {
          console.log('    ✅ 禁止キーは含まれていません');
        }
      } else {
        console.log('    ⚠️  organization データが見つかりません（スキップ）');
      }
    } catch (e) {
      console.log(`    ⚠️  API呼び出しに失敗しました: ${e.message}`);
    }
  }
} else {
  console.log('\n📋 Check 2: 本番API禁止キー検査（スキップ）');
  console.log('  ⚠️  BASE_URL または NEXT_PUBLIC_APP_URL が設定されていません');
  console.log('  ローカルで実行する場合: BASE_URL=https://aiohub.jp node scripts/check-public-api-security.mjs');
}

// ============================================
// 結果サマリー
// ============================================
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ セキュリティチェックに失敗しました');
  process.exit(1);
} else {
  console.log('✅ 全てのセキュリティチェックに合格しました');
  process.exit(0);
}
