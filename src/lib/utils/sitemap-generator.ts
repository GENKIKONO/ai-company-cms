import { logger } from '@/lib/utils/logger';

/**
 * 動的サイトマップ生成ユーティリティ (K1)
 * 組織・サービス・投稿・FAQ等の動的コンテンツからサイトマップを自動生成
 */

export interface SitemapUrl {
  url: string;
  lastModified?: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number; // 0.0 - 1.0
  alternateLanguages?: Array<{
    hreflang: string;
    href: string;
  }>;
}

export interface SitemapConfig {
  baseUrl: string;
  defaultChangeFrequency: SitemapUrl['changeFrequency'];
  defaultPriority: number;
  excludePatterns?: string[];
  includeImages?: boolean;
  includeAlternateLanguages?: boolean;
}

/**
 * XML サイトマップ生成クラス
 */
export class SitemapGenerator {
  private config: SitemapConfig;

  constructor(config: Partial<SitemapConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://aiohub.jp',
      defaultChangeFrequency: 'weekly',
      defaultPriority: 0.5,
      excludePatterns: ['/api/', '/ops/', '/auth/', '/dashboard/'],
      includeImages: true,
      includeAlternateLanguages: false,
      ...config
    };
  }

  /**
   * 静的ページのサイトマップ生成
   */
  generateStaticSitemap(): SitemapUrl[] {
    const staticPages: SitemapUrl[] = [
      {
        url: '/',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: '/search',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
      },
      {
        url: '/organizations',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9
      },
      {
        url: '/contact',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6
      },
      {
        url: '/privacy',
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3
      },
      {
        url: '/terms',
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3
      },
      {
        url: '/help',
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.4
      }
    ];

    return staticPages.map(page => ({
      ...page,
      url: this.config.baseUrl + page.url
    }));
  }

  /**
   * 組織ページのサイトマップ生成
   */
  async generateOrganizationsSitemap(): Promise<SitemapUrl[]> {
    try {
      // 公開済み組織の取得
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('slug, updated_at, services(id, updated_at), case_studies(id, updated_at), faqs(id, updated_at), posts(id, slug, updated_at)')
        .eq('is_published', true)
        .eq('status', 'published');

      if (error) {
        logger.error('Failed to fetch organizations for sitemap', error instanceof Error ? error : new Error(String(error)));
        return [];
      }

      const urls: SitemapUrl[] = [];

      for (const org of organizations || []) {
        const baseUrl = `${this.config.baseUrl}/o/${org.slug}`;
        const lastModified = new Date(org.updated_at);

        // 組織メインページ
        urls.push({
          url: baseUrl,
          lastModified,
          changeFrequency: 'weekly',
          priority: 0.8
        });

        // サービス一覧ページ
        if (org.services && org.services.length > 0) {
          urls.push({
            url: `${baseUrl}/services`,
            lastModified: this.getLatestDate([lastModified, ...org.services.map(s => new Date(s.updated_at))]),
            changeFrequency: 'weekly',
            priority: 0.7
          });

          // 個別サービスページ
          org.services.forEach(service => {
            urls.push({
              url: `${baseUrl}/services/${service.id}`,
              lastModified: new Date(service.updated_at),
              changeFrequency: 'monthly',
              priority: 0.6
            });
          });
        }

        // 事例一覧ページ
        if (org.case_studies && org.case_studies.length > 0) {
          urls.push({
            url: `${baseUrl}/case-studies`,
            lastModified: this.getLatestDate([lastModified, ...org.case_studies.map(cs => new Date(cs.updated_at))]),
            changeFrequency: 'weekly',
            priority: 0.7
          });

          // 個別事例ページ
          org.case_studies.forEach(caseStudy => {
            urls.push({
              url: `${baseUrl}/case-studies/${caseStudy.id}`,
              lastModified: new Date(caseStudy.updated_at),
              changeFrequency: 'monthly',
              priority: 0.6
            });
          });
        }

        // FAQ ページ
        if (org.faqs && org.faqs.length > 0) {
          urls.push({
            url: `${baseUrl}/faq`,
            lastModified: this.getLatestDate([lastModified, ...org.faqs.map(faq => new Date(faq.updated_at))]),
            changeFrequency: 'weekly',
            priority: 0.6
          });
        }

        // 投稿一覧ページ
        if (org.posts && org.posts.length > 0) {
          urls.push({
            url: `${baseUrl}/posts`,
            lastModified: this.getLatestDate([lastModified, ...org.posts.map(post => new Date(post.updated_at))]),
            changeFrequency: 'daily',
            priority: 0.7
          });

          // 個別投稿ページ
          org.posts.forEach(post => {
            urls.push({
              url: `${baseUrl}/posts/${post.id}`,
              lastModified: new Date(post.updated_at),
              changeFrequency: 'monthly',
              priority: 0.5
            });
          });
        }
      }

      return urls;
    } catch (error) {
      logger.error('Error generating organizations sitemap', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * XML サイトマップ文字列の生成
   */
  generateXMLSitemap(urls: SitemapUrl[]): string {
    const filteredUrls = this.filterUrls(urls);
    
    const xmlUrls = filteredUrls.map(url => {
      let xml = `  <url>\n`;
      xml += `    <loc>${this.escapeXml(url.url)}</loc>\n`;
      
      if (url.lastModified) {
        xml += `    <lastmod>${url.lastModified.toISOString().split('T')[0]}</lastmod>\n`;
      }
      
      if (url.changeFrequency) {
        xml += `    <changefreq>${url.changeFrequency}</changefreq>\n`;
      }
      
      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      // 多言語対応
      if (url.alternateLanguages && url.alternateLanguages.length > 0) {
        url.alternateLanguages.forEach(alt => {
          xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXml(alt.href)}" />\n`;
        });
      }
      
      xml += `  </url>\n`;
      return xml;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${this.config.includeAlternateLanguages ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : ''}>
${xmlUrls}</urlset>`;
  }

  /**
   * サイトマップインデックス生成
   */
  generateSitemapIndex(sitemaps: Array<{ url: string; lastModified?: Date }>): string {
    const xmlSitemaps = sitemaps.map(sitemap => {
      let xml = `  <sitemap>\n`;
      xml += `    <loc>${this.escapeXml(sitemap.url)}</loc>\n`;
      
      if (sitemap.lastModified) {
        xml += `    <lastmod>${sitemap.lastModified.toISOString()}</lastmod>\n`;
      }
      
      xml += `  </sitemap>\n`;
      return xml;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}</sitemapindex>`;
  }

  /**
   * robots.txt 生成
   */
  generateRobotsTxt(options: {
    allowedPaths?: string[];
    disallowedPaths?: string[];
    sitemapUrl?: string;
    crawlDelay?: number;
    userAgents?: Array<{
      userAgent: string;
      rules: Array<{ directive: 'Allow' | 'Disallow'; path: string }>;
    }>;
  } = {}): string {
    const {
      allowedPaths = ['/'],
      disallowedPaths = ['/api/', '/ops/', '/auth/', '/dashboard/', '/my/', '/organizations/new'],
      sitemapUrl = `${this.config.baseUrl}/sitemap.xml`,
      crawlDelay,
      userAgents = []
    } = options;

    let robotsTxt = '';

    // カスタム User-Agent ルール
    userAgents.forEach(({ userAgent, rules }) => {
      robotsTxt += `User-agent: ${userAgent}\n`;
      rules.forEach(rule => {
        robotsTxt += `${rule.directive}: ${rule.path}\n`;
      });
      robotsTxt += '\n';
    });

    // デフォルト User-Agent ルール
    robotsTxt += 'User-agent: *\n';
    
    // Allow rules
    allowedPaths.forEach(path => {
      robotsTxt += `Allow: ${path}\n`;
    });
    
    // Disallow rules
    disallowedPaths.forEach(path => {
      robotsTxt += `Disallow: ${path}\n`;
    });

    // Crawl delay
    if (crawlDelay) {
      robotsTxt += `Crawl-delay: ${crawlDelay}\n`;
    }

    robotsTxt += '\n';

    // Sitemap
    robotsTxt += `Sitemap: ${sitemapUrl}\n`;

    return robotsTxt;
  }

  /**
   * メタタグ用のcanonical URL生成
   */
  generateCanonicalUrl(path: string, params?: Record<string, string>): string {
    let url = this.config.baseUrl + path;
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += '?' + searchParams.toString();
    }
    
    return url;
  }

  /**
   * Open Graph / Twitter Card メタデータ生成
   */
  generateSocialMetadata(options: {
    title: string;
    description: string;
    url: string;
    image?: string;
    type?: 'website' | 'article';
    siteName?: string;
    locale?: string;
    twitterCard?: 'summary' | 'summary_large_image';
  }) {
    const {
      title,
      description,
      url,
      image,
      type = 'website',
      siteName = 'AIO Hub',
      locale = 'ja_JP',
      twitterCard = 'summary_large_image'
    } = options;

    return {
      // Open Graph
      'og:title': title,
      'og:description': description,
      'og:url': url,
      'og:type': type,
      'og:site_name': siteName,
      'og:locale': locale,
      ...(image && { 'og:image': image }),
      
      // Twitter Card
      'twitter:card': twitterCard,
      'twitter:title': title,
      'twitter:description': description,
      ...(image && { 'twitter:image': image }),
    };
  }

  private getLatestDate(dates: Date[]): Date {
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }

  private filterUrls(urls: SitemapUrl[]): SitemapUrl[] {
    return urls.filter(url => {
      return !this.config.excludePatterns?.some(pattern => 
        url.url.includes(pattern)
      );
    });
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

/**
 * サイトマップ生成関数（APIルート用）
 */
export async function generateFullSitemap(): Promise<string> {
  const generator = new SitemapGenerator();
  
  const [staticUrls, organizationUrls] = await Promise.all([
    generator.generateStaticSitemap(),
    generator.generateOrganizationsSitemap()
  ]);

  const allUrls = [...staticUrls, ...organizationUrls];
  return generator.generateXMLSitemap(allUrls);
}

/**
 * robots.txt 生成関数（APIルート用）
 */
export function generateRobotsTxt(): string {
  const generator = new SitemapGenerator();
  
  return generator.generateRobotsTxt({
    disallowedPaths: [
      '/api/',
      '/ops/',
      '/auth/',
      '/dashboard/',
      '/my/',
      '/organizations/new',
      '/organizations/*/edit',
      '/*?*' // クエリパラメータ付きURL
    ],
    crawlDelay: 1,
    userAgents: [
      {
        userAgent: 'Googlebot',
        rules: [
          { directive: 'Allow', path: '/api/public/' },
          { directive: 'Disallow', path: '/api/' }
        ]
      },
      {
        userAgent: 'GPTBot',
        rules: [
          { directive: 'Disallow', path: '/' }
        ]
      }
    ]
  });
}

// グローバルインスタンス
export const sitemapGenerator = new SitemapGenerator();