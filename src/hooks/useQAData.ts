'use client';

import { useState, useEffect } from 'react';
import type { QACategory, QAEntry } from '@/types/database';

export function useQAData() {
  const [categories, setCategories] = useState<QACategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setError(null);
      const response = await fetch('/api/my/qa/categories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = () => {
    setLoading(true);
    fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refreshCategories
  };
}

export function useQAEntries(filters?: {
  status?: string;
  category_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const [entries, setEntries] = useState<QAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const fetchEntries = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category_id) params.append('category_id', filters.category_id);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/my/qa/entries?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch entries');
      }
      
      const data = await response.json();
      setEntries(data.data || []);
      
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshEntries = () => {
    setLoading(true);
    fetchEntries();
  };

  useEffect(() => {
    fetchEntries();
  }, [filters?.status, filters?.category_id, filters?.search, filters?.page, filters?.limit]);

  return {
    entries,
    loading,
    error,
    pagination,
    refreshEntries
  };
}

export function useQASearch(query: string, options?: {
  category_id?: string;
  limit?: number;
}) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        q: searchQuery.trim()
      });
      
      if (options?.category_id) params.append('category_id', options.category_id);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/my/qa/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, options?.category_id, options?.limit]);

  return {
    results,
    loading,
    error,
    search
  };
}