// お気に入り機能のユーティリティ（localStorage使用）

const FAVORITES_KEY = 'luxucare_favorites';

export interface FavoriteOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industries?: string[];
  address_region?: string;
  addedAt: string;
}

// お気に入りリストを取得
export function getFavorites(): FavoriteOrganization[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
}

// お気に入りに追加
export function addToFavorites(organization: {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  industries?: string[];
  address_region?: string;
}): void {
  if (typeof window === 'undefined') return;
  
  try {
    const favorites = getFavorites();
    
    // 既に追加されているかチェック
    if (favorites.some(fav => fav.id === organization.id)) {
      return;
    }
    
    const newFavorite: FavoriteOrganization = {
      ...organization,
      addedAt: new Date().toISOString(),
    };
    
    const updatedFavorites = [newFavorite, ...favorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    
    // カスタムイベントを発火して他のコンポーネントに通知
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { action: 'added', organization: newFavorite }
    }));
  } catch (error) {
    console.error('Failed to add to favorites:', error);
  }
}

// お気に入りから削除
export function removeFromFavorites(organizationId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== organizationId);
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { action: 'removed', organizationId }
    }));
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
  }
}

// お気に入りに含まれているかチェック
export function isFavorite(organizationId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === organizationId);
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return false;
  }
}

// お気に入りの数を取得
export function getFavoritesCount(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const favorites = getFavorites();
    return favorites.length;
  } catch (error) {
    console.error('Failed to get favorites count:', error);
    return 0;
  }
}

// お気に入りをクリア（全削除）
export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(FAVORITES_KEY);
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { action: 'cleared' }
    }));
  } catch (error) {
    console.error('Failed to clear favorites:', error);
  }
}

// お気に入りをエクスポート（JSON形式）
export function exportFavorites(): string {
  try {
    const favorites = getFavorites();
    return JSON.stringify(favorites, null, 2);
  } catch (error) {
    console.error('Failed to export favorites:', error);
    return '[]';
  }
}

// お気に入りをインポート
export function importFavorites(jsonData: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const importedFavorites = JSON.parse(jsonData);
    
    // バリデーション
    if (!Array.isArray(importedFavorites)) {
      throw new Error('Invalid data format');
    }
    
    // 既存のお気に入りと重複を避けてマージ
    const existingFavorites = getFavorites();
    const existingIds = new Set(existingFavorites.map(fav => fav.id));
    
    const newFavorites = importedFavorites.filter(
      (fav: any) => fav.id && fav.name && !existingIds.has(fav.id)
    );
    
    const mergedFavorites = [...existingFavorites, ...newFavorites];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(mergedFavorites));
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
      detail: { action: 'imported', count: newFavorites.length }
    }));
    
    return true;
  } catch (error) {
    console.error('Failed to import favorites:', error);
    return false;
  }
}