'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SalesMaterial } from '@/types/database';
import { logger } from '@/lib/utils/logger';

export default function MaterialViewPage() {
  const params = useParams();
  const router = useRouter();
  const materialId = params.id as string;
  
  const [material, setMaterial] = useState<SalesMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (materialId) {
      fetchMaterial();
      logMaterialView();
    }
  }, [materialId]);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/my/materials/${materialId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setMaterial(result.data);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch material:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch material');
    } finally {
      setLoading(false);
    }
  };

  const logMaterialView = async () => {
    try {
      // 重複計測防止: sessionStorageで同一セッション内の重複viewを防ぐ
      const sessionKey = `material_view_${materialId}`;
      const hasAlreadyViewed = sessionStorage.getItem(sessionKey);
      
      if (hasAlreadyViewed) {
        logger.debug('Debug', `Material ${materialId} already viewed in this session, skipping duplicate log`);
        return;
      }

      // 統計ログ送信
      const response = await fetch('/api/materials/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material_id: materialId,
          action: 'view',
          user_agent: navigator.userAgent,
        }),
      });

      // 成功時のみセッションフラグを設定
      if (response.ok) {
        sessionStorage.setItem(sessionKey, new Date().toISOString());
      }
      
    } catch (error) {
      // サイレントエラー：統計ログの失敗はユーザー体験に影響させない
      logger.warn('Failed to log material view', error);
    }
  };

  const handleDownload = async () => {
    if (!material) return;

    try {
      setDownloading(true);

      // ファイルダウンロードの実行（統計ログより先に実行）
      const downloadResponse = await fetch(`/api/my/materials/${materialId}/download`);
      
      if (!downloadResponse.ok) {
        throw new Error('Download failed');
      }

      // ダウンロード成功時に統計をログ（サイレントエラー）
      try {
        await fetch('/api/materials/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            material_id: materialId,
            action: 'download',
            user_agent: navigator.userAgent,
          }),
        });
      } catch (statsError) {
        // 統計ログ失敗はサイレント（ユーザー体験に影響させない）
        logger.warn('Failed to log download stats', statsError);
      }

      // ファイルダウンロード処理
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.title || 'material';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      logger.error('Download failed', error instanceof Error ? error : new Error(String(error)));
      alert('ダウンロードに失敗しました');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">営業資料が見つかりません</h1>
            <p className="text-gray-600 mb-6">{error || '指定された営業資料が存在しないか、アクセス権限がありません。'}</p>
            <Link
              href="/dashboard/materials"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              営業資料一覧に戻る
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ナビゲーション */}
        <div className="mb-6">
          <Link
            href="/dashboard/materials"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            営業資料一覧に戻る
          </Link>
        </div>

        {/* 営業資料詳細 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* ファイル情報 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ファイル情報</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">ファイル名</span>
                    <p className="text-sm text-gray-900">{material.title}</p>
                  </div>
                  {material.file_type && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">ファイル形式</span>
                      <p className="text-sm text-gray-900">{material.file_type}</p>
                    </div>
                  )}
                  {material.file_size && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">ファイルサイズ</span>
                      <p className="text-sm text-gray-900">
                        {(material.file_size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-500">アップロード日</span>
                    <p className="text-sm text-gray-900">
                      {new Date(material.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </div>
              </div>

              {/* アクション */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ダウンロード</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md inline-flex items-center justify-center"
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        ダウンロード中...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        ファイルをダウンロード
                      </>
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    ダウンロード時に統計が記録されます
                  </p>
                </div>
              </div>
            </div>

            {/* プレビュー領域（将来の拡張用） */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">プレビュー</h3>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  ファイルプレビュー機能は今後実装予定です
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}