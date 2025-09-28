'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';

interface SiteSettingsData {
  hero_title: string;
  hero_subtitle: string;
  representative_message: string;
  footer_links: Array<{
    label: string;
    url: string;
    order?: number;
  }>;
}

interface SiteSettingsFormProps {
  initialData: SiteSettingsData | null;
}

export default function SiteSettingsForm({ initialData }: SiteSettingsFormProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SiteSettingsData>({
    hero_title: initialData?.hero_title || 'AIO Hub AI企業CMS',
    hero_subtitle: initialData?.hero_subtitle || 'AI技術を活用した企業情報の統合管理プラットフォーム',
    representative_message: initialData?.representative_message || '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。',
    footer_links: initialData?.footer_links || []
  });

  // リアルタイムプレビュー更新
  const updatePreview = (field: keyof SiteSettingsData, value: string) => {
    const previewElement = document.getElementById(`preview-${field.replace('_', '-')}`);
    if (previewElement) {
      previewElement.textContent = value;
    }
  };

  const handleInputChange = (field: keyof SiteSettingsData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    updatePreview(field, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ops/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        addToast({
          type: 'success',
          title: '保存完了',
          message: `サイト文言が${result.message === 'created' ? '作成' : '更新'}されました`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.reason || 'サイト文言の保存に失敗しました');
      }
    } catch (error) {
      console.error('Site settings save error:', error);
      addToast({
        type: 'error',
        title: '保存エラー',
        message: error instanceof Error ? error.message : 'サイト文言の保存に失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('サイト文言をデフォルトに戻してもよろしいですか？')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ops/site-settings', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // デフォルト値にリセット
        const defaultData = {
          hero_title: 'AIO Hub AI企業CMS',
          hero_subtitle: 'AI技術を活用した企業情報の統合管理プラットフォーム',
          representative_message: '私たちは、AI技術を通じて企業の情報発信を支援し、より良いビジネス成果の実現をお手伝いします。',
          footer_links: []
        };
        
        setFormData(defaultData);
        
        // プレビューも更新
        updatePreview('hero_title', defaultData.hero_title);
        updatePreview('hero_subtitle', defaultData.hero_subtitle);
        updatePreview('representative_message', defaultData.representative_message);
        
        addToast({
          type: 'success',
          title: 'リセット完了',
          message: 'サイト文言がデフォルトに戻されました'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.reason || 'リセットに失敗しました');
      }
    } catch (error) {
      console.error('Site settings reset error:', error);
      addToast({
        type: 'error',
        title: 'リセットエラー',
        message: error instanceof Error ? error.message : 'リセットに失敗しました'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hero Title */}
      <div>
        <label htmlFor="hero_title" className="block text-sm font-medium text-gray-700 mb-2">
          メインタイトル
        </label>
        <input
          type="text"
          id="hero_title"
          value={formData.hero_title}
          onChange={(e) => handleInputChange('hero_title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="サイトのメインタイトル"
          maxLength={255}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          トップページのメインタイトルです（最大255文字）
        </p>
      </div>

      {/* Hero Subtitle */}
      <div>
        <label htmlFor="hero_subtitle" className="block text-sm font-medium text-gray-700 mb-2">
          サブタイトル
        </label>
        <textarea
          id="hero_subtitle"
          value={formData.hero_subtitle}
          onChange={(e) => handleInputChange('hero_subtitle', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="サイトの説明文"
          maxLength={500}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          メインタイトル下の説明文です（最大500文字）
        </p>
      </div>

      {/* Representative Message */}
      <div>
        <label htmlFor="representative_message" className="block text-sm font-medium text-gray-700 mb-2">
          代表メッセージ
        </label>
        <textarea
          id="representative_message"
          value={formData.representative_message}
          onChange={(e) => handleInputChange('representative_message', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="代表者からのメッセージ"
          maxLength={2000}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          代表者のメッセージです（最大2000文字）
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          デフォルトに戻す
        </button>
        
        <div className="space-x-3">
          <button
            type="button"
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={loading}
          >
            実際のページを確認
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </form>
  );
}