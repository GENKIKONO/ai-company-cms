'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CaseStudy {
  id: string;
  title: string;
  description: string | null;
  client_name: string | null;
  industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  created_at: string;
  updated_at: string;
}

interface CaseStudyFormData {
  title: string;
  description: string;
  client_name: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
}

interface CaseStudiesTabProps {
  organizationId: string;
}

export default function CaseStudiesTab({ organizationId }: CaseStudiesTabProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: '',
    description: '',
    client_name: '',
    industry: '',
    challenge: '',
    solution: '',
    results: ''
  });

  useEffect(() => {
    fetchCaseStudies();
  }, [organizationId]);

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch(`/api/my/case-studies?organizationId=${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        setCaseStudies(result.data || []);
      } else {
        setError('事例一覧の取得に失敗しました');
      }
    } catch (error) {
      setError('事例一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      client_name: '',
      industry: '',
      challenge: '',
      solution: '',
      results: ''
    });
    setEditingCaseStudy(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (caseStudy: CaseStudy) => {
    setFormData({
      title: caseStudy.title,
      description: caseStudy.description || '',
      client_name: caseStudy.client_name || '',
      industry: caseStudy.industry || '',
      challenge: caseStudy.challenge || '',
      solution: caseStudy.solution || '',
      results: caseStudy.results || ''
    });
    setEditingCaseStudy(caseStudy);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = editingCaseStudy 
        ? `/api/my/case-studies/${editingCaseStudy.id}`
        : '/api/my/case-studies';
      
      const method = editingCaseStudy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, organizationId }),
      });

      if (response.ok) {
        await fetchCaseStudies();
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '事例の保存に失敗しました');
      }
    } catch (error) {
      setError('事例の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (caseStudyId: string) => {
    if (!confirm('この事例を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/my/case-studies/${caseStudyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCaseStudies();
      } else {
        setError('事例の削除に失敗しました');
      }
    } catch (error) {
      setError('事例の削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)] mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">事例管理</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新しい事例
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 事例一覧 */}
        {caseStudies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ事例が登録されていません
          </div>
        ) : (
          <div className="space-y-4">
            {caseStudies.map((caseStudy) => (
              <div key={caseStudy.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{caseStudy.title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">クライアント:</span>
                        <span className="ml-2 text-gray-600">{caseStudy.client_name || '-'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">業界:</span>
                        <span className="ml-2 text-gray-600">{caseStudy.industry || '-'}</span>
                      </div>
                    </div>
                    {caseStudy.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {caseStudy.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(caseStudy)}
                      className="text-[var(--aio-primary)] hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(caseStudy.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 事例作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCaseStudy ? '事例編集' : '新しい事例'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    概要
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      クライアント名
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      業界
                    </label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    課題
                  </label>
                  <textarea
                    rows={3}
                    value={formData.challenge}
                    onChange={(e) => setFormData(prev => ({ ...prev, challenge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    解決策
                  </label>
                  <textarea
                    rows={3}
                    value={formData.solution}
                    onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    結果・成果
                  </label>
                  <textarea
                    rows={3}
                    value={formData.results}
                    onChange={(e) => setFormData(prev => ({ ...prev, results: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)] disabled:opacity-50"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}