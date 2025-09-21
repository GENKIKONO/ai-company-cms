'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { savedSearches, SavedSearch } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';

export function useSavedSearches() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSearches = async () => {
    if (!user) {
      setSearches([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await savedSearches.list(user.id);
      setSearches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved searches');
      console.error('Failed to load saved searches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSearches();
  }, [user]);

  const saveSearch = async (name: string, searchParams: SavedSearch['search_params']) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const newSearch = await savedSearches.save(user.id, name, searchParams);
      setSearches(prev => [newSearch, ...prev]);
      
      trackEvent({
        name: 'Saved Search Create',
        properties: {
          user_id: user.id,
          search_name: name,
          filters_count: Object.keys(searchParams).filter(key => searchParams[key as keyof typeof searchParams]).length,
        },
      });

      return newSearch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSearch = async (id: string, updates: Partial<SavedSearch>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const updatedSearch = await savedSearches.update(id, updates);
      setSearches(prev => prev.map(search => 
        search.id === id ? updatedSearch : search
      ));
      
      trackEvent({
        name: 'Saved Search Update',
        properties: {
          user_id: user.id,
          search_id: id,
          fields_updated: Object.keys(updates),
        },
      });

      return updatedSearch;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update search');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      await savedSearches.delete(id);
      setSearches(prev => prev.filter(search => search.id !== id));
      
      trackEvent({
        name: 'Saved Search Delete',
        properties: {
          user_id: user.id,
          search_id: id,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete search');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const duplicateSearch = async (originalSearch: SavedSearch, newName?: string) => {
    if (!user) throw new Error('User not authenticated');

    const name = newName || `${originalSearch.name} (コピー)`;
    
    try {
      const duplicatedSearch = await saveSearch(name, originalSearch.search_params);
      
      trackEvent({
        name: 'Saved Search Duplicate',
        properties: {
          user_id: user.id,
          original_search_id: originalSearch.id,
          new_search_id: duplicatedSearch.id,
        },
      });

      return duplicatedSearch;
    } catch (err) {
      throw err;
    }
  };

  const applySearch = (search: SavedSearch) => {
    trackEvent({
      name: 'Saved Search Apply',
      properties: {
        user_id: user?.id,
        search_id: search.id,
        search_name: search.name,
      },
    });

    // URLSearchParamsを構築
    const params = new URLSearchParams();
    
    if (search.search_params.query) params.set('q', search.search_params.query);
    if (search.search_params.industry) params.set('industry', search.search_params.industry);
    if (search.search_params.region) params.set('region', search.search_params.region);
    if (search.search_params.size) params.set('size', search.search_params.size);
    if (search.search_params.founded) params.set('founded', search.search_params.founded);
    if (search.search_params.has_url) params.set('has_url', 'true');
    if (search.search_params.has_logo) params.set('has_logo', 'true');
    if (search.search_params.has_services) params.set('has_services', 'true');
    if (search.search_params.has_case_studies) params.set('has_case_studies', 'true');

    // ディレクトリページに遷移
    window.location.href = `/directory?${params.toString()}`;
  };

  const getSearchSummary = (search: SavedSearch): string => {
    const conditions: string[] = [];
    
    if (search.search_params.query) {
      conditions.push(`検索: "${search.search_params.query}"`);
    }
    if (search.search_params.industry) {
      conditions.push(`業界: ${search.search_params.industry}`);
    }
    if (search.search_params.region) {
      conditions.push(`地域: ${search.search_params.region}`);
    }
    if (search.search_params.size) {
      const sizeLabels = {
        small: '小企業（50名以下）',
        medium: '中企業（51-300名）',
        large: '大企業（301名以上）',
      };
      conditions.push(`規模: ${sizeLabels[search.search_params.size as keyof typeof sizeLabels]}`);
    }
    if (search.search_params.founded) {
      const foundedLabels = {
        recent: '2020年以降設立',
        established: '2010-2019年設立',
        mature: '2009年以前設立',
      };
      conditions.push(`設立: ${foundedLabels[search.search_params.founded as keyof typeof foundedLabels]}`);
    }

    const features: string[] = [];
    if (search.search_params.has_url) features.push('公式サイト');
    if (search.search_params.has_logo) features.push('ロゴ');
    if (search.search_params.has_services) features.push('サービス情報');
    if (search.search_params.has_case_studies) features.push('導入事例');
    
    if (features.length > 0) {
      conditions.push(`特徴: ${features.join('・')}あり`);
    }

    return conditions.length > 0 ? conditions.join(', ') : '条件なし';
  };

  return {
    searches,
    loading,
    error,
    saveSearch,
    updateSearch,
    deleteSearch,
    duplicateSearch,
    applySearch,
    getSearchSummary,
    refreshSearches: loadSearches,
  };
}