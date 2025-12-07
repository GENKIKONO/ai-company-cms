'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface Document {
  id: string;
  display_name: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  bucket_id: string;
  object_path: string;
  created_at: string;
  language_code: string;
}

interface DocumentListProps {
  organizationId: string;
}

export default function DocumentList({ organizationId }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/my/org-docs/files?organizationId=${organizationId}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('認証が必要です。ログインし直してください。');
        } else if (response.status === 403) {
          throw new Error('アクセス権限がありません。');
        } else if (response.status >= 500) {
          const errorMsg = errorData.error || 'サーバーエラーが発生しました。';
          throw new Error(errorMsg);
        } else {
          const errorMsg = errorData.error || errorData.message || response.statusText;
          throw new Error(`HTTP ${response.status}: ${errorMsg}`);
        }
      }

      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents || []);
      } else {
        throw new Error(result.error || '文書一覧の取得に失敗しました。');
      }

    } catch (error) {
      logger.error('Failed to fetch documents:', { data: error });
      setError(error instanceof Error ? error.message : '文書一覧の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDocuments();
  }, [organizationId, fetchDocuments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusDisplay = (status: Document['status']) => {
    switch (status) {
      case 'uploaded':
        return { text: 'アップロード済み', color: 'bg-blue-100 text-blue-800' };
      case 'processing':
        return { text: '処理中', color: 'bg-yellow-100 text-yellow-800' };
      case 'ready':
        return { text: '利用可能', color: 'bg-green-100 text-green-800' };
      case 'error':
        return { text: 'エラー', color: 'bg-red-100 text-red-800' };
      default:
        return { text: '不明', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">アップロード済み文書</h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">アップロード済み文書</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラー</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">アップロード済み文書</h3>
          <span className="text-sm text-gray-500">
            {documents.length}件の文書
          </span>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">文書がありません</h3>
          <p className="text-sm text-gray-500">
            まず文書をアップロードしてください。AIチャットタブから文書をアップロードできます。
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {documents.map((document, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {document.display_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(document.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(document.status).color}`}>
                    {getStatusDisplay(document.status).text}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}