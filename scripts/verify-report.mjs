#!/usr/bin/env node

/**
 * Deployment Verification Report Generator
 * 直近のログファイルからMarkdownレポートを生成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);
const logsDir = path.join(projectRoot, 'logs');

// ログファイルを解析してサマリー情報を抽出
function parseLogFile(logContent) {
  const lines = logContent.split('\n');
  let insideSummary = false;
  let summaryLines = [];
  
  // SUMMARY BEGINからENDまでの行を抽出
  for (const line of lines) {
    if (line.includes('=== SUMMARY BEGIN ===')) {
      insideSummary = true;
      continue;
    }
    if (line.includes('=== SUMMARY END ===')) {
      insideSummary = false;
      break;
    }
    if (insideSummary) {
      summaryLines.push(line);
    }
  }
  
  // サマリー情報をパース
  const summary = {
    environment: '',
    domain: '',
    targetUrl: '',
    timestamp: '',
    logFile: '',
    totalChecks: 0,
    passed: 0,
    failed: 0,
    successRate: 0,
    finalResult: '',
    details: [],
    retryCount: 0,
    duration: 0
  };
  
  for (const line of summaryLines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('Environment:')) {
      summary.environment = trimmed.replace('Environment:', '').trim();
    } else if (trimmed.startsWith('Domain:')) {
      summary.domain = trimmed.replace('Domain:', '').trim();
    } else if (trimmed.startsWith('Target URL:')) {
      summary.targetUrl = trimmed.replace('Target URL:', '').trim();
    } else if (trimmed.startsWith('Timestamp:')) {
      summary.timestamp = trimmed.replace('Timestamp:', '').trim();
    } else if (trimmed.startsWith('Log file:')) {
      summary.logFile = trimmed.replace('Log file:', '').trim();
    } else if (trimmed.startsWith('Total checks:')) {
      summary.totalChecks = parseInt(trimmed.replace('Total checks:', '').trim()) || 0;
    } else if (trimmed.startsWith('Passed:')) {
      summary.passed = parseInt(trimmed.replace('Passed:', '').trim()) || 0;
    } else if (trimmed.startsWith('Failed:')) {
      summary.failed = parseInt(trimmed.replace('Failed:', '').trim()) || 0;
    } else if (trimmed.startsWith('Success rate:')) {
      summary.successRate = parseInt(trimmed.replace('Success rate:', '').replace('%', '').trim()) || 0;
    } else if (trimmed.startsWith('Final Result:')) {
      summary.finalResult = trimmed.replace('Final Result:', '').trim();
    } else if (trimmed.includes('✅') || trimmed.includes('❌')) {
      summary.details.push(trimmed);
    }
  }
  
  // リトライ回数を全体ログから抽出
  const retryMatches = logContent.match(/\[RETRY\]/g);
  summary.retryCount = retryMatches ? retryMatches.length : 0;
  
  // 実行時間を推定（最初と最後のタイムスタンプから）
  const timestampPattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;
  const timestamps = logContent.match(timestampPattern);
  if (timestamps && timestamps.length >= 2) {
    const start = new Date(timestamps[0]);
    const end = new Date(timestamps[timestamps.length - 1]);
    summary.duration = Math.round((end - start) / 1000); // 秒
  }
  
  return summary;
}

// 最新のログファイルを取得
function getLatestLogFile() {
  if (!fs.existsSync(logsDir)) {
    throw new Error(`Logs directory not found: ${logsDir}`);
  }
  
  const files = fs.readdirSync(logsDir)
    .filter(file => file.startsWith('verify-') && file.endsWith('.log'))
    .map(file => ({
      name: file,
      path: path.join(logsDir, file),
      mtime: fs.statSync(path.join(logsDir, file)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (files.length === 0) {
    throw new Error('No verification log files found');
  }
  
  return files[0];
}

// 失敗パターンに基づくヒント生成
function generateHints(summary) {
  const hints = [];
  
  if (summary.finalResult === 'FAILED') {
    hints.push('## 🔧 トラブルシューティングヒント');
    
    if (summary.failed > 0) {
      hints.push('');
      hints.push('### 一般的な解決策');
      hints.push('- **環境変数**: `.env.production` または `.env.local` の設定を確認');
      hints.push('- **Supabase接続**: キーとURLが正しく設定されているか確認');
      hints.push('- **ネットワーク**: DNSとファイアウォール設定を確認');
      hints.push('- **API**: ビルドエラーがないか確認し、必要に応じて再起動');
    }
    
    if (summary.retryCount > 0) {
      hints.push('');
      hints.push(`### リトライ情報`);
      hints.push(`${summary.retryCount}回のリトライが発生しました。ネットワークの不安定性またはサーバー応答の遅延が原因の可能性があります。`);
    }
    
    hints.push('');
    hints.push('### 次回実行時の推奨事項');
    hints.push('- 5-10分待ってから再実行');
    hints.push('- 本番環境の場合、DNS伝播を確認');
    hints.push('- ローカル環境の場合、開発サーバーが起動しているか確認');
  }
  
  return hints;
}

// 推奨アクション生成
function generateRecommendedActions(summary) {
  const actions = ['## 📋 次の推奨アクション', ''];
  
  if (summary.finalResult === 'PASSED') {
    actions.push('### ✅ 検証成功 - 次のステップ');
    actions.push('- [ ] 本番デプロイの実行');
    actions.push('- [ ] デプロイ後の疎通確認');
    actions.push('- [ ] 監視ダッシュボードの確認');
    actions.push('- [ ] ユーザー受け入れテストの実施');
  } else {
    actions.push('### ❌ 検証失敗 - 修正が必要');
    actions.push('- [ ] 失敗した項目の詳細調査');
    actions.push('- [ ] 設定ファイルの見直し');
    actions.push('- [ ] ローカル環境での再テスト');
    actions.push('- [ ] 修正後の再検証実行');
  }
  
  actions.push('');
  actions.push('### 🔄 再検証コマンド');
  actions.push('```bash');
  actions.push(`# ${summary.environment} 環境の再検証`);
  actions.push(`npm run verify:${summary.environment === 'development' ? 'local' : 'prod'}`);
  actions.push('');
  actions.push('# レポート再生成');
  actions.push('npm run verify:report');
  actions.push('```');
  
  return actions;
}

// Markdownレポート生成
function generateMarkdownReport(summary) {
  const statusIcon = summary.finalResult === 'PASSED' ? '✅' : '❌';
  const statusText = summary.finalResult === 'PASSED' ? '成功' : '失敗';
  
  const markdown = [
    `# ${statusIcon} デプロイ検証レポート`,
    '',
    `**検証結果**: ${statusText}  `,
    `**環境**: ${summary.environment}  `,
    `**対象**: ${summary.domain}  `,
    `**実行日時**: ${summary.timestamp}  `,
    '',
    '## 📊 検証サマリー',
    '',
    '| 項目 | 値 |',
    '|------|-----|',
    `| 総チェック数 | ${summary.totalChecks} |`,
    `| 成功 | ${summary.passed} |`,
    `| 失敗 | ${summary.failed} |`,
    `| 成功率 | ${summary.successRate}% |`,
    `| リトライ回数 | ${summary.retryCount} |`,
    `| 実行時間 | ${summary.duration}秒 |`,
    '',
    '## 🔍 詳細結果',
    '',
    ...summary.details.map(detail => `- ${detail}`),
    '',
    ...generateHints(summary),
    '',
    ...generateRecommendedActions(summary),
    '',
    '---',
    '',
    `**ログファイル**: \`${path.basename(summary.logFile)}\`  `,
    `**生成日時**: ${new Date().toLocaleString('ja-JP')}  `,
    `**対象URL**: ${summary.targetUrl}  `
  ];
  
  return markdown.join('\n');
}

// メイン処理
async function main() {
  try {
    console.log('🔍 Generating verification report...');
    
    // 最新のログファイルを取得
    const latestLog = getLatestLogFile();
    console.log(`📄 Reading log file: ${latestLog.name}`);
    
    // ログファイルを読み込み
    const logContent = fs.readFileSync(latestLog.path, 'utf8');
    
    // サマリー情報を解析
    const summary = parseLogFile(logContent);
    
    // Markdownレポートを生成
    const markdownReport = generateMarkdownReport(summary);
    
    // レポートを保存
    const reportPath = path.join(logsDir, 'last-verify-report.md');
    fs.writeFileSync(reportPath, markdownReport, 'utf8');
    
    console.log(`✅ Report generated: ${reportPath}`);
    console.log('')
    console.log('📋 Report Summary:');
    console.log(`   Environment: ${summary.environment}`);
    console.log(`   Result: ${summary.finalResult}`);
    console.log(`   Success Rate: ${summary.successRate}%`);
    console.log(`   Checks: ${summary.passed}/${summary.totalChecks} passed`);
    
    if (summary.retryCount > 0) {
      console.log(`   Retries: ${summary.retryCount}`);
    }
    
    console.log('');
    console.log(`📖 View report: cat logs/last-verify-report.md`);
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    process.exit(1);
  }
}

// スクリプト実行
main().catch(console.error);