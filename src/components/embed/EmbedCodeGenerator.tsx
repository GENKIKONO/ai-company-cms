'use client';

/**
 * 埋め込みコード生成UI
 * 管理画面でWidget/iframeの埋め込みコードを生成・プレビュー
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Organization } from '@/types/legacy/database';;
import { WidgetPreview } from './WidgetPreview';
import { logger } from '@/lib/utils/logger';

interface EmbedCodeGeneratorProps {
  organization: Organization;
  services?: any[];
  baseUrl?: string;
}

type EmbedType = 'widget' | 'iframe' | 'html';
type ThemeType = 'light' | 'dark' | 'auto';
type SizeType = 'small' | 'medium' | 'large';

interface EmbedOptions {
  type: EmbedType;
  theme: ThemeType;
  size: SizeType;
  showLogo: boolean;
  showDescription: boolean;
  showServices: boolean;
  width: string;
  height: string;
  responsive: boolean;
  customCSS: string;
}

export function EmbedCodeGenerator({ organization, services = [], baseUrl }: EmbedCodeGeneratorProps) {
  const [options, setOptions] = useState<EmbedOptions>({
    type: 'widget',
    theme: 'light',
    size: 'medium',
    showLogo: true,
    showDescription: true,
    showServices: false,
    width: '360',
    height: '400',
    responsive: true,
    customCSS: ''
  });

  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const currentBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://aiohub.jp');

  // 埋め込みコード生成
  const generateEmbedCode = useCallback(() => {
    // Safety guard: prevent code generation when slug is undefined/empty
    if (!organization.slug || organization.slug.trim() === '') {
      setGeneratedCode('<!-- エラー: 企業のスラッグが設定されていません。企業情報を編集してスラッグを設定してください。 -->');
      return;
    }

    const params = new URLSearchParams();
    
    // Widget共通パラメータ
    if (options.theme !== 'light') params.set('theme', options.theme);
    if (options.size !== 'medium') params.set('size', options.size);
    if (!options.showLogo) params.set('showLogo', 'false');
    if (!options.showDescription) params.set('showDescription', 'false');
    if (options.showServices) params.set('showServices', 'true');
    if (options.customCSS) params.set('customCSS', options.customCSS);

    // iframe専用パラメータ
    if (options.type === 'iframe') {
      if (options.width !== '360') params.set('width', options.width + 'px');
      if (options.height !== '400') params.set('height', options.height + 'px');
      if (!options.responsive) params.set('responsive', 'false');
    }

    const queryString = params.toString() ? '?' + params.toString() : '';

    switch (options.type) {
      case 'widget':
        setGeneratedCode(`<!-- LuxuCare Widget -->
<script src="${currentBaseUrl}/api/public/embed/${organization.slug}/widget${queryString}" async></script>
<noscript>
  <a href="${currentBaseUrl}/o/${organization.slug}" target="_blank">
    ${organization.name} - 企業情報を見る
  </a>
</noscript>`);
        break;

      case 'iframe':
        const iframeDimensions = options.responsive 
          ? 'width="100%" style="max-width: 600px; min-height: 400px;"'
          : `width="${options.width}" height="${options.height}"`;
        
        setGeneratedCode(`<!-- LuxuCare Iframe -->
<iframe 
  src="${currentBaseUrl}/api/public/embed/${organization.slug}/iframe${queryString}"
  ${iframeDimensions}
  frameborder="0"
  scrolling="auto"
  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  loading="lazy"
  title="${organization.name} - 企業情報">
</iframe>`);
        break;

      case 'html':
        setGeneratedCode(`<!-- 注意: 静的HTMLは開発中です -->
<!-- 現在はWidget版をご利用ください -->
<script src="${currentBaseUrl}/api/public/embed/${organization.slug}/widget${queryString}" async></script>`);
        break;
    }
  }, [currentBaseUrl, organization.slug, organization.name, options]);

  useEffect(() => {
    generateEmbedCode();
  }, [generateEmbedCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      logger.error('コピーに失敗しました:', { data: err });
      // フォールバック: テキストエリア使用
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleOptionChange = (key: keyof EmbedOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="embed-code-generator bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        埋め込みコード生成
      </h3>

      {/* 埋め込みタイプ選択 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { value: 'widget', label: 'JavaScript Widget', desc: '推奨・高機能' },
          { value: 'iframe', label: 'iframe埋め込み', desc: 'セキュア' },
          { value: 'html', label: '静的HTML', desc: '開発中' }
        ].map((type) => (
          <button
            key={type.value}
            onClick={() => handleOptionChange('type', type.value)}
            className={`p-3 text-sm rounded-md border transition-colors ${
              options.type === type.value
                ? 'bg-blue-50 border-[var(--aio-primary)] text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className="font-medium">{type.label}</div>
            <div className="text-xs opacity-75">{type.desc}</div>
          </button>
        ))}
      </div>

      {/* オプション設定 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* テーマ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            テーマ
          </label>
          <select
            value={options.theme}
            onChange={(e) => handleOptionChange('theme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
            <option value="auto">自動（CSS変数対応）</option>
          </select>
        </div>

        {/* サイズ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            サイズ
          </label>
          <select
            value={options.size}
            onChange={(e) => handleOptionChange('size', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
          >
            <option value="small">小 (280px)</option>
            <option value="medium">中 (360px)</option>
            <option value="large">大 (480px)</option>
          </select>
        </div>

        {/* iframe専用オプション */}
        {options.type === 'iframe' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                幅 (px)
              </label>
              <input
                type="number"
                value={options.width}
                onChange={(e) => handleOptionChange('width', e.target.value)}
                min="200"
                max="800"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高さ (px)
              </label>
              <input
                type="number"
                value={options.height}
                onChange={(e) => handleOptionChange('height', e.target.value)}
                min="200"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
              />
            </div>
          </>
        )}
      </div>

      {/* 表示オプション */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'showLogo' as const, label: 'ロゴ表示' },
          { key: 'showDescription' as const, label: '概要表示' },
          { key: 'showServices' as const, label: 'サービス表示' },
          { key: 'responsive' as const, label: 'レスポンシブ' }
        ].map((option) => (
          <label key={option.key} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={options[option.key]}
              onChange={(e) => handleOptionChange(option.key, e.target.checked)}
              className="rounded border-gray-300 text-[var(--aio-primary)] focus:ring-[var(--aio-primary)]"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>

      {/* カスタムCSS */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カスタムCSS（上級者向け）
        </label>
        <textarea
          value={options.customCSS}
          onChange={(e) => handleOptionChange('customCSS', e.target.value)}
          placeholder="例: border: 2px solid #000; background: #f0f0f0;"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          セキュリティ上、一部のCSS属性は制限されます
        </p>
      </div>

      {/* プレビュー */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-700 mb-3">プレビュー</h4>
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
          <WidgetPreview
            organization={organization}
            services={options.showServices ? services : []}
            options={{
              theme: options.theme,
              size: options.size,
              showLogo: options.showLogo,
              showDescription: options.showDescription,
              showServices: options.showServices,
              customCSS: options.customCSS
            }}
            baseUrl={currentBaseUrl}
          />
        </div>
      </div>

      {/* 生成されたコード */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-md font-medium text-gray-700">
            埋め込みコード
          </h4>
          <button
            onClick={copyToClipboard}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              copySuccess
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
            }`}
          >
            {copySuccess ? '✅ コピー完了' : '📋 コピー'}
          </button>
        </div>
        
        <textarea
          value={generatedCode}
          readOnly
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm focus:outline-none"
        />
        
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>使用方法:</strong> 上記のコードをHTMLページに貼り付けてください。
            {options.type === 'widget' && ' JavaScriptが有効な環境で動作します。'}
            {options.type === 'iframe' && ' セキュアな環境でも安全に動作します。'}
          </p>
        </div>
      </div>
    </div>
  );
}