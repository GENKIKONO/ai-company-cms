/**
 * 外部埋め込み用Widget/Iframe生成エンジン
 * AI最適化された企業情報をセキュアに外部配布
 */

import type { Organization } from '@/types/database';

export interface WidgetOptions {
  theme?: 'light' | 'dark' | 'auto';
  size?: 'small' | 'medium' | 'large';
  showLogo?: boolean;
  showDescription?: boolean;
  showServices?: boolean;
  customCSS?: string;
}

export interface EmbedGeneratorOptions {
  organization: Organization;
  services?: any[];
  jsonLd: any;
  options: WidgetOptions;
  baseUrl: string;
}

/**
 * HTML文字列のエスケープ（XSS防止）
 */
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * JSON文字列のエスケープ（JavaScript内での利用）
 */
function escapeJsonForJs(obj: any): string {
  return JSON.stringify(obj)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * テーマ別スタイル定義
 */
function getThemeStyles(theme: WidgetOptions['theme'] = 'light'): string {
  const themes = {
    light: {
      background: '#ffffff',
      text: '#333333',
      secondary: '#666666',
      border: '#e1e5e9',
      accent: '#4f46e5',
      hover: '#f8f9fa'
    },
    dark: {
      background: '#1a1a1a',
      text: '#ffffff',
      secondary: '#cccccc',
      border: '#333333',
      accent: '#6366f1',
      hover: '#2d2d2d'
    },
    auto: {
      background: 'var(--bg-color, #ffffff)',
      text: 'var(--text-color, #333333)',
      secondary: 'var(--secondary-color, #666666)',
      border: 'var(--border-color, #e1e5e9)',
      accent: 'var(--accent-color, #4f46e5)',
      hover: 'var(--hover-color, #f8f9fa)'
    }
  };

  const colors = themes[theme] || themes.light;

  return `
    background: ${colors.background};
    color: ${colors.text};
    border: 1px solid ${colors.border};
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  `;
}

/**
 * サイズ別スタイル定義
 */
function getSizeStyles(size: WidgetOptions['size'] = 'medium'): string {
  const sizes = {
    small: {
      width: '280px',
      padding: '12px',
      fontSize: '14px',
      logoSize: '32px'
    },
    medium: {
      width: '360px',
      padding: '16px',
      fontSize: '16px',
      logoSize: '48px'
    },
    large: {
      width: '480px',
      padding: '20px',
      fontSize: '18px',
      logoSize: '64px'
    }
  };

  const config = sizes[size] || sizes.medium;
  
  return `
    width: ${config.width};
    max-width: 100%;
    padding: ${config.padding};
    font-size: ${config.fontSize};
  `;
}

/**
 * 組織情報のHTML生成
 */
function generateOrganizationHtml(
  organization: Organization,
  options: WidgetOptions,
  baseUrl: string
): string {
  const logoHtml = options.showLogo && organization.logo_url
    ? `<img src="${escapeHtml(organization.logo_url)}" alt="${escapeHtml(organization.name)} ロゴ" style="width: 48px; height: 48px; object-fit: contain; border-radius: 4px; margin-bottom: 8px;" />`
    : '';

  const nameHtml = `<h3 style="margin: 0 0 8px 0; font-size: 1.2em; font-weight: 600; line-height: 1.3;">
    <a href="${escapeHtml(baseUrl)}/o/${escapeHtml(organization.slug)}" target="_blank" style="color: inherit; text-decoration: none;">
      ${escapeHtml(organization.name)}
    </a>
  </h3>`;

  const descriptionHtml = options.showDescription && organization.description
    ? `<p style="margin: 0 0 12px 0; color: #666; font-size: 0.9em; line-height: 1.4;">
         ${escapeHtml(organization.description.substring(0, 120))}${organization.description.length > 120 ? '...' : ''}
       </p>`
    : '';

  const locationHtml = organization.address_region
    ? `<div style="font-size: 0.85em; color: #888; margin-bottom: 8px;">
         📍 ${escapeHtml(organization.address_region)}
       </div>`
    : '';

  const urlHtml = organization.url
    ? `<div style="margin-top: 12px;">
         <a href="${escapeHtml(organization.url)}" target="_blank" rel="noopener noreferrer" 
            style="color: #4f46e5; text-decoration: none; font-size: 0.9em; font-weight: 500;">
           🌐 公式サイト
         </a>
       </div>`
    : '';

  return `
    <div class="luxucare-widget-content">
      ${logoHtml}
      ${nameHtml}
      ${descriptionHtml}
      ${locationHtml}
      ${urlHtml}
    </div>
  `;
}

/**
 * サービス一覧HTML生成
 */
function generateServicesHtml(services: any[] = []): string {
  if (!services || services.length === 0) return '';

  const serviceItems = services.slice(0, 3).map(service => `
    <li style="margin-bottom: 6px; font-size: 0.85em;">
      <span style="color: #4f46e5;">•</span> ${escapeHtml(service.name)}
    </li>
  `).join('');

  return `
    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #eee;">
      <h4 style="margin: 0 0 8px 0; font-size: 0.9em; font-weight: 600; color: #666;">サービス</h4>
      <ul style="margin: 0; padding: 0; list-style: none;">
        ${serviceItems}
      </ul>
      ${services.length > 3 ? `<div style="font-size: 0.8em; color: #888; margin-top: 8px;">他 ${services.length - 3} 件</div>` : ''}
    </div>
  `;
}

/**
 * JavaScript Widget生成
 */
export function generateEmbedWidget(config: EmbedGeneratorOptions): string {
  const { organization, services, jsonLd, options, baseUrl } = config;
  
  // スタイル生成
  const themeStyles = getThemeStyles(options.theme);
  const sizeStyles = getSizeStyles(options.size);
  const customCSS = options.customCSS || '';
  
  // HTML生成
  const orgHtml = generateOrganizationHtml(organization, options, baseUrl);
  const servicesHtml = options.showServices ? generateServicesHtml(services) : '';
  
  // JSON-LDをエスケープ
  const jsonLdScript = jsonLd ? `
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 2)}
    </script>
  ` : '';

  const widgetId = `luxucare-widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return `
(function() {
  'use strict';
  
  // 既存のwidgetがある場合は重複を防ぐ
  if (window.LuxuCareWidgetLoaded) {
    console.warn('LuxuCare Widget is already loaded');
    return;
  }
  window.LuxuCareWidgetLoaded = true;

  // エラーハンドリング
  function logError(message, error) {
    console.error('LuxuCare Widget:', message, error);
  }

  try {
    // 現在のscriptタグを取得
    const currentScript = document.currentScript;
    if (!currentScript) {
      logError('Could not find current script element');
      return;
    }

    // コンテナ要素の取得または生成
    let container = currentScript.parentElement;
    if (!container) {
      logError('Could not find container element');
      return;
    }

    // Widget HTML生成
    const widgetHtml = \`
      <div id="${widgetId}" class="luxucare-widget" style="${themeStyles}${sizeStyles}${customCSS}">
        ${orgHtml}
        ${servicesHtml}
        <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; text-align: center;">
          <a href="${escapeHtml(baseUrl)}" target="_blank" style="color: #888; text-decoration: none; font-size: 0.7em;">
            Powered by LuxuCare CMS
          </a>
        </div>
      </div>
    \`;

    // Widget要素を挿入
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = widgetHtml;
    const widgetElement = tempDiv.firstElementChild;
    
    if (widgetElement) {
      container.appendChild(widgetElement);
      
      // JSON-LDをheadに追加（SEO効果）
      if (${jsonLd ? 'true' : 'false'}) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        scriptElement.textContent = ${escapeJsonForJs(jsonLd)};
        head.appendChild(scriptElement);
      }

      // アナリティクス計測（オプション）
      if (typeof gtag === 'function') {
        gtag('event', 'widget_loaded', {
          'widget_type': 'luxucare_embed',
          'organization_slug': '${escapeHtml(organization.slug)}',
          'widget_size': '${options.size || 'medium'}'
        });
      }

      // 読み込み完了イベント
      const loadEvent = new CustomEvent('luxucare:widget:loaded', {
        detail: {
          widgetId: '${widgetId}',
          organization: '${escapeHtml(organization.slug)}',
          version: '1.0.0'
        }
      });
      window.dispatchEvent(loadEvent);
      
      console.log('LuxuCare Widget loaded successfully:', '${escapeHtml(organization.name)}');
    }

  } catch (error) {
    logError('Widget initialization failed', error);
    
    // エラー時のフォールバック表示
    const container = document.currentScript?.parentElement;
    if (container) {
      container.innerHTML = \`
        <div style="padding: 12px; border: 1px solid #f44336; background: #ffebee; border-radius: 4px; color: #c62828; font-size: 14px;">
          Widget読み込みエラー
        </div>
      \`;
    }
  }
})();`;
}

/**
 * Widgetプレビュー用HTML生成（管理画面用）
 */
export function generateWidgetPreview(config: EmbedGeneratorOptions): string {
  const { organization, services, options } = config;
  
  const themeStyles = getThemeStyles(options.theme);
  const sizeStyles = getSizeStyles(options.size);
  const orgHtml = generateOrganizationHtml(organization, options, config.baseUrl);
  const servicesHtml = options.showServices ? generateServicesHtml(services) : '';

  return `
    <div class="luxucare-widget-preview" style="${themeStyles}${sizeStyles}">
      ${orgHtml}
      ${servicesHtml}
      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; text-align: center;">
        <span style="color: #888; font-size: 0.7em;">Powered by LuxuCare CMS</span>
      </div>
    </div>
  `;
}