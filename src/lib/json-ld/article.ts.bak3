/**
 * Article JSON-LD 生成
 * 要件定義準拠: 記事・ブログ投稿のための構造化データ
 */

import type { Organization } from '@/types/database';

interface Post {
  id: string;
  title: string;
  slug: string;
  content_markdown?: string | null;
  content_html?: string | null;
  excerpt?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  status?: string;
  tags?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image_url?: string | null;
  organization_id: string;
}

interface ArticleJsonLd {
  '@context': string;
  '@type': string;
  headline: string;
  description?: string;
  author: {
    '@type': string;
    name: string;
    url?: string;
  };
  publisher: {
    '@type': string;
    name: string;
    url?: string;
    logo?: {
      '@type': string;
      url: string;
    };
  };
  datePublished?: string;
  dateModified?: string;
  image?: string;
  articleBody?: string;
  keywords?: string[];
  inLanguage: string;
  mainEntityOfPage: {
    '@type': string;
    '@id': string;
  };
}

/**
 * 空の値を除外するヘルパー
 */
function omitEmpty<T extends object>(obj: T): Partial<T> {
  const result: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        result[key] = value;
      } else if (!Array.isArray(value)) {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * タグ文字列を配列に変換
 */
function parseTagsToArray(tagsString: string | null | undefined): string[] | undefined {
  if (!tagsString) return undefined;
  
  try {
    // JSON配列として解析を試行
    const parsed = JSON.parse(tagsString);
    if (Array.isArray(parsed)) {
      return parsed.filter(tag => typeof tag === 'string' && tag.trim());
    }
  } catch {
    // カンマ区切りとして解析
    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }
  
  return undefined;
}

/**
 * Post から Article JSON-LD を生成
 * 要件定義準拠: 公開済み記事のみ、空値除外
 */
export function generateArticleJsonLd(
  post: Post, 
  organization: Organization,
  baseUrl: string
): ArticleJsonLd | null {
  // 公開済みの記事のみ処理
  if (post.status !== 'published' || !post.published_at) {
    return null;
  }

  const articleUrl = `${baseUrl}/o/${organization.slug}/posts/${post.slug}`;
  
  const jsonLd: ArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    author: {
      '@type': 'Organization',
      name: organization.name,
      url: organization.url || `${baseUrl}/o/${organization.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: organization.name,
      url: organization.url || `${baseUrl}/o/${organization.slug}`,
    },
    datePublished: post.published_at,
    inLanguage: 'ja',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  // 説明（excerpt > meta_description の優先順位）
  if (post.excerpt) {
    jsonLd.description = post.excerpt;
  } else if (post.meta_description) {
    jsonLd.description = post.meta_description;
  }

  // 更新日時
  if (post.updated_at && post.updated_at !== post.published_at) {
    jsonLd.dateModified = post.updated_at;
  }

  // アイキャッチ画像
  if (post.featured_image_url) {
    jsonLd.image = post.featured_image_url;
  }

  // 組織のロゴ
  if (organization.logo_url) {
    jsonLd.publisher.logo = {
      '@type': 'ImageObject',
      url: organization.logo_url,
    };
  }

  // 記事本文（HTMLタグを除去）
  if (post.content_html) {
    // HTMLタグを除去してプレーンテキストに
    const textContent = post.content_html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (textContent) {
      jsonLd.articleBody = textContent;
    }
  }

  // タグ・キーワード
  const keywords = parseTagsToArray(post.tags);
  if (keywords && keywords.length > 0) {
    jsonLd.keywords = keywords;
  }

  // 空値を除外して返却
  return omitEmpty(jsonLd) as ArticleJsonLd;
}

/**
 * JSON-LD をHTML用文字列として出力
 */
export function articleJsonLdToHtml(
  post: Post, 
  organization: Organization,
  baseUrl: string
): string | null {
  const jsonLd = generateArticleJsonLd(post, organization, baseUrl);
  if (!jsonLd) return null;
  
  return JSON.stringify(jsonLd, null, 2);
}

/**
 * 記事の JSON-LD バリデーション
 */
export interface ArticleJsonLdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateArticleJsonLd(post: Post, organization: Organization): ArticleJsonLdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 必須項目チェック
  if (!post.title?.trim()) {
    errors.push('Article title is required');
  }

  if (!post.slug?.trim()) {
    errors.push('Article slug is required');
  }

  if (post.status !== 'published') {
    warnings.push('Only published articles generate JSON-LD');
  }

  if (!post.published_at) {
    errors.push('Published date is required for JSON-LD');
  }

  // 推奨項目チェック
  if (!post.excerpt?.trim() && !post.meta_description?.trim()) {
    warnings.push('Article description (excerpt or meta_description) is recommended');
  }

  if (!post.featured_image_url?.trim()) {
    warnings.push('Featured image is recommended for better social sharing');
  }

  if (!post.content_html?.trim()) {
    warnings.push('Article content is recommended');
  }

  // URL形式チェック
  if (post.featured_image_url && !post.featured_image_url.startsWith('https://')) {
    errors.push('Featured image URL must use HTTPS');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}