/**
 * SWR用データフェッチャー
 * AIOHub API エンドポイント用の汎用フェッチャー
 */

import type { JsonValue } from '@/lib/utils/ab-testing';

/**
 * フェッチエラー（SWR互換の例外型）
 */
export class FetchError extends Error {
  status: number;
  info?: JsonValue;

  constructor(message: string, status: number, info?: JsonValue) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.info = info;
  }
}

/**
 * 基本フェッチャー関数
 * SWRのfetcher関数として使用
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Cookie認証用
  });

  if (!response.ok) {
    let info: JsonValue | undefined;
    try {
      info = await response.json();
    } catch {
      // JSON parse失敗は無視
    }
    throw new FetchError('データの取得に失敗しました', response.status, info);
  }

  return response.json();
}

/**
 * POST リクエスト用フェッチャー
 */
export async function postFetcher<T = unknown, D = unknown>(url: string, data?: D): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    let info: JsonValue | undefined;
    try {
      info = await response.json();
    } catch {
      // JSON parse失敗は無視
    }
    throw new FetchError('リクエストに失敗しました', response.status, info);
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