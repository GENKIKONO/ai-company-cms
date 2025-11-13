import React from 'react';

interface MonthlyReportEmailProps {
  organizationName: string;
  reportPeriod: string; // "2024年11月"
  reportUrl: string;
  dataSummary: {
    ai_visibility_score: number;
    total_bot_hits: number;
    unique_bots: number;
    analyzed_urls: number;
    top_performing_urls: number;
    improvement_needed_urls: number;
  };
  plan: string;
}

export function MonthlyReportEmailTemplate({
  organizationName,
  reportPeriod,
  reportUrl,
  dataSummary,
  plan
}: MonthlyReportEmailProps) {
  const showAdvanced = plan === 'pro' || plan === 'business' || plan === 'enterprise';

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>月次レポートが準備できました - {organizationName}</title>
        <style>{`
          /* Reset styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          
          .header p {
            font-size: 16px;
            opacity: 0.9;
          }
          
          .content {
            padding: 30px;
          }
          
          .greeting {
            font-size: 16px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          
          .summary-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          
          .metric {
            text-align: center;
            padding: 10px;
            background-color: #ffffff;
            border-radius: 6px;
          }
          
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            display: block;
          }
          
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          
          .score-highlight {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          
          .score-highlight .score {
            font-size: 36px;
            font-weight: bold;
            display: block;
          }
          
          .score-highlight .label {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 4px;
          }
          
          .cta-section {
            text-align: center;
            margin: 30px 0;
          }
          
          .cta-button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
          }
          
          .cta-button:hover {
            background-color: #2563eb;
          }
          
          .upgrade-notice {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          
          .upgrade-notice h3 {
            color: #92400e;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .upgrade-notice p {
            color: #78350f;
            font-size: 14px;
          }
          
          .footer {
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
          
          .plan-badge {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-left: 8px;
          }
          
          @media (max-width: 600px) {
            .container {
              width: 100% !important;
            }
            
            .content {
              padding: 20px !important;
            }
            
            .metrics-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>📊 月次レポート完成</h1>
            <p>{reportPeriod}のAI可視性分析</p>
          </div>
          
          <div className="content">
            <div className="greeting">
              <strong>{organizationName}</strong> 様
              <span className="plan-badge">{plan}</span>
            </div>
            
            <p>
              いつもAIO Hubをご利用いただき、ありがとうございます。<br />
              {reportPeriod}の月次レポートが完成いたしました。
            </p>
            
            <div className="score-highlight">
              <span className="score">{dataSummary.ai_visibility_score}</span>
              <div className="label">総合AI可視性スコア</div>
            </div>
            
            <div className="summary-card">
              <div className="summary-title">📈 サマリー</div>
              <div className="metrics-grid">
                <div className="metric">
                  <span className="metric-value">{dataSummary.analyzed_urls}</span>
                  <div className="metric-label">分析対象URL</div>
                </div>
                <div className="metric">
                  <span className="metric-value">{dataSummary.total_bot_hits}</span>
                  <div className="metric-label">AI botアクセス数</div>
                </div>
                <div className="metric">
                  <span className="metric-value">{dataSummary.unique_bots}</span>
                  <div className="metric-label">ユニークbot数</div>
                </div>
                <div className="metric">
                  <span className="metric-value">{dataSummary.top_performing_urls}</span>
                  <div className="metric-label">高評価コンテンツ</div>
                </div>
              </div>
            </div>
            
            {!showAdvanced && (
              <div className="upgrade-notice">
                <h3>🚀 詳細分析はProプラン以上で</h3>
                <p>
                  コンテンツ別分析、ボット詳細、改善提案などの機能をご利用いただくには、
                  Proプラン以上にアップグレードしてください。
                </p>
              </div>
            )}
            
            <div className="cta-section">
              <a href={reportUrl} className="cta-button">
                📊 レポートを確認する
              </a>
            </div>
            
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '20px' }}>
              このレポートでは、AI検索エンジンへの可視性、コンテンツのパフォーマンス、
              {showAdvanced ? 'ボットアクセス詳細、改善提案' : '基本統計'}などをご確認いただけます。
            </p>
            
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '15px' }}>
              ご質問やサポートが必要な場合は、お気軽にお問い合わせください。
            </p>
          </div>
          
          <div className="footer">
            <p>
              <strong>AIO Hub</strong> - AI可視化分析サービス<br />
              <a href="https://aiohub.jp">aiohub.jp</a> | 
              <a href="https://aiohub.jp/support">サポート</a>
            </p>
            <p style={{ marginTop: '10px' }}>
              このメールは {new Date().toLocaleDateString('ja-JP')} に自動送信されました。<br />
              配信停止をご希望の場合は、ダッシュボードの設定よりお手続きください。
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

// Function to render email template to HTML string
export function renderMonthlyReportEmail(props: MonthlyReportEmailProps): string {
  // In a real implementation, you would use a React SSR method like ReactDOMServer.renderToString
  // For now, we'll return a formatted HTML string
  
  const showAdvanced = props.plan === 'pro' || props.plan === 'business' || props.plan === 'enterprise';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>月次レポートが準備できました - ${props.organizationName}</title>
  <style>
    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .content {
      padding: 30px;
    }
    
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .summary-card {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #3b82f6;
    }
    
    .summary-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    
    .metric {
      text-align: center;
      padding: 10px;
      background-color: #ffffff;
      border-radius: 6px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      display: block;
    }
    
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    
    .score-highlight {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .score-highlight .score {
      font-size: 36px;
      font-weight: bold;
      display: block;
    }
    
    .score-highlight .label {
      font-size: 14px;
      opacity: 0.9;
      margin-top: 4px;
    }
    
    .cta-section {
      text-align: center;
      margin: 30px 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    
    .upgrade-notice {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    
    .upgrade-notice h3 {
      color: #92400e;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .upgrade-notice p {
      color: #78350f;
      font-size: 14px;
    }
    
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
    
    .plan-badge {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 8px;
    }
    
    @media (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      
      .content {
        padding: 20px !important;
      }
      
      .metrics-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 月次レポート完成</h1>
      <p>${props.reportPeriod}のAI可視性分析</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        <strong>${props.organizationName}</strong> 様
        <span class="plan-badge">${props.plan}</span>
      </div>
      
      <p>
        いつもAIO Hubをご利用いただき、ありがとうございます。<br />
        ${props.reportPeriod}の月次レポートが完成いたしました。
      </p>
      
      <div class="score-highlight">
        <span class="score">${props.dataSummary.ai_visibility_score}</span>
        <div class="label">総合AI可視性スコア</div>
      </div>
      
      <div class="summary-card">
        <div class="summary-title">📈 サマリー</div>
        <div class="metrics-grid">
          <div class="metric">
            <span class="metric-value">${props.dataSummary.analyzed_urls}</span>
            <div class="metric-label">分析対象URL</div>
          </div>
          <div class="metric">
            <span class="metric-value">${props.dataSummary.total_bot_hits}</span>
            <div class="metric-label">AI botアクセス数</div>
          </div>
          <div class="metric">
            <span class="metric-value">${props.dataSummary.unique_bots}</span>
            <div class="metric-label">ユニークbot数</div>
          </div>
          <div class="metric">
            <span class="metric-value">${props.dataSummary.top_performing_urls}</span>
            <div class="metric-label">高評価コンテンツ</div>
          </div>
        </div>
      </div>
      
      ${!showAdvanced ? `
      <div class="upgrade-notice">
        <h3>🚀 詳細分析はProプラン以上で</h3>
        <p>
          コンテンツ別分析、ボット詳細、改善提案などの機能をご利用いただくには、
          Proプラン以上にアップグレードしてください。
        </p>
      </div>
      ` : ''}
      
      <div class="cta-section">
        <a href="${props.reportUrl}" class="cta-button">
          📊 レポートを確認する
        </a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
        このレポートでは、AI検索エンジンへの可視性、コンテンツのパフォーマンス、
        ${showAdvanced ? 'ボットアクセス詳細、改善提案' : '基本統計'}などをご確認いただけます。
      </p>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
        ご質問やサポートが必要な場合は、お気軽にお問い合わせください。
      </p>
    </div>
    
    <div class="footer">
      <p>
        <strong>AIO Hub</strong> - AI可視化分析サービス<br />
        <a href="https://aiohub.jp">aiohub.jp</a> | 
        <a href="https://aiohub.jp/support">サポート</a>
      </p>
      <p style="margin-top: 10px;">
        このメールは ${new Date().toLocaleDateString('ja-JP')} に自動送信されました。<br />
        配信停止をご希望の場合は、ダッシュボードの設定よりお手続きください。
      </p>
    </div>
  </div>
</body>
</html>`;
}