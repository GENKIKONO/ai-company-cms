'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Post {
  id: string;
  title: string;
  body: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

interface PostFormData {
  title: string;
  body: string;
  status: 'draft' | 'published';
}

interface PostsTabProps {
  organizationId: string;
  organizationSlug?: string;
}

export default function PostsTab({ organizationId, organizationSlug }: PostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    body: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchPosts();
  }, [organizationId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/my/posts');
      if (response.ok) {
        const result = await response.json();
        setPosts(result.data || []);
      } else {
        setError('記事一覧の取得に失敗しました');
      }
    } catch (error) {
      setError('記事一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      status: 'draft'
    });
    setEditingPost(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (post: Post) => {
    setFormData({
      title: post.title,
      body: post.body || '',
      status: post.status
    });
    setEditingPost(post);
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
      const url = editingPost 
        ? `/api/posts/${editingPost.id}`
        : `/api/organizations/${organizationId}/posts`;
      
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPosts();
        resetForm();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '記事の保存に失敗しました');
      }
    } catch (error) {
      setError('記事の保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('この記事を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/my/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
      } else {
        setError('記事の削除に失敗しました');
      }
    } catch (error) {
      setError('記事の削除に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (status: string) => {
    return status === 'published' ? '公開' : '下書き';
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
          <h2 className="text-lg font-semibold text-gray-900">記事管理</h2>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-[var(--aio-primary)] text-white rounded-md hover:bg-[var(--aio-primary-hover)]"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新しい記事
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 記事一覧 */}
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            まだ記事が登録されていません
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusBadge(post.status)}`}>
                        {getStatusText(post.status)}
                      </span>
                    </div>
                    {post.body && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {post.body.length > 100 ? post.body.substring(0, 100) + '...' : post.body}
                      </p>
                    )}
                    <div className="text-xs text-gray-500">
                      作成: {new Date(post.created_at).toLocaleDateString()}
                      {post.published_at && (
                        <span className="ml-4">
                          公開: {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}
                      {post.author && (
                        <span className="ml-4">
                          投稿者: {post.author.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {post.status === 'published' && organizationSlug && (
                      <a
                        href={`/o/${organizationSlug}/posts/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-900"
                        title="公開ページを表示"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-[var(--aio-primary)] hover:text-blue-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
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

        {/* 記事作成・編集フォーム */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingPost ? '記事編集' : '新しい記事'}
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
                    本文（Markdown対応）
                  </label>
                  <textarea
                    rows={12}
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="Markdownで記事を書いてください..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Markdown記法が使用できます（見出し、リスト、リンク、画像など）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--aio-primary)]"
                  >
                    <option value="draft">下書き</option>
                    <option value="published">公開</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    公開にすると、公開ページで閲覧できるようになります
                  </p>
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