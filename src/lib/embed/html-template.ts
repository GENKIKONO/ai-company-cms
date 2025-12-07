/**
 * iframe埋め込み用HTMLテンプレート生成
 * セキュアで美しいiframe用HTML生成エンジン
 */

import type { Organization } from '@/types/legacy/database';;

export interface IframeOptions {
  width?: string;
  height?: string;
  theme?: 'light' | 'dark' | 'auto';
  showHeader?: boolean;
  showFooter?: boolean;
  responsive?: boolean;
}

export interface IframeGeneratorOptions {
  organization: Organization;
  services?: any[];
  posts?: any[];
  case_studies?: any[];
  faqs?: any[];
  jsonLd: any;
  options: IframeOptions;
  baseUrl: string;
}

/**
 * HTML安全化
 */
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * CSS変数生成（テーマ対応）
 */
function generateCSSVariables(theme: IframeOptions['theme'] = 'light'): string {
  const themes = {
    light: {
      '--aio-primary': 'var(--bg-white)',
      '--bg-secondary': 'var(--color-embed-hover)',
      '--text-primary': 'var(--color-embed-text)',
      '--text-secondary': 'var(--color-embed-secondary)',
      '--border-color': 'var(--color-embed-border)',
      '--accent-color': 'var(--color-embed-accent)',
      '--hover-color': 'var(--color-embed-hover)',
      '--shadow': '0 2px 4px rgba(0,0,0,0.1)'
    },
    dark: {
      '--aio-primary': 'var(--color-embed-dark-bg)',
      '--bg-secondary': 'var(--color-embed-dark-hover)',
      '--text-primary': 'var(--color-embed-dark-text)',
      '--text-secondary': 'var(--color-embed-dark-secondary)',
      '--border-color': 'var(--color-embed-dark-border)',
      '--accent-color': 'var(--color-embed-dark-accent)',
      '--hover-color': 'var(--color-embed-dark-hover)',
      '--shadow': '0 2px 4px rgba(0,0,0,0.3)'
    },
    auto: {
      '--aio-primary': 'light-dark(var(--bg-white), var(--color-embed-dark-bg))',
      '--bg-secondary': 'light-dark(var(--color-embed-hover), var(--color-embed-dark-hover))',
      '--text-primary': 'light-dark(var(--color-embed-text), var(--color-embed-dark-text))',
      '--text-secondary': 'light-dark(var(--color-embed-secondary), var(--color-embed-dark-secondary))',
      '--border-color': 'light-dark(var(--color-embed-border), var(--color-embed-dark-border))',
      '--accent-color': 'light-dark(var(--color-embed-accent), var(--color-embed-dark-accent))',
      '--hover-color': 'light-dark(var(--color-embed-hover), var(--color-embed-dark-hover))',
      '--shadow': 'light-dark(0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.3))'
    }
  };

  const vars = themes[theme] || themes.light;
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n    ');
}

/**
 * メタタグ生成
 */
function generateMetaTags(organization: Organization, baseUrl: string): string {
  const title = `${organization.name} - 企業情報`;
  const description = organization.description 
    ? organization.description.substring(0, 160)
    : `${organization.name}の詳細な企業情報をご覧ください。`;
  const url = `${baseUrl}/o/${organization.slug}`;

  return `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, follow">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${escapeHtml(url)}">
    ${organization.logo_url ? `<meta property="og:image" content="${escapeHtml(organization.logo_url)}">` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    ${organization.logo_url ? `<meta name="twitter:image" content="${escapeHtml(organization.logo_url)}">` : ''}
  `;
}

/**
 * ベースCSS生成
 */
function generateBaseCSS(options: IframeOptions): string {
  const cssVariables = generateCSSVariables(options.theme);
  
  return `
    <style>
      :root {
        ${cssVariables}
      }
      
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: var(--aio-primary);
        color: var(--text-primary);
        line-height: 1.5;
        font-size: 14px;
        ${options.responsive ? '' : `min-width: ${options.width || '360px'};`}
      }
      
      .container {
        padding: 16px;
        ${options.responsive ? 'max-width: 100%;' : `width: ${options.width || '360px'};`}
        ${options.height ? `height: ${options.height};` : 'min-height: 200px;'}
        overflow-y: auto;
      }
      
      .header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border-color);
      }
      
      .logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
        border-radius: 6px;
        margin-right: 12px;
      }
      
      .org-info h1 {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 4px;
        color: var(--text-primary);
      }
      
      .org-info .location {
        font-size: 12px;
        color: var(--text-secondary);
      }
      
      .description {
        margin-bottom: 16px;
        color: var(--text-secondary);
        font-size: 13px;
        line-height: 1.4;
      }
      
      .section {
        margin-bottom: 16px;
      }
      
      .section-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-primary);
      }
      
      .item-list {
        list-style: none;
      }
      
      .item-list li {
        padding: 6px 0;
        border-bottom: 1px solid var(--border-color);
        font-size: 13px;
      }
      
      .item-list li:last-child {
        border-bottom: none;
      }
      
      .item-title {
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .item-meta {
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 2px;
      }
      
      .footer {
        margin-top: 20px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        text-align: center;
      }
      
      .footer a {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 11px;
      }
      
      .footer a:hover {
        color: var(--accent-color);
      }
      
      .external-link {
        color: var(--accent-color);
        text-decoration: none;
        font-weight: 500;
      }
      
      .external-link:hover {
        text-decoration: underline;
      }
      
      @media (max-width: 480px) {
        .container {
          padding: 12px;
        }
        
        .header {
          flex-direction: column;
          text-align: center;
        }
        
        .logo {
          margin-right: 0;
          margin-bottom: 8px;
        }
      }
    </style>
  `;
}

