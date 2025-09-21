'use client';

import { useState, useEffect } from 'react';
import { createCaseStudy, updateCaseStudy } from '@/lib/case-studies';
import { getOrganizations } from '@/lib/organizations';
import { type CaseStudy, type CaseStudyFormData, type Organization } from '@/types/database';

interface CaseStudyFormProps {
  caseStudy?: CaseStudy | null;
  onClose: () => void;
}

export function CaseStudyForm({ caseStudy, onClose }: CaseStudyFormProps) {
  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: '',
    organization_id: '',
    client_name: '',
    client_industry: '',
    problem: '',
    solution: '',
    outcome: '',
    metrics: {},
    is_anonymous: false,
    is_featured: false
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  const isEditing = !!caseStudy;

  useEffect(() => {
    loadOrganizations();
    
    if (caseStudy) {
      setFormData({
        title: caseStudy.title,
        organization_id: caseStudy.organization_id,
        client_name: caseStudy.client_name || '',
        client_industry: caseStudy.client_industry || '',
        problem: caseStudy.problem || '',
        solution: caseStudy.solution || '',
        outcome: caseStudy.outcome || '',
        metrics: caseStudy.metrics || {},
        is_anonymous: caseStudy.is_anonymous || false,
        is_featured: caseStudy.is_featured || false
      });
    }
  }, [caseStudy]);

  const loadOrganizations = async () => {
    const { data } = await getOrganizations({ limit: 100, status: 'published' });
    if (data) {
      setOrganizations(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addMetric = () => {
    if (newMetricKey.trim() && newMetricValue.trim()) {
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [newMetricKey.trim()]: newMetricValue.trim()
        }
      }));
      setNewMetricKey('');
      setNewMetricValue('');
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.organization_id) {
      newErrors.organization_id = '企業の選択は必須です';
    }

    if (!formData.is_anonymous && !formData.client_name?.trim()) {
      newErrors.client_name = '匿名でない場合、クライアント名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        client_name: formData.is_anonymous ? null : formData.client_name,
        client_industry: formData.client_industry || null,
        problem: formData.problem || null,
        solution: formData.solution || null,
        outcome: formData.outcome || null
      };

      if (isEditing && caseStudy) {
        const { error } = await updateCaseStudy(caseStudy.id, submitData);
        if (error) throw error;
      } else {
        const { error } = await createCaseStudy(submitData);
        if (error) throw error;
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving case study:', error);
      setErrors({ submit: '導入事例の保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const commonIndustries = [
    '製造業',
    'IT・通信',
    '金融・保険',
    '医療・ヘルスケア',
    '小売・eコマース',
    '教育',
    '不動産',
    '物流・運輸',
    'エネルギー',
    'その他'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? '導入事例編集' : '新規導入事例追加'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タイトル *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="導入事例のタイトルを入力"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提供企業 *
              </label>
              <select
                name="organization_id"
                value={formData.organization_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.organization_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">企業を選択</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
              {errors.organization_id && <p className="text-red-500 text-sm mt-1">{errors.organization_id}</p>}
            </div>

            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  name="is_anonymous"
                  checked={formData.is_anonymous}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  匿名事例として登録
                </span>
              </label>
            </div>
          </div>

          {/* クライアント情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                クライアント名 {!formData.is_anonymous && '*'}
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                disabled={formData.is_anonymous}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.client_name ? 'border-red-500' : 'border-gray-300'
                } ${formData.is_anonymous ? 'bg-gray-100' : ''}`}
                placeholder={formData.is_anonymous ? '匿名' : 'クライアント名を入力'}
              />
              {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業界
              </label>
              <select
                name="client_industry"
                value={formData.client_industry}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">業界を選択</option>
                {commonIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 詳細情報 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              課題
            </label>
            <textarea
              name="problem"
              value={formData.problem}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="クライアントが抱えていた課題を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              解決策
            </label>
            <textarea
              name="solution"
              value={formData.solution}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="提供した解決策を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成果
            </label>
            <textarea
              name="outcome"
              value={formData.outcome}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="得られた成果を入力"
            />
          </div>

          {/* 成果指標 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成果指標
            </label>
            <div className="space-y-2">
              {Object.entries(formData.metrics || {}).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <span className="flex-1 px-3 py-2 bg-gray-50 rounded border">
                    <strong>{key}:</strong> {String(value)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMetric(key)}
                    className="text-red-600 hover:text-red-700"
                  >
                    削除
                  </button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newMetricKey}
                  onChange={(e) => setNewMetricKey(e.target.value)}
                  placeholder="指標名（例：コスト削減率）"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMetricValue}
                    onChange={(e) => setNewMetricValue(e.target.value)}
                    placeholder="値（例：30%）"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addMetric}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                注目事例として表示
              </span>
            </label>
          </div>

          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : isEditing ? '更新' : '作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}