#!/usr/bin/env node

/**
 * Hardcoded Dashboard Routes Checker (Baseline方式)
 * 
 * 新規追加のhref="/dashboard..." 直書きを検出してCI失敗させるスクリプト
 * 既存違反はbaselineファイルで管理し、段階的に解消する
 * 
 * Usage:
 * - npm run check:routes            // 新規違反のみチェック
 * - npm run check:routes --update   // baselineを現在の状態に更新
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';

// 検索対象のディレクトリ
const TARGET_DIRS = ['src/app', 'src/components'];

// 検索対象の拡張子
const TARGET_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// 検出する禁止パターン
const FORBIDDEN_PATTERNS = [
  /href=["']\s*\/dashboard[^"']*["']/g,
  /Link\s+to=["']\s*\/dashboard[^"']*["']/g,
  /router\.push\s*\(\s*["']\s*\/dashboard[^"']*["']\s*\)/g,
  /navigate\s*\(\s*["']\s*\/dashboard[^"']*["']\s*\)/g,
];

// 許可リスト（例外として許可する文字列）
const ALLOWLIST = [
  // ドキュメント内での説明や例など
  'href="/dashboard" // 例:',
  'href="/dashboard/example" // サンプルコード',
  // 必要に応じて追加
];

// ベースラインファイルパス
const BASELINE_FILE = 'scripts/hardcoded-dashboard-routes.baseline.json';

// プロジェクトルート（相対パス正規化用）
const PROJECT_ROOT = process.cwd();

// コマンドライン引数
const UPDATE_BASELINE = process.argv.includes('--update');

/**
 * ディレクトリを再帰的に走査してファイル一覧を取得
 */
function getFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // node_modules等は除外
        if (item === 'node_modules' || item === '.next' || item === '.git') {
          continue;
        }
        getFiles(fullPath, files);
      } else if (stat.isFile() && TARGET_EXTENSIONS.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合はスキップ
  }
  
  return files;
}

/**
 * 文字列が許可リストに含まれているかチェック
 */
function isAllowed(match) {
  return ALLOWLIST.some(allowed => match.includes(allowed));
}

/**
 * ファイル内で禁止パターンをチェック
 */
function checkFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const violations = [];
    
    for (const pattern of FORBIDDEN_PATTERNS) {
      const matches = [...content.matchAll(pattern)];
      
      for (const match of matches) {
        // 許可リストにある場合はスキップ
        if (isAllowed(match[0])) {
          continue;
        }
        
        // 行番号とカラム位置を取得
        const beforeMatch = content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        const lines = beforeMatch.split('\n');
        const columnNumber = lines[lines.length - 1].length + 1;
        
        // 相対パスに正規化
        const relativePath = relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
        
        violations.push({
          file: relativePath,
          line: lineNumber,
          column: columnNumber,
          match: match[0]
        });
      }
    }
    
    return violations;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * ベースラインファイルを読み込み
 */
function loadBaseline() {
  try {
    if (!existsSync(BASELINE_FILE)) {
      return [];
    }
    const content = readFileSync(BASELINE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not load baseline file: ${error.message}`);
    return [];
  }
}

/**
 * ベースラインファイルを保存
 */
function saveBaseline(violations) {
  try {
    const content = JSON.stringify(violations, null, 2);
    writeFileSync(BASELINE_FILE, content, 'utf8');
    console.log(`📝 Baseline updated with ${violations.length} violations in ${BASELINE_FILE}`);
  } catch (error) {
    console.error(`Error: Could not save baseline file: ${error.message}`);
    process.exit(1);
  }
}

/**
 * 違反をソートして正規化
 */
function normalizeViolations(violations) {
  return violations
    .slice() // コピー作成
    .sort((a, b) => {
      // ファイル -> 行 -> カラム順でソート
      if (a.file !== b.file) return a.file.localeCompare(b.file);
      if (a.line !== b.line) return a.line - b.line;
      return a.column - b.column;
    });
}

/**
 * 違反の差分を計算
 */
function getViolationsDiff(current, baseline) {
  const currentSet = new Set(current.map(v => `${v.file}:${v.line}:${v.column}:${v.match}`));
  const baselineSet = new Set(baseline.map(v => `${v.file}:${v.line}:${v.column}:${v.match}`));
  
  // 新規違反: current - baseline
  const newViolations = current.filter(v => 
    !baselineSet.has(`${v.file}:${v.line}:${v.column}:${v.match}`)
  );
  
  // 解消された違反: baseline - current  
  const fixedViolations = baseline.filter(v => 
    !currentSet.has(`${v.file}:${v.line}:${v.column}:${v.match}`)
  );
  
  return { newViolations, fixedViolations };
}

/**
 * メイン処理
 */
function main() {
  if (UPDATE_BASELINE) {
    console.log('📝 Updating baseline with current violations...');
  } else {
    console.log('🔍 Checking for new hardcoded dashboard routes...');
  }
  
  // 現在の違反を収集
  let currentViolations = [];
  
  for (const dir of TARGET_DIRS) {
    const files = getFiles(dir);
    
    for (const file of files) {
      const violations = checkFile(file);
      currentViolations.push(...violations);
    }
  }
  
  // 違反をソートして正規化
  currentViolations = normalizeViolations(currentViolations);
  
  if (UPDATE_BASELINE) {
    // ベースライン更新モード
    saveBaseline(currentViolations);
    process.exit(0);
  }
  
  // 通常のチェックモード
  const baseline = loadBaseline();
  const { newViolations, fixedViolations } = getViolationsDiff(currentViolations, baseline);
  
  // 解消された違反を報告（ポジティブフィードバック）
  if (fixedViolations.length > 0) {
    console.log(`✨ Fixed ${fixedViolations.length} violation(s)! Great job!\n`);
  }
  
  // 新規違反をチェック
  if (newViolations.length === 0) {
    console.log(`✅ No new hardcoded dashboard routes found!`);
    console.log(`📊 Current total: ${currentViolations.length} violations (baseline: ${baseline.length})`);
    process.exit(0);
  } else {
    console.log(`❌ Found ${newViolations.length} new hardcoded dashboard route(s):\n`);
    
    const violationsByFile = {};
    for (const violation of newViolations) {
      if (!violationsByFile[violation.file]) {
        violationsByFile[violation.file] = [];
      }
      violationsByFile[violation.file].push(violation);
    }
    
    for (const [file, violations] of Object.entries(violationsByFile)) {
      console.log(`📁 ${file}:`);
      
      for (const violation of violations) {
        console.log(`  Line ${violation.line}:${violation.column}: ${violation.match}`);
      }
      console.log('');
    }
    
    console.log('💡 Solution: Use ROUTES constants from @/lib/routes instead of hardcoded paths');
    console.log('   Example: href={ROUTES.dashboardCompany} instead of href="/dashboard/company"');
    console.log(`\n📊 Total violations: ${currentViolations.length} (${newViolations.length} new, ${baseline.length} baseline)`);
    
    // 検証手順をコメントで残す
    console.log('\n🧪 Testing this check:');
    console.log('   1. Add href="/dashboard/test" to any .tsx file');
    console.log('   2. Run "npm run check:routes" - should fail');
    console.log('   3. Remove the line - should pass');
    console.log('   4. Update baseline: "npm run check:routes:update-baseline"');
    
    process.exit(1);
  }
}

// スクリプト実行
main();