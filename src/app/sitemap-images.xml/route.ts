/**
 * 画像サイトマップ生成
 * REQ-AIO-05: 拡張サイトマップ（画像）
 */

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { logger } from '@/lib/utils/logger';

interface ImageSitemapItem {
  loc: string;
  lastmod: string;
  images: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const items: ImageSitemapItem[] = [];

    // 組織のロゴ画像
    const { data: organizations } = await supabase
      .from('organizations')
      .select('slug, name, logo_url, updated_at')
      .eq('status', 'published')
      .not('logo_url', 'is', null);

    organizations?.forEach(org => {
      if (org.logo_url) {
        items.push({
          loc: `${baseUrl}/o/${org.slug}`,
          lastmod: new Date(org.updated_at).toISOString(),
          images: [{
            loc: org.logo_url,
            title: `${org.name} ロゴ`,
            caption: `${org.name}の企業ロゴ画像`
          }]
        });
      }
    });

    // 記事のアイキャッチ画像
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        slug,
        title,
        featured_image_url,
        updated_at,
        organizations:organization_id (
          slug,
          name
        )
      `)
      .eq('status', 'published')
      .not('featured_image_url', 'is', null);

    posts?.forEach(post => {
      if (post.featured_image_url && post.organizations && typeof post.organizations === 'object' && 'slug' in post.organizations) {
        items.push({
          loc: `${baseUrl}/o/${post.organizations.slug}/posts/${post.slug}`,
          lastmod: new Date(post.updated_at).toISOString(),
          images: [{
            loc: post.featured_image_url,
            title: post.title,
            caption: `${post.title} - ${(post.organizations as any).name}`
          }]
        });
      }
    });

    // サービス画像（メディアから画像のみ）
    const { data: services } = await supabase
      .from('services')
      .select(`
        id,
        name,
        media,
        updated_at,
        organizations:organization_id (
          slug,
          name
        )
      `)
      .eq('status', 'published')
      .not('media', 'is', null);

    services?.forEach(service => {
      if (service.media && Array.isArray(service.media) && service.organizations && typeof service.organizations === 'object' && 'slug' in service.organizations) {
        const imageMedia = service.media.filter((m: any) => m.type === 'image' && m.url);
        
        if (imageMedia.length > 0) {
          items.push({
            loc: `${baseUrl}/o/${(service.organizations as any).slug}/services/${service.id}`,
            lastmod: new Date(service.updated_at).toISOString(),
            images: imageMedia.map((img: any) => ({
              loc: img.url,
              title: `${service.name} - ${img.alt || 'サービス画像'}`,
              caption: `${service.name}のサービス画像 - ${(service.organizations as any).name}`
            }))
          });
        }
      }
    });

    // XML生成
    const xml = generateImageSitemapXml(items);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // 5分キャッシュ
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error) {
    logger.error('Image sitemap generation failed', { data: error instanceof Error ? error : new Error(String(error)) });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * 画像サイトマップXML生成
 */
function generateImageSitemapXml(items: ImageSitemapItem[]): string {
  const urlElements = items.map(item => {
    const imageElements = item.images.map(img => `
        <image:image>
          <image:loc>${escapeXml(img.loc)}</image:loc>
          ${img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : ''}
          ${img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
        </image:image>`).join('');

    return `
  <url>
    <loc>${escapeXml(item.loc)}</loc>
    <lastmod>${item.lastmod}</lastmod>${imageElements}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urlElements}
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