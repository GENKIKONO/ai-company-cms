'use client';

import { useState } from 'react';
import { serviceSchema } from '@/lib/validation';

interface ServiceData {
  id?: string;
  name: string;
  summary: string;
  features: string[];
  price: string;
  category: string;
  media: any[];
  cta_url: string;
  status: 'draft' | 'published';
}

interface ServiceFormProps {
  initialData?: ServiceData;
  onSubmit: (data: ServiceData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ServiceForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceData>({
    name: '',
    summary: '',
    features: [''],
    price: '',
    category: '',
    media: [],
    cta_url: '',
    status: 'draft',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const serviceCategories = [
    'コンサルティング',
    'システム開発',
    'デザイン',
    'マーケティング',
    'メンテナンス・サポート',
    '研修・教育',
    'その他のサービス'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // バリデーション
      const validationResult = serviceSchema.safeParse({
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      });

      if (!validationResult.success) {
        const validationErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path.join('.');
          validationErrors[field] = error.message;
        });
        setErrors(validationErrors);
        return;
      }

      setErrors({});
      await onSubmit({
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      });
    } catch (error) {
      console.error('Service form submission error:', error);
      setErrors({ submit: 'サービス情報の保存に失敗しました' });
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-6">
        {/* エラー表示 */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* 基本情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              サービス名 *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="例: ウェブサイト制作サービス"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">カテゴリを選択</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>
        </div>

        {/* サービス概要 */}
        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
            サービス概要 *
          </label>
          <textarea
            id="summary"
            rows={4}
            value={formData.summary}
            onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="サービスの概要を詳しく説明してください（100-500文字）"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formData.summary.length} / 500文字
          </p>
          {errors.summary && <p className="mt-1 text-sm text-red-600">{errors.summary}</p>}
        </div>

        {/* 特徴・機能 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              特徴・機能
            </label>
            <button
              type="button"
              onClick={addFeature}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              + 特徴を追加
            </button>
          </div>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={`特徴 ${index + 1}`}
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.features && <p className="mt-1 text-sm text-red-600">{errors.features}</p>}
        </div>

        {/* 価格・CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              価格
            </label>
            <input
              type="text"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="例: ¥300,000〜、要相談、無料"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="cta_url" className="block text-sm font-medium text-gray-700 mb-2">
              詳細ページURL
            </label>
            <input
              type="url"
              id="cta_url"
              value={formData.cta_url}
              onChange={(e) => setFormData(prev => ({ ...prev, cta_url: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="https://example.com/services/web-design"
            />
            {errors.cta_url && <p className="mt-1 text-sm text-red-600">{errors.cta_url}</p>}
          </div>
        </div>

        {/* ステータス */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            公開状態
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="draft">下書き</option>
            <option value="published">公開</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}