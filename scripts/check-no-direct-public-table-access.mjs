#!/usr/bin/env node
/**
 * 🔒 Public Routes Direct Table Access Check
 *
 * publicルートでテーブル直参照（from('organizations')等）を検出し、
 * VIEW参照（from('v_organizations_public')等）への統一を強制するスクリプト
 *
 * 使用方法:
 *   node scripts/check-no-direct-public-table-access.mjs
 *   npm run check:public-views
 *
 * 意図的な例外:
 *   - HEAD リクエスト（存在確認のみ）
 *   - reports API（全組織への通報を許可）
 *   - プレビューモード（認証済みユーザーの下書き表示）
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

// ============================================
// 設定
// ============================================

const PUBLIC_DIRS = [
  'src/app/api/public',
  'src/app/(public)'
];

// 直接参照を禁止するテーブル名
const BLOCKED_TABLES = [
  'organizations',
  'services',
  'posts',
  'case_studies',
  'faqs',
  'news',
  'qa_entries'
];

// 許可されたVIEW名
const ALLOWED_VIEWS = [
  'v_organizations_public',
  'v_services_public',
  'v_posts_public',
  'v_case_studies_public',
  'v_faqs_public',
  'v_news_public',
  'v_qa_entries_public'
];

// 意図的な例外ファイルとその理由
const ALLOWED_EXCEPTIONS = new Map([
  // reports API: 全組織（非公開含む）への通報を許可
  ['src/app/api/public/reports/route.ts', 'Allow reports on any org (including unpublished)'],
  // HEAD リクエスト: 存在確認のみ
  ['src/app/api/public/organizations/[slug]/route.ts:HEAD', 'HEAD request for existence check only'],
  // プレビューモード: 認証済みユーザーの下書き表示
  ['src/app/api/public/o/[slug]/posts/[postId]/route.ts', 'Preview mode requires draft access'],
]);

// generateStaticParams は ビルド時実行のため例外
const BUILD_TIME_FUNCTIONS = ['generateStaticParams', 'generateMetadata'];

// ============================================
// ユーティリティ
// ============================================

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

function isInAllowedException(filePath, lineNumber, content, fullFileContent) {
  const relPath = relative(process.cwd(), filePath);

  // ファイル全体が例外
  if (ALLOWED_EXCEPTIONS.has(relPath)) {
    return { allowed: true, reason: ALLOWED_EXCEPTIONS.get(relPath) };
  }

  // HEADリクエスト内のコード（function HEAD or export async function HEAD）
  // 注: 簡易判定のため、HEADリクエストかどうかはファイル内容で判断
  if (relPath.includes('organizations/[slug]/route.ts')) {
    // このファイルのHEADリクエストは許可
    const key = `${relPath}:HEAD`;
    if (ALLOWED_EXCEPTIONS.has(key)) {
      return { allowed: true, reason: ALLOWED_EXCEPTIONS.get(key) };
    }
  }

  // コメントアウトされている
  if (content.trim().startsWith('//') || content.trim().startsWith('*')) {
    return { allowed: true, reason: 'Commented out' };
  }

  // generateStaticParams/generateMetadata 内のコードはビルド時実行のため例外
  // 簡易判定: 該当行より上に関数定義があるかチェック
  if (fullFileContent) {
    const lines = fullFileContent.split('\n');
    // 該当行より上を遡ってgenerateStaticParams/generateMetadataを探す
    let inBuildTimeFunction = false;
    let braceCount = 0;

    for (let i = 0; i < lineNumber; i++) {
      const line = lines[i];
      for (const funcName of BUILD_TIME_FUNCTIONS) {
        if (line.includes(`function ${funcName}`) || line.includes(`async function ${funcName}`)) {
          inBuildTimeFunction = true;
          braceCount = 0;
        }
      }
      if (inBuildTimeFunction) {
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        if (braceCount <= 0 && i > 0) {
          inBuildTimeFunction = false;
        }
      }
    }

    if (inBuildTimeFunction) {
      return { allowed: true, reason: 'Inside build-time function (generateStaticParams/generateMetadata)' };
    }
  }

  return { allowed: false };
}

// ============================================
// メインチェック
// ============================================

let hasErrors = false;
const violations = [];
const allowedSkips = [];

console.log('🔒 Public Routes Direct Table Access Check\n');
console.log('='.repeat(60));

// 正規表現パターン: from('テーブル名') または from("テーブル名")
const tablePattern = new RegExp(
  `\\.from\\s*\\(\\s*['"](?:${BLOCKED_TABLES.join('|')})['"]\\s*\\)`,
  'g'
);

for (const dir of PUBLIC_DIRS) {
  const routeFiles = findFiles(dir, /\.(ts|tsx)$/);

  for (const file of routeFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const matches = line.match(tablePattern);
      if (matches) {
        const relPath = relative(process.cwd(), file);
        const lineNum = index + 1;

        // 例外チェック
        const exception = isInAllowedException(file, lineNum, line, content);
        if (exception.allowed) {
          allowedSkips.push({
            file: relPath,
            line: lineNum,
            content: line.trim(),
            reason: exception.reason
          });
          return;
        }

        violations.push({
          file: relPath,
          line: lineNum,
          content: line.trim(),
          match: matches[0]
        });
      }
    });
  }
}

// ============================================
// 結果出力
// ============================================

if (violations.length > 0) {
  console.log('\n❌ 直接テーブル参照が検出されました:\n');
  violations.forEach(v => {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ${v.content}`);
    console.log(`    → VIEW（v_*_public）を使用してください\n`);
  });
  hasErrors = true;
} else {
  console.log('\n✅ 禁止されたテーブル直接参照は検出されませんでした');
}

if (allowedSkips.length > 0) {
  console.log('\n📋 意図的な例外（スキップ）:');
  allowedSkips.forEach(s => {
    console.log(`  ${s.file}:${s.line} - ${s.reason}`);
  });
}

// VIEW参照の確認
console.log('\n📊 VIEW参照状況:');
let viewCount = 0;
for (const dir of PUBLIC_DIRS) {
  const routeFiles = findFiles(dir, /\.(ts|tsx)$/);
  for (const file of routeFiles) {
    const content = readFileSync(file, 'utf-8');
    for (const view of ALLOWED_VIEWS) {
      const viewPattern = new RegExp(`from\\(['"]${view}['"]\\)`, 'g');
      const matches = content.match(viewPattern);
      if (matches) {
        viewCount += matches.length;
      }
    }
  }
}
console.log(`  VIEW参照数: ${viewCount}`);
console.log(`  例外数: ${allowedSkips.length}`);
console.log(`  違反数: ${violations.length}`);

// ============================================
// 結果サマリー
// ============================================

console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ チェック失敗: 直接テーブル参照をVIEW参照に変更してください');
  console.log('\n置換例:');
  console.log("  from('organizations') → from('v_organizations_public')");
  console.log("  from('services')      → from('v_services_public')");
  console.log("  from('posts')         → from('v_posts_public')");
  console.log("  from('case_studies')  → from('v_case_studies_public')");
  console.log("  from('faqs')          → from('v_faqs_public')");
  console.log("  from('news')          → from('v_news_public')");
  console.log("  from('qa_entries')    → from('v_qa_entries_public')");
  process.exit(1);
} else {
  console.log('✅ 全てのチェックに合格しました');
  process.exit(0);
}
