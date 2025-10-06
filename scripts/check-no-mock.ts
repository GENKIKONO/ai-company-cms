/**
 * ダミーデータ検出スクリプト
 * REQ-AIO-00: 禁則事項（ダミーデータ）- CIで失敗
 */

import * as fs from 'fs';
import * as path from 'path';

// 検出対象キーワード（UIダミーデータのみに限定）
const FORBIDDEN_KEYWORDS = [
  'SAMPLE_ORGANIZATION',
  'SAMPLE_SERVICES',
  'SAMPLE_FAQS',
  'dummy.*data',
  'mock.*data',
  'hardcoded.*string'
];

// 除外パターン（正当な使用）
const ALLOWED_PATTERNS = [
  /\/\/ ?.*mock.*for testing/i,
  /test.*mock/i,
  /spec.*mock/i,
  /\.test\./,
  /\.spec\./,
  /\/test\//,
  /\/tests\//,
  /\/\_\_tests\_\_\//,
  /\/stories\//,
  /\.stories\./,
  /playwright/i,
  /jest/i,
  /vitest/i
];

// 検索対象ディレクトリ
const SEARCH_DIRS = [
  'src/app',
  'src/components', 
  'src/lib',
  'src/hooks'
];

// 検索対象ファイル拡張子
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface ViolationResult {
  file: string;
  line: number;
  keyword: string;
  content: string;
}

/**
 * ファイル内容からダミーデータを検出
 */
function checkFileForViolations(filePath: string): ViolationResult[] {
  const violations: ViolationResult[] = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // 空行やコメント行をスキップ
      if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
        return;
      }

      // 除外パターンチェック
      const isAllowed = ALLOWED_PATTERNS.some(pattern => pattern.test(line));
      if (isAllowed) {
        return;
      }

      // 禁止キーワードチェック
      for (const keyword of FORBIDDEN_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(line)) {
          violations.push({
            file: filePath,
            line: lineNumber,
            keyword,
            content: trimmedLine
          });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
  }

  return violations;
}

/**
 * ディレクトリを再帰的に検索
 */
function findFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // node_modules等を除外
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...findFiles(fullPath));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (FILE_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }

  return files;
}

/**
 * メイン実行関数
 */
function main(): void {
  console.log('🔍 ダミーデータ検出チェックを開始...');
  console.log(`検出キーワード: ${FORBIDDEN_KEYWORDS.join(', ')}`);
  console.log('');

  const allViolations: ViolationResult[] = [];

  // 各ディレクトリを検索
  for (const searchDir of SEARCH_DIRS) {
    if (!fs.existsSync(searchDir)) {
      console.log(`⚠️  ディレクトリが見つかりません: ${searchDir}`);
      continue;
    }

    console.log(`📂 検索中: ${searchDir}`);
    const files = findFiles(searchDir);
    
    for (const file of files) {
      const violations = checkFileForViolations(file);
      allViolations.push(...violations);
    }
  }

  // 結果レポート
  console.log('');
  console.log('📊 検出結果:');
  console.log('================');

  if (allViolations.length === 0) {
    console.log('✅ ダミーデータは検出されませんでした');
    process.exit(0);
  }

  console.log(`❌ ${allViolations.length}件のダミーデータが検出されました:`);
  console.log('');

  // ファイル別にグループ化
  const violationsByFile = allViolations.reduce((acc, violation) => {
    if (!acc[violation.file]) {
      acc[violation.file] = [];
    }
    acc[violation.file].push(violation);
    return acc;
  }, {} as Record<string, ViolationResult[]>);

  Object.entries(violationsByFile).forEach(([file, violations]) => {
    console.log(`📄 ${file}:`);
    violations.forEach(violation => {
      console.log(`  Line ${violation.line}: [${violation.keyword}] ${violation.content}`);
    });
    console.log('');
  });

  console.log('💡 修正方法:');
  console.log('1. ダミーデータを削除する');
  console.log('2. データベースからの実データ取得に置き換える'); 
  console.log('3. 0件の場合は「データがありません」等の適切なメッセージを表示する');
  console.log('');

  console.log('❌ CIビルドを失敗させます');
  process.exit(1);
}

// スクリプト実行
main();