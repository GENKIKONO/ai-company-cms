'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { HIGButton } from '@/design-system';
import { getCurrentUser } from '@/lib/auth';
import { getOrganization } from '@/lib/organizations';
import { createCaseStudy } from '@/lib/case-studies';
import { type AppUser, type Organization, type CaseStudyFormData } from '@/types/database';
import { logger } from '@/lib/utils/logger';

export default function NewCaseStudyPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: '',
    problem: '',
    solution: '',
    result: '',
    tags: []
  });

  const [newTag, setNewTag] = useState('');


  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          router.push('/login');
          return;
        }
        
        setUser(currentUser);
        
        const orgResult = await getOrganization(organizationId);

        if (orgResult.data) {
          setOrganization(orgResult.data);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        logger.error('Failed to fetch data', error instanceof Error ? error : new Error(String(error)));
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId, router]);

  const handleInputChange = (field: keyof CaseStudyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await createCaseStudy(organizationId, formData);
      
      if (result.data) {
        router.push(`/organizations/${organizationId}/case-studies/${result.data.id}`);
      } else {
        setErrors({ submit: 'ケーススタディの作成に失敗しました' });
      }
    } catch (error) {
      logger.error('Failed to create case study', error instanceof Error ? error : new Error(String(error)));
      setErrors({ submit: 'ケーススタディの作成に失敗しました' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--aio-primary)]"></div>
        <span className="ml-3 text-gray-600">読み込み中...</span>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">企業が見つかりません</h2>
          <Link href="/dashboard" className="mt-4 text-[var(--aio-primary)] hover:text-[var(--aio-primary-hover)]">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-[var(--aio-primary)]">
                AIO Hub AI企業CMS
              </Link>
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  ダッシュボード
                </Link>
                <Link href="/organizations" className="text-[var(--aio-primary)] font-medium">
                  企業ディレクトリ
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                こんにちは、{user?.full_name || user?.email}さん
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* パンくずナビ */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                ダッシュボード
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href={`/organizations/${organizationId}`} className="text-gray-500 hover:text-gray-700">
                {organization.name}
              </Link>
            </li>
            <li>
              <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-gray-900 font-medium">新しいケーススタディを追加</span>
            </li>
          </ol>
        </nav>

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新しいケーススタディを追加</h1>
          <p className="text-lg text-gray-600">
            {organization.name}の導入事例を追加してください
          </p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* 基本情報 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="例: 業務効率化により月間工数を大幅削減"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>
            </div>
          </div>

          {/* ケーススタディ内容 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ケーススタディ内容</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">
                  課題・問題
                </label>
                <textarea
                  id="problem"
                  rows={4}
                  value={formData.problem || ''}
                  onChange={(e) => handleInputChange('problem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="導入前に抱えていた課題や問題点を記載してください"
                />
              </div>

              <div>
                <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">
                  解決策
                </label>
                <textarea
                  id="solution"
                  rows={4}
                  value={formData.solution || ''}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="どのように課題を解決したかを記載してください"
                />
              </div>

              <div>
                <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-2">
                  成果・結果
                </label>
                <textarea
                  id="result"
                  rows={4}
                  value={formData.result || ''}
                  onChange={(e) => handleInputChange('result', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  placeholder="導入後に得られた成果や効果を記載してください"
                />
              </div>
            </div>
          </div>

          {/* タグ */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">タグ</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  タグを追加
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="例: 業務効率化, AI導入, コスト削減"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  />
                  <HIGButton
                    type="button"
                    onClick={addTag}
                    variant="primary"
                    size="sm"
                  >
                    追加
                  </HIGButton>
                </div>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">登録済みタグ:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-[var(--aio-primary)] hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <Link
                href={`/organizations/${organizationId}`}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </Link>
              <HIGButton
                type="submit"
                disabled={submitting}
                variant="primary"
                size="md"
              >
                {submitting ? '作成中...' : 'ケーススタディを作成'}
              </HIGButton>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}