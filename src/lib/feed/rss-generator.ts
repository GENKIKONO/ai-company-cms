/**
 * RSS 2.0 フィード生成ヘルパー
 * REQ-AIO-04: XMLバリデータでエラー0
 */

export interface RssFeedOptions {
  title: string;
  description: string;
  link: string;
  language: string;
  posts: any[];
  baseUrl: string;
  organizationSlug?: string;
}

export interface RssPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content_html?: string | null;
  published_at: string;
  updated_at: string;
  featured_image_url?: string | null;
  organizations?: {
    name: string;
    slug: string;
    url?: string | null;
    logo_url?: string | null;
  };
}

/**
 * HTML文字列をプレーンテキストに変換
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * XML特殊文字をエスケープ
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 日付をRFC822形式に変換
 */
function formatRfc822Date(dateString: string): string {
  const date = new Date(dateString);
  return date.toUTCString();
}

/**
 * RSS 2.0 フィードを生成
 */
export function generateRss(options: RssFeedOptions): string {
  const { title, description, link, language, posts, baseUrl, organizationSlug } = options;

  // チャンネル情報
  const channelTitle = escapeXml(title);
  const channelDescription = escapeXml(description);
  const channelLink = escapeXml(link);
  
  // 最新記事の日時（チャンネルのlastBuildDate用）
  const latestPost = posts[0];
  const lastBuildDate = latestPost 
    ? formatRfc822Date(latestPost.updated_at || latestPost.published_at)
    : formatRfc822Date(new Date().toISOString());

  // RSS アイテム生成
  const items = posts.map((post: RssPost) => {
    const postUrl = organizationSlug 
      ? `${baseUrl}/o/${organizationSlug}/posts/${post.slug}`
      : `${baseUrl}/posts/${post.slug}`;
    
    const postTitle = escapeXml(post.title);
    const postDescription = post.excerpt 
      ? escapeXml(stripHtml(post.excerpt))
      : post.content_html 
        ? escapeXml(stripHtml(post.content_html).substring(0, 300) + '...')
        : '';
    
    const pubDate = formatRfc822Date(post.published_at);
    const organization = post.organizations;
    const author = organization ? escapeXml(organization.name) : 'LuxuCare CMS';

    let enclosure = '';
    if (post.featured_image_url) {
      enclosure = `
      <enclosure url="${escapeXml(post.featured_image_url)}" type="image/jpeg" />`;
    }

    return `
    <item>
      <title>${postTitle}</title>
      <link>${escapeXml(postUrl)}</link>
      <description>${postDescription}</description>
      <author>${author}</author>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>${enclosure}
    </item>`;
  }).join('');

  // RSS 2.0 XML生成
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${channelTitle}</title>
    <link>${channelLink}</link>
    <description>${channelDescription}</description>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>LuxuCare CMS RSS Generator</generator>
    <atom:link href="${baseUrl}/${organizationSlug ? `o/${organizationSlug}/` : ''}feed.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return rssXml;
}

/**
 * RSS フィードバリデーション
 */
export function validateRssFeed(rssXml: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 基本的なXML構造チェック
  if (!rssXml.includes('<?xml version="1.0"')) {
    errors.push('Missing XML declaration');
  }

  if (!rssXml.includes('<rss version="2.0"')) {
    errors.push('Missing RSS 2.0 declaration');
  }

  if (!rssXml.includes('<channel>')) {
    errors.push('Missing channel element');
  }

  // 必須要素チェック
  const requiredElements = ['<title>', '<link>', '<description>'];
  for (const element of requiredElements) {
    if (!rssXml.includes(element)) {
      errors.push(`Missing required element: ${element}`);
    }
  }

  // 不正な文字チェック
  if (rssXml.includes('&') && !rssXml.match(/&(amp|lt|gt|quot|#39);/g)) {
    errors.push('Unescaped ampersand found');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}