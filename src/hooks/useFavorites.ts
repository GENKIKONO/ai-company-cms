// お気に入り機能のReactフック

import { useState, useEffect } from 'react';
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  clearFavorites,
  FavoriteOrganization,
} from '@/lib/favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // お気に入りリストを更新
  const updateFavorites = () => {
    setFavorites(getFavorites());
  };

  useEffect(() => {
    // 初期化時にお気に入りリストを読み込み
    updateFavorites();
    setIsLoading(false);

    // お気に入り変更イベントをリッスン
    const handleFavoritesChanged = () => {
      updateFavorites();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged);
    };
  }, []);

  // お気に入りに追加
  const addFavorite = (organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    industries?: string[];
    address_region?: string;
  }) => {
    addToFavorites(organization);
  };

  // お気に入りから削除
  const removeFavorite = (organizationId: string) => {
    removeFromFavorites(organizationId);
  };

  // お気に入り状態をトグル
  const toggleFavorite = (organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    industries?: string[];
    address_region?: string;
  }) => {
    if (isFavorite(organization.id)) {
      removeFavorite(organization.id);
    } else {
      addFavorite(organization);
    }
  };

  // 全削除
  const clearAllFavorites = () => {
    clearFavorites();
  };

  // 指定した企業がお気に入りかどうか
  const checkIsFavorite = (organizationId: string): boolean => {
    return favorites.some(fav => fav.id === organizationId);
  };

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearAllFavorites,
    isFavorite: checkIsFavorite,
    count: favorites.length,
  };
}