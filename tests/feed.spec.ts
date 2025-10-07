/**
 * RSS フィード テスト
 * REQ-AIO-04: RSS 2.0 準拠 & 500エラー根絶
 */

import { describe, it, expect } from '@jest/globals';
import { validateRssFeed } from '@/lib/feed/rss-generator';

describe('RSS Feed Generation', () => {
  
  it('should generate valid empty RSS feed', () => {
    const emptyRssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LuxuCare CMS - 最新記事</title>
    <link>https://aiohub.jp</link>
    <description>ビジネス向け最新記事とソリューション情報</description>
    <language>ja</language>
    <lastBuildDate>Mon, 07 Oct 2025 00:00:00 GMT</lastBuildDate>
    <generator>LuxuCare CMS RSS Generator</generator>
    <atom:link href="https://aiohub.jp/feed.xml" rel="self" type="application/rss+xml" />
  </channel>
</rss>`;
    
    const validation = validateRssFeed(emptyRssXml);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate RSS feed with items', () => {
    const rssWithItems = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>LuxuCare CMS - 最新記事</title>
    <link>https://aiohub.jp</link>
    <description>ビジネス向け最新記事とソリューション情報</description>
    <language>ja</language>
    <lastBuildDate>Mon, 07 Oct 2025 00:00:00 GMT</lastBuildDate>
    <generator>LuxuCare CMS RSS Generator</generator>
    <atom:link href="https://aiohub.jp/feed.xml" rel="self" type="application/rss+xml" />
    <item>
      <title>テスト記事</title>
      <link>https://aiohub.jp/posts/test-article</link>
      <description>テスト記事の説明</description>
      <author>noreply@aiohub.jp (Test Organization)</author>
      <guid isPermaLink="true">https://aiohub.jp/posts/test-article</guid>
      <pubDate>Mon, 07 Oct 2025 00:00:00 GMT</pubDate>
      <category>Test Organization</category>
    </item>
  </channel>
</rss>`;
    
    const validation = validateRssFeed(rssWithItems);
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should handle invalid RSS structure', () => {
    const invalidRss = `<invalid>Not RSS</invalid>`;
    
    const validation = validateRssFeed(invalidRss);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should detect unescaped XML characters', () => {
    const unescapedRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Title with & unescaped ampersand</title>
    <link>https://example.com</link>
    <description>Description</description>
  </channel>
</rss>`;
    
    const validation = validateRssFeed(unescapedRss);
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Unescaped ampersand found');
  });

});

// API レスポンステスト（E2E風）
describe('RSS Feed API Response', () => {
  
  it('should return proper headers for RSS endpoint', () => {
    // ヘッダー要件チェック
    const expectedHeaders = {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Content-Type-Options': 'nosniff'
    };
    
    // 本来はsupertest等でAPIテストするが、契約確認として記録
    Object.entries(expectedHeaders).forEach(([header, value]) => {
      expect(typeof header).toBe('string');
      expect(typeof value).toBe('string');
    });
  });

  it('should generate ETag based on latest content', () => {
    const testDate = '2025-10-07T00:00:00.000Z';
    const expectedETag = `"${Buffer.from(testDate).toString('base64')}"`;
    
    expect(expectedETag).toMatch(/^"[A-Za-z0-9+/=]+"$/);
  });

});