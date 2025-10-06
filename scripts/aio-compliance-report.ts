/**
 * AIO適合率レポート生成スクリプト
 * 月次監視用・Slack/Teams通知対応
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComplianceResult {
  requirementId: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  files?: string[];
}

/**
 * REQ-AIO-01: robots.txt / sitemap.ts チェック
 */
function checkRobotsAndSitemap(): ComplianceResult {
  const robotsPath = 'src/app/robots.ts';
  const sitemapPath = 'src/app/sitemap.ts';
  
  const robotsExists = fs.existsSync(robotsPath);
  const sitemapExists = fs.existsSync(sitemapPath);
  
  if (robotsExists && sitemapExists) {
    return {
      requirementId: 'REQ-AIO-01',
      name: 'robots.txt / sitemap.ts',
      status: 'PASS',
      details: 'robots.ts と sitemap.ts が存在します',
      files: [robotsPath, sitemapPath]
    };
  }
  
  return {
    requirementId: 'REQ-AIO-01',
    name: 'robots.txt / sitemap.ts',
    status: 'FAIL',
    details: `不足ファイル: ${!robotsExists ? 'robots.ts ' : ''}${!sitemapExists ? 'sitemap.ts' : ''}`,
    files: []
  };
}

/**
 * REQ-AIO-03: JSON-LD構造化データチェック
 */
function checkJsonLdStructuredData(): ComplianceResult {
  const jsonLdDir = 'src/lib/json-ld';
  
  if (!fs.existsSync(jsonLdDir)) {
    return {
      requirementId: 'REQ-AIO-03',
      name: 'JSON-LD構造化データ',
      status: 'FAIL',
      details: 'JSON-LDディレクトリが存在しません',
      files: []
    };
  }
  
  const requiredFiles = [
    'organization.ts',
    'service.ts',
    'article.ts',
    'faq.ts',
    'case-study.ts',
    'breadcrumb.ts'
  ];
  
  const existingFiles = fs.readdirSync(jsonLdDir);
  const missingFiles = requiredFiles.filter(file => !existingFiles.includes(file));
  
  if (missingFiles.length === 0) {
    return {
      requirementId: 'REQ-AIO-03',
      name: 'JSON-LD構造化データ',
      status: 'PASS',
      details: `${requiredFiles.length}個のJSON-LDファイルが存在します`,
      files: requiredFiles.map(f => `${jsonLdDir}/${f}`)
    };
  }
  
  return {
    requirementId: 'REQ-AIO-03',
    name: 'JSON-LD構造化データ',
    status: 'WARNING',
    details: `不足ファイル: ${missingFiles.join(', ')}`,
    files: existingFiles.map(f => `${jsonLdDir}/${f}`)
  };
}

/**
 * REQ-AIO-04: RSS/Atomフィードチェック
 */
function checkRssFeeds(): ComplianceResult {
  const feedPaths = [
    'src/app/feed.xml/route.ts',
    'src/app/o/[slug]/feed.xml/route.ts',
    'src/lib/feed/rss-generator.ts'
  ];
  
  const existingFiles = feedPaths.filter(path => fs.existsSync(path));
  
  if (existingFiles.length === feedPaths.length) {
    return {
      requirementId: 'REQ-AIO-04',
      name: 'RSS/Atomフィード',
      status: 'PASS',
      details: 'RSS フィード関連ファイルが完備されています',
      files: existingFiles
    };
  }
  
  return {
    requirementId: 'REQ-AIO-04',
    name: 'RSS/Atomフィード',
    status: 'FAIL',
    details: `不足ファイル: ${feedPaths.filter(p => !existingFiles.includes(p)).join(', ')}`,
    files: existingFiles
  };
}

/**
 * REQ-AIO-05: 拡張サイトマップチェック
 */
function checkExtendedSitemaps(): ComplianceResult {
  const sitemapPaths = [
    'src/app/sitemap-images.xml/route.ts',
    'src/app/sitemap-news.xml/route.ts'
  ];
  
  const existingFiles = sitemapPaths.filter(path => fs.existsSync(path));
  
  if (existingFiles.length === sitemapPaths.length) {
    return {
      requirementId: 'REQ-AIO-05',
      name: '拡張サイトマップ',
      status: 'PASS',
      details: '画像・ニュースサイトマップが存在します',
      files: existingFiles
    };
  }
  
  return {
    requirementId: 'REQ-AIO-05',
    name: '拡張サイトマップ',
    status: 'FAIL',
    details: `不足ファイル: ${sitemapPaths.filter(p => !existingFiles.includes(p)).join(', ')}`,
    files: existingFiles
  };
}

/**
 * REQ-AIO-06: OpenAPI 3.1チェック
 */
