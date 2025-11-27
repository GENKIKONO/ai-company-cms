/**
 * ニュースサイトマップ生成
 * REQ-AIO-05: 拡張サイトマップ（ニュース）
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

interface NewsSitemapItem {
  loc: string;
  lastmod: string;
  news: {
    publication: {
      name: string;
      language: string;
    };
    publication_date: string;
    title: string;
    keywords?: string;
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    
    // 過去2日以内の記事のみ（Googleニュースサイトマップ要件）
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { data: recentPosts } = await supabase
      .from('posts')
      .select(`
        slug,
        title,
        excerpt,
        tags,
        published_at,
        updated_at,
        organizations:organization_id (
          slug,
          name,
          url
        )
      `)
      .eq('status', 'published')
      .gte('published_at', twoDaysAgo.toISOString())
      .order('published_at', { ascending: false });

    if (!recentPosts || recentPosts.length === 0) {
      // 記事がない場合は空のサイトマップを返す
      const emptyXml = generateNewsSitemapXml([]);
      return new NextResponse(emptyXml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    const items: NewsSitemapItem[] = recentPosts
      .filter(post => post.organizations && typeof post.organizations === 'object' && 'slug' in post.organizations)
      .map(post => {
        const org = post.organizations as any;
        
        // タグからキーワード抽出
        let keywords = '';
        if (post.tags) {
          try {
            const tagArray = typeof post.tags === 'string' 
              ? JSON.parse(post.tags) 
              : post.tags;
            if (Array.isArray(tagArray)) {
              keywords = tagArray.slice(0, 5).join(', '); // 最大5個
            }
          } catch {
            // JSON解析失敗時はそのまま使用
            keywords = typeof post.tags === 'string' ? post.tags : '';
          }
        }

        return {
          loc: `${baseUrl}/o/${org.slug}/posts/${post.slug}`,
          lastmod: new Date(post.updated_at).toISOString(),
          news: {
            publication: {
              name: org.name,
              language: 'ja'
            },
            publication_date: new Date(post.published_at).toISOString(),
            title: post.title,
            keywords: keywords || undefined
          }
        };
      });

    const xml = generateNewsSitemapXml(items);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5分キャッシュ
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    logger.error('News sitemap generation failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * ニュースサイトマップXML生成
 */
function generateNewsSitemapXml(items: NewsSitemapItem[]): string {
  const urlElements = items.map(item => `
  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(item.news.publication.name)}</news:name>
        <news:language>${item.news.publication.language}</news:language>
      </news:publication>
      <news:publication_date>${item.news.publication_date}</news:publication_date>
      <news:title>${escapeXml(item.news.title)}</news:title>
      ${item.news.keywords ? `<news:keywords>${escapeXml(item.news.keywords)}</news:keywords>` : ''}
    </news:news>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urlElements}
</urlset>`;
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