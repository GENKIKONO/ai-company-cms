'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useFavorites } from '@/hooks/useFavorites';
import { trackPageView, trackEvent } from '@/lib/analytics';
import FavoriteButton from '@/components/FavoriteButton';

export default function FavoritesPage() {
  const { favorites, isLoading, clearAllFavorites } = useFavorites();

  useEffect(() => {
    // Analytics: ページビュー追跡
    trackPageView({
      url: '/favorites',
      referrer: document.referrer,
      title: 'お気に入り企業',
    });

    trackEvent({
      name: 'Favorites Page View',
      properties: {
        favorites_count: favorites.length,
      },
    });
  }, [favorites.length]);

  const handleClearAll = () => {
    if (confirm('すべてのお気に入りを削除しますか？この操作は取り消せません。')) {
      clearAllFavorites();
      
      trackEvent({
        name: 'Clear All Favorites',
        properties: {
          previous_count: favorites.length,
        },
      });
    }
  };

  const handleOrganizationClick = (organization: any) => {
    trackEvent({
      name: 'Organization Click',
      properties: {
        organization_id: organization.id,
        organization_name: organization.name,
        from_page: 'favorites',
        position: favorites.findIndex(fav => fav.id === organization.id) + 1,
      },
    });
  };

  const handleExportFavorites = () => {
    try {
      const dataStr = JSON.stringify(favorites, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `luxucare-favorites-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      trackEvent({
        name: 'Export Favorites',
        properties: {
          favorites_count: favorites.length,
        },
      });
    } catch (error) {
      console.error('Failed to export favorites:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">お気に入り企業</h1>
              <p className="mt-2 text-lg text-gray-600">
                {favorites.length}社をお気に入りに登録しています
              </p>
            </div>
            <div className="flex space-x-4">
              {favorites.length > 0 && (
                <>
                  <button
                    onClick={handleExportFavorites}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    エクスポート
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    全削除
                  </button>
                </>
              )}
              <Link
                href="/directory"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                企業を探す
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          // 空の状態
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 mb-6">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full text-gray-300"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              お気に入りの企業がありません
            </h3>
            <p className="text-gray-600 mb-8">
              気になる企業をお気に入りに追加して、後で簡単にアクセスできるようにしましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/directory"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                企業ディレクトリを見る
              </Link>
              <Link
                href="/"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        ) : (
          // お気に入りリスト
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((organization) => (
              <div key={organization.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {organization.logo_url && (
                        <Image
                          src={organization.logo_url}
                          alt={`${organization.name}のロゴ`}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {organization.name}
                        </h3>
                        {organization.address_region && (
                          <p className="text-sm text-gray-600">
                            📍 {organization.address_region}
                          </p>
                        )}
                      </div>
                    </div>
                    <FavoriteButton
                      organization={organization}
                      variant="icon"
                      size="md"
                    />
                  </div>
                  
                  {organization.industries && organization.industries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {organization.industries.slice(0, 3).map((industry) => (
                        <span
                          key={industry}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {industry}
                        </span>
                      ))}
                      {organization.industries.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{organization.industries.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 mb-4">
                    お気に入り追加日: {new Date(organization.addedAt).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/o/${organization.slug}`}
                      onClick={() => handleOrganizationClick(organization)}
                      className="flex-1 text-center px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                    >
                      詳細を見る
                    </Link>
                    <Link
                      href={`/compare?ids=${organization.id}`}
                      className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                    >
                      比較
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* お気に入り活用のヒント */}
        {favorites.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              💡 お気に入り活用のヒント
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <span>🔍</span>
                <span>複数の企業を比較機能で詳細比較できます</span>
              </div>
              <div className="flex items-start space-x-2">
                <span>📊</span>
                <span>エクスポート機能でデータを保存・共有できます</span>
              </div>
              <div className="flex items-start space-x-2">
                <span>🏷️</span>
                <span>業界タグで似た企業を簡単に見つけられます</span>
              </div>
              <div className="flex items-start space-x-2">
                <span>🔗</span>
                <span>お気に入りページのURLを共有して情報を共有できます</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}