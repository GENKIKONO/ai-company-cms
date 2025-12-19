/**
 * robots.txt生成 (App Router)
 * - サイトマップURLを指定
 * - 全体的なクロール許可設定
 */

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://aiohub.jp/functions/v1/sitemap_index.xml',
  };
}