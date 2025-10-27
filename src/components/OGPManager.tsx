'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateOGPImage, optimizeImage, OGP_COLOR_PALETTES } from '@/lib/ogp';
import { logger } from '@/lib/utils/logger';

interface Props {
  companyName: string;
  description: string;
  logoUrl?: string;
  onOGPGenerated?: (imageUrl: string, metadata: any) => void;
}

export default function OGPManager({ companyName, description, logoUrl, onOGPGenerated }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [ogpImage, setOgpImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [customColors, setCustomColors] = useState(OGP_COLOR_PALETTES.default);
  const [previewMode, setPreviewMode] = useState<'ogp' | 'twitter'>('ogp');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const generatePreview = useCallback(async () => {
    if (!companyName.trim()) return;

    setIsGenerating(true);
    try {
      const result = await generateOGPImage({
        companyName,
        description,
        logoUrl,
        ...customColors
      });

      if (result.success && result.imageUrl) {
        setOgpImage(result.imageUrl);
        
        // メタデータも生成して親コンポーネントに通知
        const metadata = {
          'og:title': companyName,
          'og:description': description || `${companyName}の企業情報`,
          'og:image': result.imageUrl,
          'og:image:width': '1200',
          'og:image:height': '630',
          'twitter:card': 'summary_large_image',
          'twitter:title': companyName,
          'twitter:description': description || `${companyName}の企業情報`,
          'twitter:image': result.imageUrl
        };

        onOGPGenerated?.(result.imageUrl, metadata);
      }
    } catch (error) {
      logger.error('OGP generation error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsGenerating(false);
    }
  }, [companyName, description, logoUrl, customColors, onOGPGenerated]);

  // フォームデータが変更されたらプレビューを更新
  useEffect(() => {
    if (companyName) {
      generatePreview();
    }
  }, [companyName, generatePreview]);

  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
    setCustomColors(OGP_COLOR_PALETTES[template as keyof typeof OGP_COLOR_PALETTES] || OGP_COLOR_PALETTES.default);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsOptimizing(true);
    try {
      const result = await optimizeImage(file, {
        width: 300,
        height: 300,
        quality: 85,
        format: 'webp'
      });

      if (result.success) {
        logger.debug('Image optimized', result.result);
        // 実際の実装では最適化された画像をアップロードして URL を取得
      }
    } catch (error) {
      logger.error('Image optimization error', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🎨 OGP画像とメタデータ
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        SNSでシェアされた際に表示される画像とメタデータを自動生成します。
      </p>

      {/* テンプレート選択 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          デザインテンプレート
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(OGP_COLOR_PALETTES).map(([key, palette]) => (
            <button
              key={key}
              onClick={() => handleTemplateChange(key)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedTemplate === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div 
                className="w-full h-12 rounded mb-2"
                style={{ backgroundColor: palette.backgroundColor }}
              />
              <div className="text-xs font-medium text-gray-700 capitalize">
                {key}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* カラーカスタマイズ */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          カラーカスタマイズ
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">背景色</label>
            <input
              type="color"
              value={customColors.backgroundColor}
              onChange={(e) => setCustomColors(prev => ({ ...prev, backgroundColor: e.target.value }))}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">テキスト色</label>
            <input
              type="color"
              value={customColors.textColor}
              onChange={(e) => setCustomColors(prev => ({ ...prev, textColor: e.target.value }))}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">アクセント色</label>
            <input
              type="color"
              value={customColors.accentColor}
              onChange={(e) => setCustomColors(prev => ({ ...prev, accentColor: e.target.value }))}
              className="w-full h-8 rounded border border-gray-300"
            />
          </div>
        </div>
      </div>

      {/* ロゴアップロード */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ロゴ画像（オプション）
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          disabled={isOptimizing}
        />
        {isOptimizing && (
          <p className="text-sm text-indigo-600 mt-1">画像を最適化中...</p>
        )}
      </div>

      {/* プレビュー */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            プレビュー
          </label>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPreviewMode('ogp')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                previewMode === 'ogp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              OGP
            </button>
            <button
              onClick={() => setPreviewMode('twitter')}
              className={`px-3 py-1 text-xs font-medium rounded ${
                previewMode === 'twitter'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Twitter
            </button>
          </div>
        </div>

        {ogpImage ? (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            {previewMode === 'ogp' ? (
              <div className="max-w-lg">
                {/* eslint-disable @next/next/no-img-element */}
                <img
                  src={ogpImage}
                  alt="OGP Preview"
                  className="w-full rounded-lg shadow-sm"
                />
                {/* Dynamic base64 OGP preview image */}
                <div className="mt-3 p-3 bg-white rounded border">
                  <h4 className="font-semibold text-gray-900 truncate">{companyName}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {description || `${companyName}の企業情報`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">aiohub.example.com</p>
                </div>
              </div>
            ) : (
              <div className="max-w-lg">
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  {/* eslint-disable @next/next/no-img-element */}
                  <img
                    src={ogpImage}
                    alt="Twitter Card Preview"
                    className="w-full"
                  />
                  {/* Dynamic base64 Twitter card preview image */}
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 truncate">{companyName}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {description || `${companyName}の企業情報`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">🔗 aiohub.example.com</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {isGenerating ? (
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">OGP画像を生成中...</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  企業名を入力するとプレビューが表示されます
                </p>
                <button
                  onClick={generatePreview}
                  disabled={!companyName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  画像を生成
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* メタデータプレビュー */}
      {ogpImage && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">生成されるメタデータ</h4>
          <div className="bg-gray-50 rounded p-3 text-xs font-mono">
            <div className="space-y-1">
              <div>&lt;meta property="og:title" content="{companyName}" /&gt;</div>
              <div>&lt;meta property="og:description" content="{description || `${companyName}の企業情報`}" /&gt;</div>
              <div>&lt;meta property="og:image" content="[generated-image-url]" /&gt;</div>
              <div>&lt;meta name="twitter:card" content="summary_large_image" /&gt;</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}