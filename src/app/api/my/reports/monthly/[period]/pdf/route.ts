import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth-middleware';
import { getServiceRoleClient } from '@/lib/ai-reports/supabase-client';

// PDF出力
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ period: string }> }
) {
  try {
    const resolvedParams = await params;
    // 統一認証チェック
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const supabase = getServiceRoleClient();

    // ユーザーの組織メンバーシップを取得（Supabase Q1回答準拠）
    const { data: membershipData } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', authResult.user.id)
      .maybeSingle() as { data: { organization_id: string } | null };

    if (!membershipData || !membershipData.organization_id) {
      return NextResponse.json({ error: 'Organization membership not found' }, { status: 404 });
    }

    // 組織IDを取得（単一組織前提）
    const organizationId = membershipData.organization_id;

    // period (YYYY-MM) から period_start, period_end を生成
    const periodDate = parsePeriod(resolvedParams.period);
    if (!periodDate) {
      return NextResponse.json({ error: 'Invalid period format. Use YYYY-MM' }, { status: 400 });
    }

    // レポートデータを取得（.single()禁止 → .maybeSingle()で安全化）
    const { data: report, error } = await supabase
      .from('ai_monthly_reports')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('period_start', periodDate.start)
      .eq('period_end', periodDate.end)
      .maybeSingle();

    if (error) {
      console.error('Failed to query ai_monthly_reports for PDF:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch report for PDF',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // .maybeSingle()はデータなしでもerrorにならないため明示的null分岐
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // 組織情報も取得（PDF表紙用・.single()禁止 → .maybeSingle()で安全化）
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle();

    if (orgError) {
      console.error('Failed to query organization for PDF:', orgError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch organization info for PDF',
          details: orgError.message 
        },
        { status: 500 }
      );
    }

    // HTML生成（ブラウザでPDF印刷可能）
    const htmlContent = generateHtmlReport(report, organization);

    // PDF generation is not implemented - return 501 Not Implemented
    return NextResponse.json(
      {
        error: 'Not Implemented',
        message: 'PDF生成機能は現在実装されていません。HTMLプレビューをご利用ください。'
      },
      { status: 501 }
    );

  } catch (error) {
    console.error('Failed to generate PDF report:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 実用的なHTML生成（ブラウザでPDF印刷対応）
function generateHtmlReport(report: any, organization: any): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('ja-JP');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#34495e';
    }
  };

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI月次レポート - ${organization?.name || '不明'}</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: "Hiragino Kaku Gothic Pro", "Meiryo", sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 2.2em;
            font-weight: bold;
        }
        
        .header .org-name {
            font-size: 1.3em;
            color: #7f8c8d;
            margin: 10px 0 5px 0;
        }
        
        .header .period {
            font-size: 1.1em;
            color: #95a5a6;
        }
        
        .section {
            margin: 30px 0;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #2c3e50;
            border-left: 5px solid #3498db;
            padding-left: 15px;
            font-size: 1.4em;
            margin-bottom: 15px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        
        .metric-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .content-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        .content-table th,
        .content-table td {
            border: 1px solid #bdc3c7;
            padding: 12px;
            text-align: left;
        }
        
        .content-table th {
            background-color: #ecf0f1;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .content-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .suggestions {
            margin: 20px 0;
        }
        
        .suggestion-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .suggestion-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .suggestion-title {
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1em;
        }
        
        .suggestion-priority {
            padding: 4px 12px;
            border-radius: 20px;
            color: white;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .suggestion-description {
            color: #555;
            line-height: 1.5;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .plan-badge {
            display: inline-block;
            background: #3498db;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .summary-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #495057;
        }
        
        @media print {
            .section {
                break-inside: avoid;
            }
            
            .suggestion-item {
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI月次レポート</h1>
        <div class="org-name">${organization?.name || '不明'}</div>
        <div class="period">${formatDate(report.period_start)} 〜 ${formatDate(report.period_end)}</div>
        <div><span class="plan-badge">${report.plan_id} - ${report.level}</span></div>
    </div>

    <div class="section">
        <h2>概要</h2>
        <div class="summary-box">
            ${report.summary_text || 'サマリーが生成されていません。'}
        </div>
    </div>

    <div class="section">
        <h2>基本指標</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${formatNumber(report.metrics?.total_page_views || 0)}</div>
                <div class="metric-label">月間ページビュー</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.metrics?.unique_contents || 0}</div>
                <div class="metric-label">公開コンテンツ数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.metrics?.services_published || 0}</div>
                <div class="metric-label">サービス数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.metrics?.faqs_published || 0}</div>
                <div class="metric-label">FAQ数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.metrics?.case_studies_published || 0}</div>
                <div class="metric-label">導入事例数</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.metrics?.ai_generated_contents || 0}</div>
                <div class="metric-label">AI生成コンテンツ数</div>
            </div>
        </div>
    </div>

    ${report.sections?.top_contents?.items?.length ? `
    <div class="section">
        <h2>上位コンテンツ</h2>
        <table class="content-table">
            <thead>
                <tr>
                    <th>タイトル</th>
                    <th>タイプ</th>
                    <th>ページビュー</th>
                </tr>
            </thead>
            <tbody>
                ${report.sections.top_contents.items.map((item: any) => `
                    <tr>
                        <td>${item.title}</td>
                        <td>${item.type}</td>
                        <td>${formatNumber(item.page_views)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${report.suggestions?.length ? `
    <div class="section">
        <h2>改善提案</h2>
        <div class="suggestions">
            ${report.suggestions.map((suggestion: any) => `
                <div class="suggestion-item">
                    <div class="suggestion-header">
                        <div class="suggestion-title">${suggestion.title}</div>
                        <div class="suggestion-priority" style="background-color: ${getPriorityColor(suggestion.priority)}">
                            ${suggestion.priority}
                        </div>
                    </div>
                    <div class="suggestion-description">${suggestion.description}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
        <p>このレポートはAIによって自動生成されました。</p>
    </div>
</body>
</html>
`;
}

// YYYY-MM形式をperiod_start, period_endに変換
function parsePeriod(period: string): { start: string; end: string } | null {
  const match = period.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const [, year, month] = match;
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0); // 月の最終日

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}