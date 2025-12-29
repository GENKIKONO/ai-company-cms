/**
 * ファイルスキャンバリデーションユーティリティ
 *
 * 公開時にファイルがスキャン済み（passed）であることを確認
 *
 * 【DB依存関係】
 * - テーブル: file_scans (bucket, path, scan_status, engine, detail, scanned_at)
 * - scan_status: 'pending' | 'passed' | 'blocked' | 'failed'
 * - デフォルトバケット: 'public-assets'
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type ScanStatus = 'pending' | 'passed' | 'blocked' | 'failed';

export interface FileScanResult {
  path: string;
  status: ScanStatus | null;
  passed: boolean;
}

export interface FileScanValidationResult {
  valid: boolean;
  results: FileScanResult[];
  failedPaths: string[];
}

/**
 * ストレージURLからバケットとパスを抽出
 *
 * @param url - ストレージURL（絶対URL or 相対パス）
 * @param defaultBucket - デフォルトバケット名
 * @returns { bucket, path } または null
 */
export function extractBucketPath(
  url: string | null | undefined,
  defaultBucket = 'public-assets'
): { bucket: string; path: string } | null {
  if (!url) return null;

  // 相対パスの場合
  if (!url.startsWith('http')) {
    // /bucket/path/to/file.jpg 形式
    const parts = url.replace(/^\/+/, '').split('/');
    if (parts.length >= 2) {
      return {
        bucket: parts[0],
        path: parts.slice(1).join('/'),
      };
    }
    // bucket指定なしの相対パス
    return {
      bucket: defaultBucket,
      path: url.replace(/^\/+/, ''),
    };
  }

  // Supabase Storage URL形式
  // https://xxx.supabase.co/storage/v1/object/public/bucket/path
  const supabaseMatch = url.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/
  );
  if (supabaseMatch) {
    return {
      bucket: supabaseMatch[1],
      path: decodeURIComponent(supabaseMatch[2]),
    };
  }

  // 直接URL（CDN等）からパスを抽出
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.replace(/^\/+/, '');
    const parts = pathname.split('/');
    if (parts.length >= 2) {
      return {
        bucket: parts[0],
        path: parts.slice(1).join('/'),
      };
    }
  } catch {
    // URL解析失敗
  }

  return null;
}

/**
 * 単一ファイルのスキャンステータスを取得
 *
 * @param supabase - Supabaseクライアント
 * @param bucket - バケット名
 * @param path - ファイルパス
 * @returns スキャンステータス（未登録の場合はnull）
 */
