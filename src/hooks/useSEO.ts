/**
 * SEO最適化フック (K1)
 * メタデータ、構造化データ、canonical URLの管理
 */

import { useEffect , useCallback} from 'react';
import { sitemapGenerator } from '@/lib/utils/sitemap-generator';

export interface SEOOptions {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  image?: string;
  type?: 'website' | 'article';
  locale?: string;
  alternateLanguages?: Array<{
    hreflang: string;
    href: string;
  }>;
  structuredData?: object;
}

/**
 * SEO メタデータ管理フック
 */
export function useSEO(options: SEOOptions) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Title設定
    document.title = options.title;

    // Meta tags設定
    setMetaTag('description', options.description);
    
    if (options.keywords && options.keywords.length > 0) {
      setMetaTag('keywords', options.keywords.join(', '));
    }

    // Robots meta tag設定（デフォルト：index, follow で AI フレンドリー）
    const robotsContent = [];
    if (options.noindex) robotsContent.push('noindex');
    if (options.nofollow) robotsContent.push('nofollow');
    
    if (robotsContent.length > 0) {
      setMetaTag('robots', robotsContent.join(', '));
    } else {
      // デフォルトで index, follow を明示的に設定
      setMetaTag('robots', 'index, follow');
    }

    // Canonical URL設定
    setCanonicalUrl(options.canonical);

    // Open Graph & Twitter Cards設定
    const socialMeta = sitemapGenerator.generateSocialMetadata({
      title: options.title,
      description: options.description,
      url: options.canonical || window.location.href,
      image: options.image,
      type: options.type,
      locale: options.locale
    });

    Object.entries(socialMeta).forEach(([property, content]) => {
      if (content) {
        setMetaProperty(property, content);
      }
    });

    // Alternate languages設定
    if (options.alternateLanguages) {
      setAlternateLanguages(options.alternateLanguages);
    }

    // 構造化データ設定
    if (options.structuredData) {
      setStructuredData(options.structuredData);
    }

    // クリーンアップ
    return () => {
      // 構造化データのクリーンアップのみ（他のメタデータは残す）
      removeStructuredData();
    };
  }, [
    options.title,
    options.description,
    options.canonical,
    options.noindex,
    options.nofollow,
    options.image,
    options.type,
    options.locale,
    options.keywords,
    options.alternateLanguages,
    options.structuredData
  ]);
}

/**
 * 組織ページ用SEOフック
 */
export function useOrganizationSEO(organization: {
  name: string;
  description?: string;
  slug: string;
  logo_url?: string;
  address_locality?: string;
  address_region?: string;
  updated_at: string;
}) {
  const title = `${organization.name} | AIOHub`;
  const description = organization.description || `${organization.name}の企業情報をAIOHubでチェック。`;
  const canonical = sitemapGenerator.generateCanonicalUrl(`/o/${organization.slug}`);
  
  const location = [organization.address_locality, organization.address_region]
    .filter(Boolean)
    .join('、');
  
  const keywords = [
    organization.name,
    'AI企業',
    'DX',
    'デジタル変革',
    location
  ].filter(Boolean);

  useSEO({
    title,
    description,
    keywords,
    canonical,
    image: organization.logo_url,
    type: 'website'
  });
}

/**
 * サービスページ用SEOフック
 */
export function useServiceSEO(service: {
  name: string;
  description?: string;
  category?: string;
  price?: number;
  id: string;
}, organization: {
  name: string;
  slug: string;
}) {
  const title = `${service.name} - ${organization.name} | AIOHub`;
  const description = service.description || `${organization.name}の${service.name}サービス詳細。`;
  const canonical = sitemapGenerator.generateCanonicalUrl(`/o/${organization.slug}/services/${service.id}`);
  
  const keywords = [
    service.name,
    organization.name,
    service.category,
    'AIサービス',
    'DXソリューション'
  ].filter(Boolean) as string[];

  useSEO({
    title,
    description,
    keywords,
    canonical,
    type: 'article'
  });
}

/**
 * 記事ページ用SEOフック
 */
export function usePostSEO(post: {
  title: string;
  content_markdown?: string;
  slug: string;
  id: string;
  updated_at: string;
}, organization: {
  name: string;
  slug: string;
}) {
  const title = `${post.title} | ${organization.name} - AIOHub`;
  const description = extractDescription(post.content_markdown);
  const canonical = sitemapGenerator.generateCanonicalUrl(`/o/${organization.slug}/posts/${post.id}`);
  
  const keywords = [
    organization.name,
    'AI',
    'DX',
    'デジタル変革',
    'テクノロジー'
  ];

  useSEO({
    title,
    description,
    keywords,
    canonical,
    type: 'article'
  });
}

// ユーティリティ関数

function setMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function removeMetaTag(name: string) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.remove();
  }
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setCanonicalUrl(url?: string) {
  // 既存のcanonical linkを削除
  const existingCanonical = document.querySelector('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.remove();
  }

  if (url) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);
    document.head.appendChild(link);
  }
}

function setAlternateLanguages(alternates: Array<{ hreflang: string; href: string }>) {
  // 既存のalternate linkを削除
  const existingAlternates = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingAlternates.forEach(link => link.remove());

  alternates.forEach(({ hreflang, href }) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    document.head.appendChild(link);
  });
}

function setStructuredData(data: object) {
  // 既存の構造化データを削除
  removeStructuredData();

  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('id', 'structured-data');
  script.textContent = JSON.stringify(data, null, 2);
  document.head.appendChild(script);
}

function removeStructuredData() {
  const existingScript = document.getElementById('structured-data');
  if (existingScript) {
    existingScript.remove();
  }
}

function extractDescription(markdown?: string, maxLength = 160): string {
  if (!markdown) {
    return 'AI・DX企業の情報をAIOHubで発見。企業詳細、サービス、事例をチェックできます。';
  }

  // Markdownから平文テキストを抽出
  const plainText = markdown
    .replace(/#{1,6}\s+/g, '') // ヘッダー
    .replace(/\*\*(.*?)\*\*/g, '$1') // ボールド
    .replace(/\*(.*?)\*/g, '$1') // イタリック
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // リンク
    .replace(/`(.*?)`/g, '$1') // インラインコード
    .replace(/```[\s\S]*?```/g, '') // コードブロック
    .replace(/\n+/g, ' ') // 改行を空白に
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength - 3) + '...';
}

/**
 * JSON-LD構造化データ用フック
 */
export function useStructuredData(data: object) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setStructuredData(data);

    return () => {
      removeStructuredData();
    };
  }, [data]);
}

/**
 * パンくずナビ用構造化データフック
 */
export function useBreadcrumbStructuredData(breadcrumbs: Array<{
  name: string;
  url: string;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };

  useStructuredData(structuredData);
}