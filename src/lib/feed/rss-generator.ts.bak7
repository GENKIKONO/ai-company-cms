/**
 * RSS 2.0 フィード生成ヘルパー
 * REQ-AIO-04: XMLバリデータでエラー0
 */

export interface RssFeedOptions {
  title: string;
  description: string;
  link: string;
  language: string;
  posts: PostWithOrg[];
  baseUrl: string;
  organizationSlug?: string;
}

// 実DBスキーマ準拠の型定義
export interface PostWithOrg {
  id: string;
  title: string;
  slug: string;
  content: string;
  pub_date: string;
  org_slug: string | null;
  org_name: string | null;
  org_url: string | null;
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
 * RSS 2.0 フィードを生成（実DBスキーマ準拠）
 */
export function generateRss(options: RssFeedOptions): string {
  const { title, description, link, language, posts, baseUrl, organizationSlug } = options;

  // チャンネル情報
  const channelTitle = escapeXml(title);
  const channelDescription = escapeXml(description);
  const channelLink = escapeXml(link);
  
  // 最新記事の日時（チャンネルのlastBuildDate用）
  const latestPost = posts[0];
  const lastBuildDate = latestPost?.pub_date 
    ? formatRfc822Date(latestPost.pub_date)
    : formatRfc822Date(new Date().toISOString());

  // RSS アイテム生成（実DBスキーマ準拠）
  const items = posts.map((post: PostWithOrg) => {
    // URL生成
    const postUrl = post.org_slug 
      ? `${baseUrl}/posts/${post.slug}`
      : `${baseUrl}/posts/${post.slug}`;
    
    // タイトル（必須、undefinedを許容しない）
    const postTitle = escapeXml(post.title ?? '');
    
    // 説明（content から160文字まで、undefinedを許容しない）
    const rawContent = post.content ?? '';
    const plainContent = stripHtml(rawContent);
    const postDescription = plainContent.length > 160 
      ? escapeXml(plainContent.substring(0, 160) + '...')
      : escapeXml(plainContent || '');
    
    // 日付（pub_date使用、undefinedを許容しない）
    const pubDate = post.pub_date ? formatRfc822Date(post.pub_date) : '';
    
    // 著者（org_nameを使用、undefinedを許容しない）
    const author = post.org_name ?? '';

    // カテゴリ（組織名、undefinedを許容しない）
    const category = post.org_name ? `
      <category>${escapeXml(post.org_name)}</category>` : '';

    return `
    <item>
      <title>${postTitle}</title>
      <link>${escapeXml(postUrl)}</link>
      <description>${postDescription}</description>
      <author>noreply@aiohub.jp (${author})</author>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <pubDate>${pubDate}</pubDate>${category}
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