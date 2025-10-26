#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface AuditIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor' | 'nit';
  viewport: string;
  selector: string;
  evidence: string;
  screenshot: string;
  guideline: string;
}

interface PageAuditResult {
  url: string;
  viewports: string[];
  issues: AuditIssue[];
  a11y: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    violations: any[];
  };
  perf_notes: string[];
  timestamp: string;
}

interface SummaryData {
  totalPages: number;
  totalViewports: number;
  totalIssues: number;
  issuesBySeverity: Record<string, number>;
  issuesByPage: Record<string, number>;
  a11yTotals: Record<string, number>;
  topIssues: Array<{
    id: string;
    severity: string;
    count: number;
    pages: string[];
    description: string;
  }>;
}

async function generateAuditSummary(): Promise<void> {
  const reportsDir = 'reports/responsive-audit';
  const summaryPath = path.join(reportsDir, 'summary.md');
  
  // JSONレポートファイルを検索
  const reportFiles = await glob(path.join(reportsDir, '*.json'));
  
  if (reportFiles.length === 0) {
    console.error('❌ No audit report files found in reports/responsive-audit/');
    process.exit(1);
  }
  
  const allResults: PageAuditResult[] = [];
  const summary: SummaryData = {
    totalPages: 0,
    totalViewports: 0,
    totalIssues: 0,
    issuesBySeverity: { critical: 0, major: 0, minor: 0, nit: 0 },
    issuesByPage: {},
    a11yTotals: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    topIssues: []
  };
  
  // 各レポートを読み込み、集計
  for (const reportFile of reportFiles) {
    try {
      const content = fs.readFileSync(reportFile, 'utf-8');
      const result: PageAuditResult = JSON.parse(content);
      allResults.push(result);
      
      // 基本統計
      summary.totalIssues += result.issues.length;
      summary.issuesByPage[result.url] = result.issues.length;
      
      // 重要度別集計
      for (const issue of result.issues) {
        summary.issuesBySeverity[issue.severity]++;
      }
      
      // A11y統計
      summary.a11yTotals.critical += result.a11y.critical;
      summary.a11yTotals.serious += result.a11y.serious;
      summary.a11yTotals.moderate += result.a11y.moderate;
      summary.a11yTotals.minor += result.a11y.minor;
      
    } catch (error) {
      console.error(`⚠️  Failed to parse ${reportFile}:`, error);
    }
  }
  
  // ユニークページ数とビューポート数を計算
  const uniquePages = new Set(allResults.map(r => r.url));
  const uniqueViewports = new Set(allResults.map(r => r.viewports[0]));
  summary.totalPages = uniquePages.size;
  summary.totalViewports = uniqueViewports.size;
  
  // Top10問題の特定
  const issueMap = new Map<string, { count: number; pages: Set<string>; severity: string; description: string }>();
  
  for (const result of allResults) {
    for (const issue of result.issues) {
      const key = issue.id;
      if (!issueMap.has(key)) {
        issueMap.set(key, {
          count: 0,
          pages: new Set(),
          severity: issue.severity,
          description: issue.guideline
        });
      }
      const entry = issueMap.get(key)!;
      entry.count++;
      entry.pages.add(result.url);
    }
  }
  
  summary.topIssues = Array.from(issueMap.entries())
    .map(([id, data]) => ({
      id,
      severity: data.severity,
      count: data.count,
      pages: Array.from(data.pages),
      description: data.description
    }))
    .sort((a, b) => {
      // 重要度とカウントでソート
      const severityOrder = { critical: 4, major: 3, minor: 2, nit: 1 };
      const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
      const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      return b.count - a.count;
    })
    .slice(0, 10);
  
  // Markdownレポート生成
  const markdown = generateMarkdownReport(summary, allResults);
  
  // ファイル出力
  fs.writeFileSync(summaryPath, markdown);
  
  console.log('✅ UX Audit Summary generated:');
  console.log(`   📄 ${summaryPath}`);
  console.log(`   📊 ${summary.totalPages} pages, ${summary.totalViewports} viewports`);
  console.log(`   🔍 ${summary.totalIssues} issues found`);
  console.log(`   🚨 Critical: ${summary.issuesBySeverity.critical}, Major: ${summary.issuesBySeverity.major}`);
  console.log(`   ♿ A11y Critical: ${summary.a11yTotals.critical}, Serious: ${summary.a11yTotals.serious}`);
}