export async function getFileScanStatus(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<ScanStatus | null> {
  const { data, error } = await supabase
    .from('file_scans')
    .select('scan_status')
    .eq('bucket', bucket)
    .eq('path', path)
    .single();

  if (error || !data) {
    return null;
  }

  return data.scan_status as ScanStatus;
}

/**
 * 複数ファイルのスキャンステータスを一括取得
 *
 * @param supabase - Supabaseクライアント
 * @param files - { bucket, path }[] の配列
 * @returns 各ファイルのスキャン結果
 */
export async function getFileScanStatuses(
  supabase: SupabaseClient,
  files: { bucket: string; path: string }[]
): Promise<FileScanResult[]> {
  if (files.length === 0) {
    return [];
  }

  // file_scansテーブルから一括取得
  // (bucket, path) の複合条件で検索
  const results: FileScanResult[] = [];

  for (const file of files) {
    const status = await getFileScanStatus(supabase, file.bucket, file.path);
    results.push({
      path: `${file.bucket}/${file.path}`,
      status,
      passed: status === 'passed',
    });
  }

  return results;
}

/**
 * 公開に必要なファイルがすべてスキャン済み（passed）かを検証
 *
 * @param supabase - Supabaseクライアント
 * @param urls - 検証対象のURL配列
 * @param defaultBucket - デフォルトバケット名
 * @returns 検証結果
 */
export async function validateFilesForPublish(
  supabase: SupabaseClient,
  urls: (string | null | undefined)[],
  defaultBucket = 'public-assets'
): Promise<FileScanValidationResult> {
  // URLからバケット/パスを抽出
  const files = urls
    .map((url) => extractBucketPath(url, defaultBucket))
    .filter((f): f is { bucket: string; path: string } => f !== null);

  if (files.length === 0) {
    return {
      valid: true,
      results: [],
      failedPaths: [],
    };
  }

  // スキャンステータスを取得
  const results = await getFileScanStatuses(supabase, files);

  // 失敗したパスを収集
  const failedPaths = results
    .filter((r) => !r.passed)
    .map((r) => r.path);

  return {
    valid: failedPaths.length === 0,
    results,
    failedPaths,
  };
}

/**
 * postsのメタデータから画像URLを抽出
 *
 * @param meta - posts.meta JSON
 * @returns 画像URL配列
 */
export function extractImageUrlsFromPostMeta(
  meta: Record<string, unknown> | null
): string[] {
  if (!meta) return [];

  const urls: string[] = [];

  // meta.images 配列
  if (Array.isArray(meta.images)) {
    urls.push(...meta.images.filter((u): u is string => typeof u === 'string'));
  }

  // meta.image 単一
  if (typeof meta.image === 'string') {
    urls.push(meta.image);
  }

  // meta.featured_image
  if (typeof meta.featured_image === 'string') {
    urls.push(meta.featured_image);
  }

  // meta.thumbnail
  if (typeof meta.thumbnail === 'string') {
    urls.push(meta.thumbnail);
  }

  // meta.ogp_image
  if (typeof meta.ogp_image === 'string') {
    urls.push(meta.ogp_image);
  }

  return urls;
}

/**
 * servicesのレコードから画像URLを抽出
 *
 * @param service - サービスレコード
 * @returns 画像URL配列
 */
export function extractImageUrlsFromService(
  service: Record<string, unknown> | null
): string[] {
  if (!service) return [];

  const urls: string[] = [];

  // image_url
  if (typeof service.image_url === 'string') {
    urls.push(service.image_url);
  }

  // thumbnail_url
  if (typeof service.thumbnail_url === 'string') {
    urls.push(service.thumbnail_url);
  }

  // media配列内のURL
  if (Array.isArray(service.media)) {
    for (const item of service.media) {
      if (typeof item === 'object' && item !== null) {
        if (typeof (item as Record<string, unknown>).url === 'string') {
          urls.push((item as Record<string, unknown>).url as string);
        }
      }
    }
  }

  return urls;
}

/**
 * case_studiesのレコードから画像URLを抽出
 *
 * @param caseStudy - 事例レコード
 * @returns 画像URL配列
 */
export function extractImageUrlsFromCaseStudy(
  caseStudy: Record<string, unknown> | null
): string[] {
  if (!caseStudy) return [];

  const urls: string[] = [];

  // featured_image
  if (typeof caseStudy.featured_image === 'string') {
    urls.push(caseStudy.featured_image);
  }

  // thumbnail_url
  if (typeof caseStudy.thumbnail_url === 'string') {
    urls.push(caseStudy.thumbnail_url);
  }

  // image_url
  if (typeof caseStudy.image_url === 'string') {
    urls.push(caseStudy.image_url);
  }

  // images配列
  if (Array.isArray(caseStudy.images)) {
    urls.push(
      ...caseStudy.images.filter((u): u is string => typeof u === 'string')
    );
  }

  return urls;
}

/**
 * 公開エラーを生成
 */
export class FileScanValidationError extends Error {
  failedPaths: string[];
  code = 'FILE_SCAN_VALIDATION_FAILED';

  constructor(failedPaths: string[]) {
    super(
      `以下のファイルがスキャン未完了または不合格のため公開できません: ${failedPaths.join(', ')}`
    );
    this.name = 'FileScanValidationError';
    this.failedPaths = failedPaths;
  }
}