function checkOpenApiSchema(): ComplianceResult {
  const openApiPaths = [
    'src/app/api/public/openapi.json/route.ts',
    'src/app/api/public/services/route.ts',
    'src/app/api/public/faqs/route.ts',
    'src/app/api/public/case-studies/route.ts'
  ];
  
  const existingFiles = openApiPaths.filter(path => fs.existsSync(path));
  
  if (existingFiles.length === openApiPaths.length) {
    return {
      requirementId: 'REQ-AIO-06',
      name: 'OpenAPI 3.1',
      status: 'PASS',
      details: 'OpenAPIスキーマと公開APIが完備されています',
      files: existingFiles
    };
  }
  
  return {
    requirementId: 'REQ-AIO-06',
    name: 'OpenAPI 3.1',
    status: 'FAIL',
    details: `不足ファイル: ${openApiPaths.filter(p => !existingFiles.includes(p)).join(', ')}`,
    files: existingFiles
  };
}

/**
 * REQ-AIO-00: ダミーデータ検出チェック
 */
function checkNoMockData(): ComplianceResult {
  const scriptPath = 'scripts/check-no-mock.ts';
  
  if (!fs.existsSync(scriptPath)) {
    return {
      requirementId: 'REQ-AIO-00',
      name: 'ダミーデータ禁止',
      status: 'FAIL',
      details: 'ダミーデータ検出スクリプトが存在しません',
      files: []
    };
  }
  
  return {
    requirementId: 'REQ-AIO-00',
    name: 'ダミーデータ禁止',
    status: 'PASS',
    details: 'ダミーデータ検出スクリプトが存在します（実際の検出は `npm run check:no-mock` で実行）',
    files: [scriptPath]
  };
}

/**
 * 適合率計算
 */
function calculateComplianceRate(results: ComplianceResult[]): number {
  const passCount = results.filter(r => r.status === 'PASS').length;
  return Math.round((passCount / results.length) * 100);
}

/**
 * Slack/Teams用のMarkdown出力
 */
function generateSlackReport(results: ComplianceResult[], complianceRate: number): string {
  const statusEmoji = (status: string) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARNING': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  };
  
  const urgencyLevel = complianceRate >= 95 ? '🟢 正常' : complianceRate >= 85 ? '🟡 注意' : '🔴 緊急';
  
  let report = `# 📊 LuxuCare CMS - AIO適合率レポート\n\n`;
  report += `**適合率: ${complianceRate}%** (${urgencyLevel})\n`;
  report += `**日時: ${new Date().toLocaleString('ja-JP')}**\n\n`;
  
  report += `## 📋 要件別チェック結果\n\n`;
  results.forEach(result => {
    report += `${statusEmoji(result.status)} **${result.requirementId}**: ${result.name}\n`;
    report += `   ${result.details}\n\n`;
  });
  
  if (complianceRate < 95) {
    report += `## 🚨 緊急対応が必要\n\n`;
    const failedResults = results.filter(r => r.status === 'FAIL');
    failedResults.forEach(result => {
      report += `- **${result.requirementId}**: ${result.details}\n`;
    });
    report += `\n`;
  }
  
  report += `## 🔄 次のアクション\n\n`;
  if (complianceRate >= 95) {
    report += `- ✅ 現在の適合率を維持\n`;
    report += `- 📅 次回チェック: 1ヶ月後\n`;
  } else {
    report += `- 🔧 失敗項目の修正実施\n`;
    report += `- 🧪 \`npm run aio:test\` の実行\n`;
    report += `- 📅 修正後の再チェック: 1週間以内\n`;
  }
  
  return report;
}

/**
 * メイン実行
 */
function main(): void {
  console.log('🔍 AIO適合率レポート生成中...\n');
  
  const results: ComplianceResult[] = [
    checkNoMockData(),
    checkRobotsAndSitemap(),
    checkJsonLdStructuredData(),
    checkRssFeeds(),
    checkExtendedSitemaps(),
    checkOpenApiSchema()
  ];
  
  const complianceRate = calculateComplianceRate(results);
  
  // コンソール出力
  console.log(`📊 AIO適合率: ${complianceRate}%\n`);
  results.forEach(result => {
    const status = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${status} ${result.requirementId}: ${result.name}`);
    console.log(`   ${result.details}\n`);
  });
  
  // レポートファイル生成
  const slackReport = generateSlackReport(results, complianceRate);
  const reportPath = 'logs/aio-compliance-report.md';
  
  // logsディレクトリ作成
  const logsDir = 'logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, slackReport);
  console.log(`📄 レポートを生成しました: ${reportPath}`);
  
  // 適合率が95%未満の場合は終了コード1
  if (complianceRate < 95) {
    console.log('🚨 適合率が95%未満のため、緊急対応が必要です');
    process.exit(1);
  }
  
  console.log('✅ AIO適合率チェック完了');
}

// スクリプト実行
if (require.main === module) {
  main();
}