function generateMarkdownReport(summary: SummaryData, allResults: PageAuditResult[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  
  return `# AIOHub UX/UI監査レポート

**監査日**: ${timestamp}  
**対象**: https://aiohub.jp (本番環境)  
**監査範囲**: ${summary.totalPages}ページ × ${summary.totalViewports}ビューポート

## 📊 サマリー

### 検出問題の概要
- **総問題数**: ${summary.totalIssues}件
- **Critical**: ${summary.issuesBySeverity.critical}件
- **Major**: ${summary.issuesBySeverity.major}件  
- **Minor**: ${summary.issuesBySeverity.minor}件
- **Nit**: ${summary.issuesBySeverity.nit}件

### アクセシビリティ監査結果
- **Critical**: ${summary.a11yTotals.critical}件
- **Serious**: ${summary.a11yTotals.serious}件
- **Moderate**: ${summary.a11yTotals.moderate}件
- **Minor**: ${summary.a11yTotals.minor}件

## 📄 ページ別問題数

${Object.entries(summary.issuesByPage)
  .sort(([,a], [,b]) => b - a)
  .map(([page, count]) => `- **${page}**: ${count}件`)
  .join('\n')}

## 🔥 優先修正Top10

${summary.topIssues.map((issue, index) => `### ${index + 1}. ${issue.id}

**重要度**: ${issue.severity.toUpperCase()}  
**発生回数**: ${issue.count}件  
**影響ページ**: ${issue.pages.join(', ')}  

**ガイドライン**: ${issue.description}

**スクリーンショット**: [関連スクリーンショット](./screenshots/) (該当ファイルを確認)

---`).join('\n\n')}

## 🔍 詳細分析

### レスポンシブ対応状況
${summary.issuesBySeverity.critical > 0 ? 
  `⚠️ **横スクロール問題**: ${summary.topIssues.filter(i => i.id === 'HORIZONTAL_OVERFLOW').length}件検出` : 
  '✅ 横スクロール問題なし'}

### CTA/操作性
${summary.topIssues.filter(i => i.id.includes('CTA') || i.id.includes('TAP')).length > 0 ?
  `⚠️ **CTA/タップターゲット問題**: ${summary.topIssues.filter(i => i.id.includes('CTA') || i.id.includes('TAP')).map(i => i.count).reduce((a, b) => a + b, 0)}件検出` :
  '✅ CTA/タップターゲット問題なし'}

### リンク/ナビゲーション
${summary.topIssues.filter(i => i.id.includes('BROKEN')).length > 0 ?
  `⚠️ **壊れたリンク**: ${summary.topIssues.filter(i => i.id.includes('BROKEN')).map(i => i.count).reduce((a, b) => a + b, 0)}件検出` :
  '✅ 壊れたリンクなし'}

## 💡 修正方針の叩き台

### 即座対応（Critical）
${summary.issuesBySeverity.critical > 0 ? 
  summary.topIssues
    .filter(issue => issue.severity === 'critical')
    .map(issue => `- **${issue.id}**: ${issue.description}`)
    .join('\n') :
  '- Critical問題なし ✅'}

### 近日対応（Major）
${summary.issuesBySeverity.major > 0 ? 
  summary.topIssues
    .filter(issue => issue.severity === 'major')
    .slice(0, 5)
    .map(issue => `- **${issue.id}**: ${issue.description}`)
    .join('\n') :
  '- Major問題なし ✅'}

## 📁 関連ファイル

### 生成レポート
- 📄 \`reports/responsive-audit/summary.md\` (このファイル)
- 📄 \`reports/responsive-audit/*-*.json\` (ページ別詳細)
- 📷 \`reports/responsive-audit/screenshots/\` (問題箇所スクリーンショット)

### 実行方法
\`\`\`bash
npm run audit:ux
\`\`\`

### テスト設定
- \`playwright.ux-audit.config.ts\` - 監査専用設定
- \`tests/ux-audit/responsive-audit.spec.ts\` - 監査テストコード

---

**⚠️ 注意**: この監査は読み取り専用で実施されており、アプリケーションの動作には影響しません。  
**🎯 次のステップ**: 優先修正Top10から着手し、段階的にUX改善を実施してください。
`;
}

// メイン実行
generateAuditSummary().catch(error => {
  console.error('❌ Failed to generate audit summary:', error);
  process.exit(1);
});

export { generateAuditSummary };