/**
 * SWR用データフェッチャー
 * AIO Hub API エンドポイント用の汎用フェッチャー
 */

/**
 * 基本フェッチャー関数
 * SWRのfetcher関数として使用
 */
export async function fetcher(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Cookie認証用
  });

  if (!response.ok) {
    const error = new Error('データの取得に失敗しました');
    
    // レスポンスの詳細をエラーに付加
    try {
      const errorData = await response.json();
      (error as any).info = errorData;
      (error as any).status = response.status;
    } catch {
      (error as any).status = response.status;
    }
    
    throw error;
  }

  return response.json();
}

/**
 * POST リクエスト用フェッチャー
 */
export async function postFetcher(url: string, data?: any): Promise<any> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = new Error('リクエストに失敗しました');
    
    try {
      const errorData = await response.json();
      (error as any).info = errorData;
      (error as any).status = response.status;
    } catch {
      (error as any).status = response.status;
    }
    
    throw error;
  }

  return response.json();
}

/**
 * ファイルダウンロード用フェッチャー
 */
export async function downloadFetcher(url: string, filename?: string): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('ファイルのダウンロードに失敗しました');
  }

  // ファイルをダウンロード
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'export.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(downloadUrl);
}