#!/usr/bin/env node
/**
 * check-integrity.mjs
 *
 * アーキテクチャ整合性の一括検証スクリプト
 * 全ての検証コマンドを順次実行し、結果をサマリー表示します。
 *
 * 使用方法:
 *   npm run check:integrity
 *   npm run check:integrity -- --quick  # 高速チェックのみ
 *   npm run check:integrity -- --fix    # 自動修正可能なものを修正
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isFix = args.includes('--fix');

/**
 * 検証項目の定義
 */
const checks = [
  // === 高速チェック（常に実行） ===
  {
    name: 'TypeScript型チェック',
    command: 'npm',
    args: ['run', 'typecheck'],
    category: 'quick',
    critical: true,
  },
  {
    name: 'コアモジュール厳格型チェック',
    command: 'npm',
    args: ['run', 'typecheck:strict'],
    category: 'quick',
    critical: true,
  },
  {
    name: 'ESLint',
    command: 'npm',
    args: ['run', 'lint'],
    category: 'quick',
    critical: true,
  },
  {
    name: 'アーキテクチャ違反検出',
    command: 'npm',
    args: ['run', 'check:architecture'],
    category: 'quick',
    critical: true,
  },
  {
    name: 'Tailwind色直書き検出',
    command: 'npm',
    args: ['run', 'check:tailwind'],
    category: 'quick',
    critical: false,
  },
  {
    name: 'Cookie Bridgeパターン検証',
    command: 'npm',
    args: ['run', 'check:cookie-bridge'],
    category: 'quick',
    critical: false,
  },

  // === 通常チェック（--quick 以外で実行） ===
  {
    name: 'ビルド検証',
    command: 'npm',
    args: ['run', 'build'],
    category: 'normal',
    critical: true,
  },
  {
    name: '禁止フィールド検証',
    command: 'npm',
    args: ['run', 'validate:forbidden'],
    category: 'normal',
    critical: true,
  },
];

/**
 * コマンドを実行して結果を返す
 */
function runCommand(name, command, args) {
  return new Promise((resolve) => {
    const start = performance.now();
    const proc = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      const duration = ((performance.now() - start) / 1000).toFixed(1);
      resolve({
        name,
        success: code === 0,
        code,
        duration,
        stdout,
        stderr,
      });
    });

    proc.on('error', (err) => {
      const duration = ((performance.now() - start) / 1000).toFixed(1);
      resolve({
        name,
        success: false,
        code: -1,
        duration,
        stdout: '',
        stderr: err.message,
      });
    });
  });
}

/**
 * プログレス表示付きで検証を実行
 */
async function runChecks() {
  console.log(`\n${BOLD}${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${BLUE}║          AIOHub アーキテクチャ整合性チェック               ║${RESET}`);
  console.log(`${BOLD}${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

  if (isQuick) {
    console.log(`${DIM}モード: 高速チェック (--quick)${RESET}\n`);
  }

  const totalStart = performance.now();
  const results = [];
  const checksToRun = isQuick
    ? checks.filter((c) => c.category === 'quick')
    : checks;

  for (let i = 0; i < checksToRun.length; i++) {
    const check = checksToRun[i];
    const progress = `[${i + 1}/${checksToRun.length}]`;

    process.stdout.write(`${DIM}${progress}${RESET} ${check.name}... `);

    const result = await runCommand(check.name, check.command, check.args);
    result.critical = check.critical;
    results.push(result);

    if (result.success) {
      console.log(`${GREEN}OK${RESET} ${DIM}(${result.duration}s)${RESET}`);
    } else {
      console.log(`${RED}FAIL${RESET} ${DIM}(${result.duration}s)${RESET}`);
    }
  }

  // サマリー表示
  const totalDuration = ((performance.now() - totalStart) / 1000).toFixed(1);
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const criticalFailed = results.filter((r) => !r.success && r.critical).length;

  console.log(`\n${BOLD}────────────────────────────────────────────────────────────${RESET}`);
  console.log(`${BOLD}サマリー${RESET} (${totalDuration}s)`);
  console.log(`${BOLD}────────────────────────────────────────────────────────────${RESET}`);

  console.log(`  ${GREEN}成功${RESET}: ${passed}件`);
  if (failed > 0) {
    console.log(`  ${RED}失敗${RESET}: ${failed}件 (うちクリティカル: ${criticalFailed}件)`);
  }

  // 失敗した項目の詳細
  const failedChecks = results.filter((r) => !r.success);
  if (failedChecks.length > 0) {
    console.log(`\n${BOLD}${RED}失敗した検証:${RESET}`);
    for (const check of failedChecks) {
      const marker = check.critical ? `${RED}[CRITICAL]${RESET}` : `${YELLOW}[WARNING]${RESET}`;
      console.log(`  ${marker} ${check.name}`);

      // エラー出力の最初の5行を表示
      const errorLines = (check.stderr || check.stdout)
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 5);
      if (errorLines.length > 0) {
        console.log(`    ${DIM}${errorLines.join('\n    ')}${RESET}`);
      }
    }
  }

  // 次のアクション
  console.log(`\n${BOLD}次のアクション:${RESET}`);
  if (criticalFailed > 0) {
    console.log(`  ${RED}!${RESET} クリティカルエラーを修正してください`);
    console.log(`  ${DIM}詳細は ARCHITECTURE_INDEX.md §10 を参照${RESET}`);
  } else if (failed > 0) {
    console.log(`  ${YELLOW}!${RESET} 警告を確認してください（マージは可能）`);
  } else {
    console.log(`  ${GREEN}✓${RESET} 全チェック通過！PRの準備ができています`);
  }

  console.log('');

  // 終了コード
  process.exit(criticalFailed > 0 ? 1 : 0);
}

// 実行
runChecks().catch((err) => {
  console.error(`${RED}予期せぬエラー:${RESET}`, err);
  process.exit(1);
});
