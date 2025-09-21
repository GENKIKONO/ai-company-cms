'use client';

import { Organization } from '@/types';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  fields: string[];
  includeLogos?: boolean;
  customFilename?: string;
}

export interface ReportOptions {
  type: 'summary' | 'detailed' | 'comparison';
  includeCharts?: boolean;
  timeframe?: string;
  filters?: Record<string, any>;
}

export class ExportService {
  // 企業データをCSVエクスポート
  exportToCSV(organizations: Organization[], options: Partial<ExportOptions> = {}): void {
    const fields = options.fields || [
      'name', 'description', 'industries', 'address_region', 
      'address_locality', 'employees', 'founded', 'url'
    ];

    const headers = fields.map(field => this.getFieldLabel(field));
    const csvContent = [
      headers.join(','),
      ...organizations.map(org => 
        fields.map(field => this.formatFieldForCSV(org, field)).join(',')
      )
    ].join('\n');

    this.downloadFile(
      csvContent,
      options.customFilename || `luxucare-organizations-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  // JSONエクスポート
  exportToJSON(organizations: Organization[], options: Partial<ExportOptions> = {}): void {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalCount: organizations.length,
        source: 'LuxuCare',
        version: '1.0'
      },
      organizations: organizations
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    
    this.downloadFile(
      jsonContent,
      options.customFilename || `luxucare-organizations-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  }

  // Excelファイル風のCSVエクスポート（詳細版）
  exportToExcel(organizations: Organization[], options: Partial<ExportOptions> = {}): void {
    const fields = options.fields || [
      'name', 'description', 'legal_form', 'industries', 'founded', 'employees',
      'capital', 'representative_name', 'address_region', 'address_locality',
      'street_address', 'postal_code', 'telephone', 'email', 'url'
    ];

    // BOM付きUTF-8でExcelでも文字化けしないように
    const BOM = '\uFEFF';
    const headers = fields.map(field => this.getFieldLabel(field));
    const csvContent = BOM + [
      headers.join(','),
      ...organizations.map(org => 
        fields.map(field => this.formatFieldForCSV(org, field)).join(',')
      )
    ].join('\n');

    this.downloadFile(
      csvContent,
      options.customFilename || `luxucare-organizations-detailed-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  // レポート生成（HTML）
  generateReport(organizations: Organization[], options: ReportOptions): void {
    const reportHtml = this.buildReportHTML(organizations, options);
    
    this.downloadFile(
      reportHtml,
      `luxucare-report-${options.type}-${new Date().toISOString().split('T')[0]}.html`,
      'text/html'
    );
  }

  // 比較レポート生成
  generateComparisonReport(organizations: Organization[]): void {
    if (organizations.length < 2) {
      throw new Error('比較には最低2社必要です');
    }

    const comparisonData = this.buildComparisonData(organizations);
    const reportHtml = this.buildComparisonHTML(comparisonData);
    
    this.downloadFile(
      reportHtml,
      `luxucare-comparison-${organizations.map(o => o.slug).join('-')}-${new Date().toISOString().split('T')[0]}.html`,
      'text/html'
    );
  }

  // フィールドラベルの取得
  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: '企業名',
      description: '概要',
      legal_form: '法人格',
      industries: '業界',
      founded: '設立年',
      employees: '従業員数',
      capital: '資本金',
      representative_name: '代表者名',
      address_region: '都道府県',
      address_locality: '市区町村',
      street_address: '住所',
      postal_code: '郵便番号',
      telephone: '電話番号',
      email: 'メールアドレス',
      url: 'Webサイト',
      logo_url: 'ロゴURL',
      created_at: '登録日',
      updated_at: '更新日'
    };
    return labels[field] || field;
  }

  // CSVフィールドフォーマット
  private formatFieldForCSV(org: Organization, field: string): string {
    let value = (org as any)[field];
    
    if (value === null || value === undefined) return '';
    
    // 配列の場合
    if (Array.isArray(value)) {
      value = value.join('; ');
    }
    
    // 日付の場合
    if (field.includes('date') || field === 'founded') {
      if (value) {
        value = new Date(value).toLocaleDateString('ja-JP');
      }
    }
    
    // 数値の場合
    if (field === 'employees' || field === 'capital') {
      if (value) {
        value = value.toLocaleString();
      }
    }
    
    // 文字列をクォートで囲む（カンマやクォートが含まれる場合）
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\"') || stringValue.includes('\n')) {
      return `\"${stringValue.replace(/\"/g, '\"\"')}\"`;
    }
    
    return stringValue;
  }

  // ファイルダウンロード
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // レポートHTML構築
  private buildReportHTML(organizations: Organization[], options: ReportOptions): string {
    const stats = this.calculateStats(organizations);
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LuxuCare 企業レポート</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #4F46E5; font-size: 28px; margin: 0; }
        .subtitle { color: #6B7280; font-size: 14px; margin: 5px 0 0 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #F9FAFB; padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1F2937; }
        .stat-label { font-size: 12px; color: #6B7280; margin-top: 5px; }
        .organization { border: 1px solid #E5E7EB; margin: 10px 0; padding: 15px; border-radius: 6px; }
        .org-name { font-weight: bold; color: #1F2937; margin-bottom: 5px; }
        .org-info { font-size: 14px; color: #6B7280; }
        .industries { margin-top: 10px; }
        .industry-tag { background: #EBF4FF; color: #1E40AF; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-right: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">LuxuCare 企業レポート</h1>
        <p class="subtitle">生成日: ${new Date().toLocaleDateString('ja-JP')} | 対象企業数: ${organizations.length}社</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${organizations.length}</div>
            <div class="stat-label">総企業数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.averageEmployees}</div>
            <div class="stat-label">平均従業員数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.topIndustry}</div>
            <div class="stat-label">最多業界</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.topRegion}</div>
            <div class="stat-label">最多地域</div>
        </div>
    </div>

    <h2>企業一覧</h2>
    ${organizations.map(org => `
        <div class="organization">
            <div class="org-name">${org.name}</div>
            <div class="org-info">
                ${org.address_region ? `📍 ${org.address_region}` : ''}
                ${org.employees ? ` | 👥 ${org.employees}名` : ''}
                ${org.founded ? ` | 🗓 ${new Date(org.founded).getFullYear()}年設立` : ''}
            </div>
            ${org.description ? `<p style="margin: 10px 0; font-size: 14px;">${org.description}</p>` : ''}
            ${org.industries && org.industries.length > 0 ? `
                <div class="industries">
                    ${org.industries.map(industry => `<span class="industry-tag">${industry}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('')}
    
    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
        Powered by LuxuCare - AI企業ディレクトリ
    </div>
</body>
</html>`;
  }

  // 比較データ構築
  private buildComparisonData(organizations: Organization[]) {
    return {
      organizations,
      comparison: {
        employees: organizations.map(o => ({ name: o.name, value: o.employees || 0 })),
        founded: organizations.map(o => ({ name: o.name, value: o.founded ? new Date(o.founded).getFullYear() : null })),
        industries: organizations.map(o => ({ name: o.name, value: o.industries?.length || 0 })),
        hasWebsite: organizations.map(o => ({ name: o.name, value: !!o.url })),
        hasLogo: organizations.map(o => ({ name: o.name, value: !!o.logo_url }))
      }
    };
  }

  // 比較HTML構築
  private buildComparisonHTML(data: any): string {
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>企業比較レポート - LuxuCare</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
        .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .comparison-table th, .comparison-table td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }
        .comparison-table th { background: #F9FAFB; font-weight: 600; }
        .metric-row { background: #FAFAFA; }
        .highlight-best { background: #ECFDF5; color: #047857; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>企業比較レポート</h1>
        <p>生成日: ${new Date().toLocaleDateString('ja-JP')}</p>
    </div>
    
    <table class="comparison-table">
        <thead>
            <tr>
                <th>項目</th>
                ${data.organizations.map((org: Organization) => `<th>${org.name}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr class="metric-row">
                <td><strong>従業員数</strong></td>
                ${data.comparison.employees.map((item: any) => 
                  `<td>${item.value ? item.value.toLocaleString() + '名' : '-'}</td>`
                ).join('')}
            </tr>
            <tr>
                <td><strong>設立年</strong></td>
                ${data.comparison.founded.map((item: any) => 
                  `<td>${item.value ? item.value + '年' : '-'}</td>`
                ).join('')}
            </tr>
            <tr class="metric-row">
                <td><strong>業界数</strong></td>
                ${data.comparison.industries.map((item: any) => 
                  `<td>${item.value}分野</td>`
                ).join('')}
            </tr>
            <tr>
                <td><strong>Webサイト</strong></td>
                ${data.comparison.hasWebsite.map((item: any) => 
                  `<td>${item.value ? '✅ あり' : '❌ なし'}</td>`
                ).join('')}
            </tr>
            <tr class="metric-row">
                <td><strong>ロゴ</strong></td>
                ${data.comparison.hasLogo.map((item: any) => 
                  `<td>${item.value ? '✅ あり' : '❌ なし'}</td>`
                ).join('')}
            </tr>
        </tbody>
    </table>
    
    <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
        Powered by LuxuCare
    </div>
</body>
</html>`;
  }

  // 統計計算
  private calculateStats(organizations: Organization[]) {
    const employees = organizations.filter(o => o.employees).map(o => o.employees!);
    const averageEmployees = employees.length > 0 ? Math.round(employees.reduce((a, b) => a + b, 0) / employees.length) : 0;
    
    // 業界統計
    const industries: { [key: string]: number } = {};
    organizations.forEach(org => {
      org.industries?.forEach(industry => {
        industries[industry] = (industries[industry] || 0) + 1;
      });
    });
    const topIndustry = Object.entries(industries).sort(([,a], [,b]) => b - a)[0]?.[0] || '不明';
    
    // 地域統計
    const regions: { [key: string]: number } = {};
    organizations.forEach(org => {
      if (org.address_region) {
        regions[org.address_region] = (regions[org.address_region] || 0) + 1;
      }
    });
    const topRegion = Object.entries(regions).sort(([,a], [,b]) => b - a)[0]?.[0] || '不明';
    
    return { averageEmployees, topIndustry, topRegion };
  }
}

// シングルトンインスタンス
export const exportService = new ExportService();