/**
 * AIO要件適合性テスト
 * REQ-AIO-01〜07の受け入れ条件を自動検証
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';

test.describe('AIO Requirements Compliance Tests', () => {
  
  test('REQ-AIO-04: RSS Feed Validation', async ({ page }) => {
    // 全記事フィード
    const feedResponse = await page.goto(`${BASE_URL}/feed.xml`);
    expect(feedResponse?.status()).toBe(200);
    expect(feedResponse?.headers()['content-type']).toContain('application/rss+xml');
    
    const feedContent = await page.content();
    expect(feedContent).toContain('<?xml version="1.0"');
    expect(feedContent).toContain('<rss version="2.0"');
    expect(feedContent).toContain('<channel>');
    expect(feedContent).toContain('<title>');
    expect(feedContent).toContain('<description>');
    
    // RSS 2.0必須要素チェック
    expect(feedContent).toContain('<lastBuildDate>');
    expect(feedContent).toContain('<generator>LuxuCare CMS RSS Generator</generator>');
    
    // 企業別フィード（サンプル企業が存在する場合）
    const orgFeedResponse = await page.goto(`${BASE_URL}/o/sample-company/feed.xml`);
    // 404も有効（企業が存在しない場合）
    expect([200, 404]).toContain(orgFeedResponse?.status() || 500);
  });

  test('REQ-AIO-05: Extended Sitemaps', async ({ page }) => {
    // 画像サイトマップ
    const imageSitemapResponse = await page.goto(`${BASE_URL}/sitemap-images.xml`);
    expect(imageSitemapResponse?.status()).toBe(200);
    expect(imageSitemapResponse?.headers()['content-type']).toContain('application/xml');
    
    const imageSitemapContent = await page.content();
    expect(imageSitemapContent).toContain('<?xml version="1.0"');
    expect(imageSitemapContent).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
    
    // ニュースサイトマップ
    const newsSitemapResponse = await page.goto(`${BASE_URL}/sitemap-news.xml`);
    expect(newsSitemapResponse?.status()).toBe(200);
    expect(newsSitemapResponse?.headers()['content-type']).toContain('application/xml');
    
    const newsSitemapContent = await page.content();
    expect(newsSitemapContent).toContain('<?xml version="1.0"');
    expect(newsSitemapContent).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
  });

  test('REQ-AIO-06: OpenAPI Schema', async ({ page }) => {
    const openApiResponse = await page.goto(`${BASE_URL}/api/public/openapi.json`);
    expect(openApiResponse?.status()).toBe(200);
    expect(openApiResponse?.headers()['content-type']).toContain('application/json');
    
    const openApiContent = await page.textContent('body');
    const openApiData = JSON.parse(openApiContent || '{}');
    
    // OpenAPI 3.1構造チェック
    expect(openApiData.openapi).toBe('3.1.0');
    expect(openApiData.info.title).toBe('LuxuCare CMS Public API');
    expect(openApiData.paths).toBeDefined();
    
    // 必須エンドポイント存在チェック
    expect(openApiData.paths['/api/public/services']).toBeDefined();
    expect(openApiData.paths['/api/public/faqs']).toBeDefined();
    expect(openApiData.paths['/api/public/case-studies']).toBeDefined();
    
    // スキーマ定義チェック
    expect(openApiData.components.schemas.Service).toBeDefined();
    expect(openApiData.components.schemas.FAQ).toBeDefined();
    expect(openApiData.components.schemas.CaseStudy).toBeDefined();
  });

  test('REQ-AIO-06: Public API Contract Testing', async ({ page }) => {
    // サービスAPI
    const servicesResponse = await page.goto(`${BASE_URL}/api/public/services`);
    expect(servicesResponse?.status()).toBe(200);
    expect(servicesResponse?.headers()['content-type']).toContain('application/json');
    expect(servicesResponse?.headers()['cache-control']).toContain('max-age=300');
    
    const servicesContent = await page.textContent('body');
    const servicesData = JSON.parse(servicesContent || '{}');
    expect(servicesData).toHaveProperty('services');
    expect(servicesData).toHaveProperty('total');
    expect(Array.isArray(servicesData.services)).toBe(true);
    
    // FAQ API
    const faqsResponse = await page.goto(`${BASE_URL}/api/public/faqs`);
    expect(faqsResponse?.status()).toBe(200);
    
    const faqsContent = await page.textContent('body');
    const faqsData = JSON.parse(faqsContent || '{}');
    expect(faqsData).toHaveProperty('faqs');
    expect(faqsData).toHaveProperty('total');
    expect(Array.isArray(faqsData.faqs)).toBe(true);
    
    // 導入事例API
    const caseStudiesResponse = await page.goto(`${BASE_URL}/api/public/case-studies`);
    expect(caseStudiesResponse?.status()).toBe(200);
    
    const caseStudiesContent = await page.textContent('body');
    const caseStudiesData = JSON.parse(caseStudiesContent || '{}');
    expect(caseStudiesData).toHaveProperty('caseStudies');
    expect(caseStudiesData).toHaveProperty('total');
    expect(Array.isArray(caseStudiesData.caseStudies)).toBe(true);
  });

  test('REQ-AIO-04: Cache-Control Headers', async ({ page }) => {
    // RSS フィードのキャッシュヘッダー
    const feedResponse = await page.goto(`${BASE_URL}/feed.xml`);
    expect(feedResponse?.headers()['cache-control']).toContain('max-age=300');
    
    // サイトマップのキャッシュヘッダー
    const sitemapResponse = await page.goto(`${BASE_URL}/sitemap-images.xml`);
    expect(sitemapResponse?.headers()['cache-control']).toContain('max-age=300');
    
    // OpenAPIのキャッシュヘッダー
    const openApiResponse = await page.goto(`${BASE_URL}/api/public/openapi.json`);
    expect(openApiResponse?.headers()['cache-control']).toContain('max-age=3600');
  });

  test('REQ-AIO-01: Robots.txt and Sitemap', async ({ page }) => {
    // robots.txt確認
    const robotsResponse = await page.goto(`${BASE_URL}/robots.txt`);
    expect(robotsResponse?.status()).toBe(200);
    
    const robotsContent = await page.textContent('body');
    expect(robotsContent).toContain('Sitemap:');
    expect(robotsContent).toContain('/sitemap.xml');
    
    // AIボット制御確認
    expect(robotsContent).toContain('User-agent: GPTBot');
    expect(robotsContent).toContain('Disallow: /');
    expect(robotsContent).toContain('User-agent: ChatGPT-User');
    expect(robotsContent).toContain('User-agent: CCBot');
    
    // メインサイトマップ確認
    const sitemapResponse = await page.goto(`${BASE_URL}/sitemap.xml`);
    expect(sitemapResponse?.status()).toBe(200);
    expect(sitemapResponse?.headers()['content-type']).toContain('application/xml');
  });

  test('REQ-AIO-02: HTML Lang Attribute', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('ja');
  });

  test('REQ-AIO-07: Semantic HTML Structure', async ({ page }) => {
    await page.goto(`${BASE_URL}`);
    
    // セマンティック要素の存在確認
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    
    // h1の数をチェック（1つのみであること）
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });
});