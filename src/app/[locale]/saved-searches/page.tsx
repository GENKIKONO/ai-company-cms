'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useSavedSearches } from '@/hooks/useSavedSearches';
import AuthModal from '@/components/auth/AuthModal';
import { trackPageView, trackEvent } from '@/lib/analytics';

export default function SavedSearchesPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    searches,
    loading: searchesLoading,
    error,
    deleteSearch,
    duplicateSearch,
    applySearch,
    getSearchSummary,
  } = useSavedSearches();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedSearch, setSelectedSearch] = useState<string | null>(null);

  useEffect(() => {
    // Analytics: ページビュー追跡
    trackPageView({
      url: '/saved-searches',
      referrer: document.referrer,
      title: '保存した検索',
    });

    if (user) {
      trackEvent({
        name: 'Saved Searches Page View',
        properties: {
          user_id: user.id,
          searches_count: searches.length,
        },
      });
    }
  }, [user, searches.length]);

  const handleDeleteSearch = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      await deleteSearch(id);
    } catch (error) {
      console.error('Failed to delete search:', error);
      alert('検索条件の削除に失敗しました。');
    }
  };

  const handleDuplicateSearch = async (search: any) => {
    try {
      await duplicateSearch(search);
    } catch (error) {
      console.error('Failed to duplicate search:', error);
      alert('検索条件の複製に失敗しました。');
    }
  };

  const handleApplySearch = (search: any) => {
    applySearch(search);
  };

  if (authLoading) {
    return (
      <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
        <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto\"></div>
          <p className=\"mt-4 text-gray-600\">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">
          <div className=\"text-center max-w-md mx-auto px-4\">
            <div className=\"w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6\">
              <svg className=\"w-8 h-8 text-indigo-600\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
                <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z\" />
              </svg>
            </div>
            <h1 className=\"text-2xl font-bold text-gray-900 mb-4\">
              保存した検索条件
            </h1>
            <p className=\"text-gray-600 mb-8\">
              検索条件を保存して、いつでも素早く検索できるようになります。<br />
              ログインして検索条件を保存しましょう。
            </p>
            <div className=\"space-y-4\">
              <button
                onClick={() => setAuthModalOpen(true)}
                className=\"w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors\"
              >
                ログイン・アカウント作成
              </button>
              <Link
                href=\"/directory\"
                className=\"block w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors\"
              >
                企業を検索する
              </Link>
            </div>
          </div>
        </div>
        
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className=\"min-h-screen bg-gray-50\">
      {/* ヘッダー */}
      <div className=\"bg-white shadow\">
        <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
          <div className=\"flex items-center justify-between\">
            <div>
              <h1 className=\"text-3xl font-bold text-gray-900\">保存した検索</h1>
              <p className=\"mt-2 text-lg text-gray-600\">
                {searches.length}件の検索条件を保存しています
              </p>
            </div>
            <Link
              href=\"/directory\"
              className=\"bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700\"
            >
              新しい検索
            </Link>
          </div>
        </div>
      </div>

      <div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8\">
        {error && (
          <div className=\"mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg\">
            エラー: {error}
          </div>
        )}

        {searchesLoading ? (
          <div className=\"text-center py-16\">
            <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto\"></div>
            <p className=\"mt-4 text-gray-600\">検索条件を読み込み中...</p>
          </div>
        ) : searches.length === 0 ? (
          // 空の状態
          <div className=\"text-center py-16\">
            <div className=\"mx-auto w-24 h-24 mb-6\">
              <svg
                fill=\"none\"
                stroke=\"currentColor\"
                viewBox=\"0 0 24 24\"
                className=\"w-full h-full text-gray-300\"
              >
                <path
                  strokeLinecap=\"round\"
                  strokeLinejoin=\"round\"
                  strokeWidth={1}
                  d=\"M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z\"
                />
              </svg>
            </div>
            <h3 className=\"text-xl font-medium text-gray-900 mb-2\">
              保存された検索条件がありません
            </h3>
            <p className=\"text-gray-600 mb-8\">
              企業ディレクトリで検索を行い、よく使う条件を保存しましょう。
            </p>
            <div className=\"flex flex-col sm:flex-row gap-4 justify-center\">
              <Link
                href=\"/directory\"
                className=\"bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors\"
              >
                企業を検索する
              </Link>
              <Link
                href=\"/\"
                className=\"border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors\"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        ) : (
          // 検索条件リスト
          <div className=\"space-y-4\">
            {searches.map((search) => (
              <div key={search.id} className=\"bg-white rounded-lg shadow border overflow-hidden\">
                <div className=\"p-6\">
                  <div className=\"flex items-start justify-between\">
                    <div className=\"flex-1 min-w-0\">
                      <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">
                        {search.name}
                      </h3>
                      <p className=\"text-sm text-gray-600 mb-3\">
                        {getSearchSummary(search)}
                      </p>
                      <div className=\"flex items-center text-xs text-gray-500 space-x-4\">
                        <span>
                          作成日: {new Date(search.created_at).toLocaleDateString()}
                        </span>
                        {search.updated_at !== search.created_at && (
                          <span>
                            更新日: {new Date(search.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className=\"flex items-center space-x-2 ml-4\">
                      {/* メニューボタン */}
                      <div className=\"relative\">
                        <button
                          onClick={() => setSelectedSearch(selectedSearch === search.id ? null : search.id)}
                          className=\"p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100\"
                        >
                          <svg className=\"w-5 h-5\" fill=\"currentColor\" viewBox=\"0 0 20 20\">
                            <path d=\"M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z\" />
                          </svg>
                        </button>
                        
                        {selectedSearch === search.id && (
                          <div className=\"absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200\">
                            <button
                              onClick={() => handleDuplicateSearch(search)}
                              className=\"block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100\"
                            >
                              複製
                            </button>
                            <button
                              onClick={() => handleDeleteSearch(search.id, search.name)}
                              className=\"block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100\"
                            >
                              削除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className=\"mt-4 flex space-x-3\">
                    <button
                      onClick={() => handleApplySearch(search)}
                      className=\"flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors\"
                    >
                      この条件で検索
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 活用のヒント */}
        {searches.length > 0 && (
          <div className=\"mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6\">
            <h3 className=\"text-lg font-medium text-blue-900 mb-3\">
              💡 保存した検索の活用ヒント
            </h3>
            <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800\">
              <div className=\"flex items-start space-x-2\">
                <span>🔄</span>
                <span>定期的に同じ条件で検索して新しい企業を発見</span>
              </div>
              <div className=\"flex items-start space-x-2\">
                <span>📋</span>
                <span>複製機能で似た条件の検索を素早く作成</span>
              </div>
              <div className=\"flex items-start space-x-2\">
                <span>🎯</span>
                <span>業界や地域別に複数の検索条件を保存</span>
              </div>
              <div className=\"flex items-start space-x-2\">
                <span>⚡</span>
                <span>ワンクリックで複雑な検索条件を適用</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}