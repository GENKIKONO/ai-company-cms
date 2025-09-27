'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { CaseStudy } from '@/types/database';
import PublicPageLinks from '../components/PublicPageLinks';

export default function CaseStudiesManagementPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my/case-studies', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setCaseStudies(result.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch case studies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch case studies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この事例を削除しますか？')) return;

    try {
      const response = await fetch(`/api/my/case-studies/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setCaseStudies(caseStudies.filter(caseStudy => caseStudy.id !== id));
    } catch (err) {
      console.error('Failed to delete case study:', err);
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">事例管理</h1>
              <p className="text-lg text-gray-600 mt-2">成功事例・実績を管理します</p>
            </div>
            <div className="flex items-center space-x-3">
              <PublicPageLinks contentType="case-studies" />
              <Link
                href="/dashboard/case-studies/new"
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新しい事例
              </Link>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ダッシュボードに戻る
          </Link>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 事例一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">事例一覧 ({caseStudies.length}件)</h2>
          </div>

          {caseStudies.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">事例がありません</h3>
              <p className="mt-2 text-sm text-gray-500">最初の事例を作成してみましょう。</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/case-studies/new"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  事例を作成
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {caseStudies.map((caseStudy) => (
                <div key={caseStudy.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {caseStudy.title}
                      </h3>
                      {caseStudy.problem && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700">課題</h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {caseStudy.problem}
                          </p>
                        </div>
                      )}
                      {caseStudy.solution && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700">解決策</h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {caseStudy.solution}
                          </p>
                        </div>
                      )}
                      {caseStudy.tags && caseStudy.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {caseStudy.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-sm text-gray-500">
                        <span>作成: {new Date(caseStudy.created_at).toLocaleDateString()}</span>
                        {caseStudy.updated_at !== caseStudy.created_at && (
                          <span className="ml-4">更新: {new Date(caseStudy.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={`/dashboard/case-studies/${caseStudy.id}/edit`}
                        className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(caseStudy.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}