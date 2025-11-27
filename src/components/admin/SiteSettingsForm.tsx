'use client';

import { useState, useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

interface SiteSettings {
  logo_url?: string;
  seo_title?: string;
  seo_description?: string;
  theme_color?: string;
}

interface SiteSettingsFormProps {
  organizationId: string;
}

export function SiteSettingsForm({ organizationId }: SiteSettingsFormProps) {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/cms/site-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const settingsMap: SiteSettings = {};
          data.data.forEach((item: any) => {
            if (['logo_url', 'seo_title', 'seo_description', 'theme_color'].includes(item.key)) {
              settingsMap[item.key as keyof SiteSettings] = typeof item.value === 'string' ? 
                JSON.parse(item.value) : item.value;
            }
          });
          setSettings(settingsMap);
        }
      }
    } catch (error) {
      // Settings load failed - handle silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const requests = Object.entries(settings).map(([key, value]) => {
        return fetch('/api/admin/cms/site-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value: JSON.stringify(value),
            description: getDescriptionForKey(key),
            data_type: 'text',
            is_public: true
          })
        });
      });

      const results = await Promise.all(requests);
      const failed = results.filter(r => !r.ok);

      if (failed.length === 0) {
        setMessage({ type: 'success', text: 'サイト設定を保存しました' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: '一部の設定の保存に失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' });
    } finally {
      setIsSaving(false);
    }
  };

  const getDescriptionForKey = (key: string): string => {
    const descriptions = {
      logo_url: 'サイトロゴのURL',
      seo_title: 'SEOタイトル',
      seo_description: 'SEO説明文',
      theme_color: 'テーマカラー'
    };
    return descriptions[key as keyof typeof descriptions] || '';
  };

  const handleInputChange = (key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: '画像ファイルを選択してください' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ファイルサイズは5MB以下にしてください' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);

    try {
      // Use server-side upload API to bypass RLS
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      const response = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update settings with the public URL
      setSettings(prev => ({ ...prev, logo_url: result.data.publicUrl }));
      setMessage({ type: 'success', text: 'ロゴをアップロードしました' });
      
      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'アップロードに失敗しました' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-24 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8 transition-all duration-200 hover:shadow-md">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">サイト設定</h3>
          <p className="text-sm text-gray-500 mt-1">ロゴ、SEO、テーマカラーを管理</p>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* フォーム */}
      <div className="space-y-6">
        {/* ロゴアップロード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            サイトロゴ
          </label>
          <div className="space-y-4">
            {/* 現在のロゴプレビュー */}
            {settings.logo_url && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex-shrink-0">
                  <img 
                    src={settings.logo_url} 
                    alt="現在のロゴ" 
                    className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-white"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">現在のロゴ</p>
                  <p className="text-xs text-gray-500 break-all">{settings.logo_url}</p>
                </div>
              </div>
            )}

            {/* アップロードエリア */}
            <div className="relative">
              <input
                type="file"
                id="logo_upload"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all duration-200 ${
                isUploading 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'hover:border-blue-400 hover:bg-blue-50/50'
              }`}>
                {isUploading ? (
                  <div className="space-y-4">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">アップロード中...</p>
                      {uploadProgress > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">画像をアップロード</p>
                      <p className="text-xs text-gray-500">クリックして選択またはドラッグ&ドロップ</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              推奨サイズ: 200x60px | 対応形式: PNG, JPG, SVG | 最大サイズ: 5MB
            </p>
          </div>
        </div>

        {/* SEOタイトル */}
        <div>
          <label htmlFor="seo_title" className="block text-sm font-medium text-gray-700 mb-2">
            SEOタイトル
          </label>
          <input
            type="text"
            id="seo_title"
            value={settings.seo_title || ''}
            onChange={(e) => handleInputChange('seo_title', e.target.value)}
            placeholder="AIOHub - AI Visibility Platform"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">最大60文字（検索結果での表示に最適化）</p>
        </div>

        {/* SEO説明文 */}
        <div>
          <label htmlFor="seo_description" className="block text-sm font-medium text-gray-700 mb-2">
            SEO説明文
          </label>
          <textarea
            id="seo_description"
            value={settings.seo_description || ''}
            onChange={(e) => handleInputChange('seo_description', e.target.value)}
            placeholder="AIによるコンテンツ可視性最適化プラットフォーム。検索エンジンでの露出を最大化し、ビジネス成長を加速します。"
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">最大160文字（検索結果のスニペットに表示）</p>
        </div>

        {/* テーマカラー */}
        <div>
          <label htmlFor="theme_color" className="block text-sm font-medium text-gray-700 mb-2">
            テーマカラー
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="theme_color"
              value={settings.theme_color || '#3B82F6'}
              onChange={(e) => handleInputChange('theme_color', e.target.value)}
              className="w-16 h-12 border border-gray-200 rounded-xl cursor-pointer bg-white/50"
            />
            <input
              type="text"
              value={settings.theme_color || '#3B82F6'}
              onChange={(e) => handleInputChange('theme_color', e.target.value)}
              placeholder="#3B82F6"
              pattern="^#[0-9A-Fa-f]{6}$"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm font-mono text-sm"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">ブランドカラーをHEX形式で指定（例: #3B82F6）</p>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              設定を保存
            </>
          )}
        </button>
      </div>
    </div>
  );
}