'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Post } from '@/types/database';
import { PrimaryCTA } from '@/design-system';
import PublicPageLinks from '../components/PublicPageLinks';
import { logger } from '@/lib/utils/logger';

export default function PostsManagementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/my/posts', {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setPosts(result.data || []);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この記事を削除しますか？')) return;

    try {
      const response = await fetch(`/api/my/posts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // リストから削除
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      logger.error('Failed to delete post:', err);
      alert('削除に失敗しました: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getStatusText = (status: string) => {
    const text = {
      draft: '下書き',
      published: '公開中'
    };
    return text[status as keyof typeof text] || '不明';
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
              <h1 className="text-3xl font-bold text-gray-900">記事管理</h1>
              <p className="text-lg text-gray-600 mt-2">ブログ記事やニュースを管理します</p>
            </div>
            <div className="flex items-center space-x-3">
              <PublicPageLinks contentType="posts" />
              <Link
                href="/dashboard/posts/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                新しい記事
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

        {/* 記事一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">記事一覧 ({posts.length}件)</h2>
          </div>

          {posts.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">記事がありません</h3>
              <p className="mt-2 text-sm text-gray-500">最初の記事を作成してみましょう。</p>
              <div className="mt-6">
                <Link
                  href="/dashboard/posts/new"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  記事を作成
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {post.title}
                      </h3>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>スラッグ: {post.slug}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(post.status)}`}>
                          {getStatusText(post.status)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>作成: {new Date(post.created_at).toLocaleDateString()}</span>
                        {post.updated_at !== post.created_at && (
                          <span className="ml-4">更新: {new Date(post.updated_at).toLocaleDateString()}</span>
                        )}
                        {post.published_at && (
                          <span className="ml-4">公開: {new Date(post.published_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <PrimaryCTA
                        href={`/dashboard/posts/${post.id}/edit`}
                        size="small"
                      >
                        編集
                      </PrimaryCTA>
                      <button
                        onClick={() => handleDelete(post.id)}
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