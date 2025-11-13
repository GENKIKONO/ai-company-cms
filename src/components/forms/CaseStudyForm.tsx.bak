'use client';

import { useState } from 'react';
import { caseStudySchema } from '@/lib/validation';
import { logger } from '@/lib/utils/logger';

interface CaseStudyData {
  id?: string;
  title: string;
  client_type?: string;
  client_name?: string;
  problem?: string;
  solution?: string;
  outcome?: string;
  metrics?: Record<string, string | number>;
  published_at?: string;
  is_anonymous: boolean;
}

interface CaseStudyFormProps {
  initialData?: CaseStudyData;
  onSubmit: (data: CaseStudyData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CaseStudyForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: CaseStudyFormProps) {
  const [formData, setFormData] = useState<CaseStudyData>({
    title: '',
    client_type: '',
    client_name: '',
    problem: '',
    solution: '',
    outcome: '',
    metrics: {},
    published_at: '',
    is_anonymous: true,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metricKey, setMetricKey] = useState('');
  const [metricValue, setMetricValue] = useState('');

  const clientTypes = [
    '製造業',
    'IT・ソフトウェア',
    '小売・流通',
    '金融',
    '医療・ヘルスケア',
    '教育',
    '建設・不動産',
    '運輸・物流',
    'サービス業',
    '官公庁・自治体',
    'その他'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // バリデーション
      const validationResult = caseStudySchema.safeParse({
        ...formData,
        clientType: formData.client_type,
        clientName: formData.client_name,
        publishedAt: formData.published_at
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
      await onSubmit(formData);
    } catch (error) {
      logger.error('Case study form submission error', error instanceof Error ? error : new Error(String(error)));
      setErrors({ submit: '導入事例の保存に失敗しました' });
    }
  };

  const addMetric = () => {
    if (metricKey && metricValue) {
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [metricKey]: metricValue
        }
      }));
      setMetricKey('');
      setMetricValue('');
    }
  };

  const removeMetric = (key: string) => {
    setFormData(prev => {
      const newMetrics = { ...prev.metrics };
      delete newMetrics[key];
      return {
        ...prev,
        metrics: newMetrics
      };
    });
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
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="例: 業務効率を大幅に向上させたCRMシステム導入事例"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* クライアント情報 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="client_type" className="block text-sm font-medium text-gray-700 mb-2">
              業種
            </label>
            <select
              id="client_type"
              value={formData.client_type}
              onChange={(e) => setFormData(prev => ({ ...prev, client_type: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">業種を選択</option>
              {clientTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.clientType && <p className="mt-1 text-sm text-red-600">{errors.clientType}</p>}
          </div>

          <div>
            <div className="flex items-center space-x-4 mb-2">
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                クライアント名
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_anonymous}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_anonymous: e.target.checked,
                    client_name: e.target.checked ? '' : prev.client_name
                  }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600">匿名化</span>
              </label>
            </div>
            <input
              type="text"
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
              disabled={formData.is_anonymous}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
              placeholder={formData.is_anonymous ? '（匿名）' : '例: 株式会社ABC'}
            />
            {errors.clientName && <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>}
          </div>
        </div>

        {/* 課題・解決策・効果 */}
        <div className="space-y-6">
          <div>
            <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
              課題・背景
            </label>
            <textarea
              id="problem"
              rows={4}
              value={formData.problem}
              onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="クライアントが抱えていた課題や背景を詳しく説明してください"
            />
            {errors.problem && <p className="mt-1 text-sm text-red-600">{errors.problem}</p>}
          </div>

          <div>
            <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
              解決策・提供サービス
            </label>
            <textarea
              id="solution"
              rows={4}
              value={formData.solution}
              onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="どのような解決策やサービスを提供したかを説明してください"
            />
            {errors.solution && <p className="mt-1 text-sm text-red-600">{errors.solution}</p>}
          </div>

          <div>
            <label htmlFor="outcome" className="block text-sm font-medium text-gray-700 mb-2">
              成果・効果
            </label>
            <textarea
              id="outcome"
              rows={4}
              value={formData.outcome}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome: e.target.value }))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="得られた成果や効果を具体的に説明してください"
            />
            {errors.outcome && <p className="mt-1 text-sm text-red-600">{errors.outcome}</p>}
          </div>
        </div>

        {/* 数値指標 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              数値指標・KPI
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={metricKey}
                onChange={(e) => setMetricKey(e.target.value)}
                placeholder="指標名（例: 売上増加率）"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={metricValue}
                onChange={(e) => setMetricValue(e.target.value)}
                placeholder="値（例: 大幅増加）"
                className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addMetric}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                追加
              </button>
            </div>
          </div>
          
          {formData.metrics && Object.keys(formData.metrics).length > 0 && (
            <div className="space-y-2">
              {Object.entries(formData.metrics).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <span className="text-sm">
                    <strong>{key}:</strong> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMetric(key)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 公開日 */}
        <div>
          <label htmlFor="published_at" className="block text-sm font-medium text-gray-700 mb-2">
            公開日
          </label>
          <input
            type="date"
            id="published_at"
            value={formData.published_at}
            onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          {errors.publishedAt && <p className="mt-1 text-sm text-red-600">{errors.publishedAt}</p>}
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