/**
 * ヘッダー部分生成
 */
function generateHeader(organization: Organization, baseUrl: string): string {
  const logoHtml = organization.logo_url
    ? `<img src="${escapeHtml(organization.logo_url)}" alt="${escapeHtml(organization.name)}ロゴ" class="logo">`
    : '';

  const locationHtml = organization.address_region
    ? `<div class="location">📍 ${escapeHtml(organization.address_region)}</div>`
    : '';

  return `
    <div class="header">
      ${logoHtml}
      <div class="org-info">
        <h1>
          <a href="${escapeHtml(baseUrl)}/o/${escapeHtml(organization.slug)}" target="_blank" class="external-link">
            ${escapeHtml(organization.name)}
          </a>
        </h1>
        ${locationHtml}
      </div>
    </div>
  `;
}

/**
 * コンテンツセクション生成
 */
function generateContentSections(
  organization: Organization,
  services: any[] = [],
  posts: any[] = [],
  case_studies: any[] = [],
  faqs: any[] = []
): string {
  let content = '';

  // 企業概要
  if (organization.description) {
    content += `
      <div class="description">
        ${escapeHtml(organization.description)}
      </div>
    `;
  }

  // サービス一覧
  if (services && services.length > 0) {
    const serviceItems = services.slice(0, 5).map(service => `
      <li>
        <div class="item-title">${escapeHtml(service.name)}</div>
        ${service.description ? `<div class="item-meta">${escapeHtml(service.description.substring(0, 80))}${service.description.length > 80 ? '...' : ''}</div>` : ''}
      </li>
    `).join('');

    content += `
      <div class="section">
        <div class="section-title">🛠️ サービス</div>
        <ul class="item-list">
          ${serviceItems}
        </ul>
        ${services.length > 5 ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">他 ${services.length - 5} 件のサービス</div>` : ''}
      </div>
    `;
  }

  // 最新記事
  if (posts && posts.length > 0) {
    const postItems = posts.slice(0, 3).map(post => `
      <li>
        <div class="item-title">${escapeHtml(post.title)}</div>
        <div class="item-meta">${new Date(post.pub_date || post.created_at).toLocaleDateString('ja-JP')}</div>
      </li>
    `).join('');

    content += `
      <div class="section">
        <div class="section-title">📰 最新記事</div>
        <ul class="item-list">
          ${postItems}
        </ul>
      </div>
    `;
  }

  // 導入事例
  if (case_studies && case_studies.length > 0) {
    const caseItems = case_studies.slice(0, 3).map(cs => `
      <li>
        <div class="item-title">${escapeHtml(cs.title)}</div>
        ${cs.client_name ? `<div class="item-meta">導入先: ${escapeHtml(cs.client_name)}</div>` : ''}
      </li>
    `).join('');

    content += `
      <div class="section">
        <div class="section-title">📊 導入事例</div>
        <ul class="item-list">
          ${caseItems}
        </ul>
      </div>
    `;
  }

  // 外部サイトリンク
  if (organization.url) {
    content += `
      <div class="section">
        <a href="${escapeHtml(organization.url)}" target="_blank" rel="noopener noreferrer" class="external-link">
          🌐 公式サイトを見る
        </a>
      </div>
    `;
  }

  return content;
}

/**
 * フッター生成
 */
function generateFooter(baseUrl: string): string {
  return `
    <div class="footer">
      <a href="${escapeHtml(baseUrl)}" target="_blank" rel="noopener noreferrer">
        Powered by LuxuCare CMS
      </a>
    </div>
  `;
}

/**
 * iframe用完全HTML生成
 */
export function generateIframeHtml(config: IframeGeneratorOptions): string {
  const { organization, services, posts, case_studies, faqs, jsonLd, options, baseUrl } = config;

  const metaTags = generateMetaTags(organization, baseUrl);
  const baseCSS = generateBaseCSS(options);
  const headerHtml = options.showHeader !== false ? generateHeader(organization, baseUrl) : '';
  const contentHtml = generateContentSections(organization, services, posts, case_studies, faqs);
  const footerHtml = options.showFooter !== false ? generateFooter(baseUrl) : '';

  const jsonLdScript = jsonLd ? `
    <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 4)}
    </script>
  ` : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    ${metaTags}
    ${baseCSS}
    ${jsonLdScript}
</head>
<body>
    <div class="container">
        ${headerHtml}
        ${contentHtml}
        ${footerHtml}
    </div>
    
    <script>
        // iframe内での安全なリンク処理
        document.addEventListener('DOMContentLoaded', function() {
            // 全ての外部リンクを親ウィンドウで開く
            const links = document.querySelectorAll('a[target="_blank"]');
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    if (window.parent !== window) {
                        e.preventDefault();
                        window.parent.open(this.href, '_blank', 'noopener,noreferrer');
                    }
                });
            });
            
            // 読み込み完了イベント
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'luxucare-iframe-loaded',
                    organization: '${escapeHtml(organization.slug)}',
                    height: document.body.scrollHeight
                }, '*');
            }
        });
        
        // 高さ自動調整
        function adjustHeight() {
            if (window.parent !== window) {
                const height = Math.max(
                    document.body.scrollHeight,
                    document.body.offsetHeight,
                    document.documentElement.clientHeight,
                    document.documentElement.scrollHeight,
                    document.documentElement.offsetHeight
                );
                
                window.parent.postMessage({
                    type: 'luxucare-iframe-resize',
                    height: height
                }, '*');
            }
        }
        
        // コンテンツ変更時の高さ調整
        const resizeObserver = new ResizeObserver(adjustHeight);
        resizeObserver.observe(document.body);
        
        // 初期高さ設定
        setTimeout(adjustHeight, 100);
    </script>
</body>
</html>`;
}