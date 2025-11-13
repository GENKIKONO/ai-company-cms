// 統一されたAPI呼び出しフック
import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

// API エラー処理の統一
function processApiError(error: any): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Unknown error occurred';
}

// API レスポンス処理の統一
async function processApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // JSON解析に失敗した場合はHTTPステータスを使用
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
}

// 基本的なAPI呼び出しフック
export function useApiClient<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    url: string, 
    options: ApiOptions = {}
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: 'no-store'
      });

      const data = await processApiResponse<T>(response);
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const errorMessage = processApiError(error);
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// リスト取得専用フック
export function useApiList<T = any>(initialUrl?: string) {
  const [items, setItems] = useState<T[]>([]);
  const { data, loading, error, execute, reset } = useApiClient<{ data: T[] }>();

  const fetchItems = useCallback(async (url?: string) => {
    if (!url && !initialUrl) return;
    
    const result = await execute(url || initialUrl!);
    if (result?.data) {
      setItems(result.data);
    }
  }, [execute, initialUrl]);

  const addItem = useCallback((item: T) => {
    setItems(prev => [item, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, updatedItem: Partial<T>) => {
    setItems(prev => prev.map(item => 
      (item as any).id === id ? { ...item, ...updatedItem } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => (item as any).id !== id));
  }, []);

  const deleteItem = useCallback(async (id: string, endpoint?: string) => {
    if (!endpoint && !initialUrl) return false;
    
    const deleteUrl = endpoint || `${initialUrl}/${id}`;
    const result = await execute(deleteUrl, { method: 'DELETE' });
    
    if (result !== null) {
      removeItem(id);
      return true;
    }
    return false;
  }, [execute, initialUrl, removeItem]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
    deleteItem,
    reset: () => {
      setItems([]);
      reset();
    }
  };
}

// 単一リソース取得専用フック
export function useApiResource<T = any>(url?: string) {
  const { data, loading, error, execute, reset } = useApiClient<{ data: T }>();

  const fetchResource = useCallback(async (resourceUrl?: string) => {
    if (!resourceUrl && !url) return null;
    
    const result = await execute(resourceUrl || url!);
    return result?.data || null;
  }, [execute, url]);

  const updateResource = useCallback(async (
    updates: Partial<T>, 
    resourceUrl?: string
  ) => {
    if (!resourceUrl && !url) return null;
    
    const result = await execute(resourceUrl || url!, {
      method: 'PUT',
      body: updates
    });
    return result?.data || null;
  }, [execute, url]);

  const createResource = useCallback(async (
    resourceData: Partial<T>,
    createUrl?: string
  ) => {
    if (!createUrl && !url) return null;
    
    const result = await execute(createUrl || url!, {
      method: 'POST',
      body: resourceData
    });
    return result?.data || null;
  }, [execute, url]);

  return {
    resource: data?.data || null,
    loading,
    error,
    fetchResource,
    updateResource,
    createResource,
    reset
  };
}

// フォーム送信専用フック
export function useApiForm<T = any>() {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const submitForm = useCallback(async (
    url: string,
    formData: any,
    options: { 
      method?: 'POST' | 'PUT';
      successMessage?: string;
      onSuccess?: (data: T) => void;
    } = {}
  ) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch(url, {
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        cache: 'no-store'
      });

      const data = await processApiResponse<T>(response);
      
      setSubmitSuccess(options.successMessage || '正常に処理されました');
      options.onSuccess?.(data);
      
      return data;
    } catch (error) {
      const errorMessage = processApiError(error);
      setSubmitError(errorMessage);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(null);
  }, []);

  return {
    submitting,
    submitError,
    submitSuccess,
    submitForm,
    clearMessages
  };
}