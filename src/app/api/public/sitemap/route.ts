// サイトマップAPI: /api/public/sitemap
// 最低限のサイトマップJSON（将来XML化対応）
import { NextResponse } from 'next/server';
import { logger } from '@/lib/log';

export const dynamic = 'force-dynamic';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  type: 'organization' | 'service' | 'case-study' | 'faq' | 'post' | 'page';
}

/** サービスアイテム（サイトマップ用） */
interface SitemapServiceItem {
  id: string;
  updated_at?: string;
  created_at?: string;
}

/** 事例アイテム（サイトマップ用） */
interface SitemapCaseStudyItem {
  id: string;
  updated_at?: string;
  created_at?: string;
}

/** 投稿アイテム（サイトマップ用） */
interface SitemapPostItem {
  id: string;
  updated_at?: string;
  created_at?: string;
}

async function getAllPublishedOrganizations() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/organizations?limit=100`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return [];
    }
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    logger.error('Failed to fetch organizations', { data: error instanceof Error ? error : new Error(String(error)) });
    return [];
  }
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const sitemap: SitemapEntry[] = [];
    
    // 静的ページ
    sitemap.push({
      url: `${baseUrl}/`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
      type: 'page'
    });
    
    sitemap.push({
      url: `${baseUrl}/organizations`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.8,
      type: 'page'
    });

    // 公開企業とそのコンテンツ
    const organizations = await getAllPublishedOrganizations();
    
    for (const org of organizations) {
      // 企業トップページ
      sitemap.push({
        url: `${baseUrl}/o/${org.slug}`,
        lastModified: org.updated_at || org.created_at,
        changeFrequency: 'weekly',
        priority: 0.9,
        type: 'organization'
      });

      try {
        // 企業の詳細データを取得
        const orgResponse = await fetch(`${baseUrl}/api/public/organizations/${org.slug}`, {
          cache: 'no-store'
        });
        
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          const { services, case_studies, faqs, posts } = orgData.data;

          // サービス一覧・詳細
          if (services && services.length > 0) {
            sitemap.push({
              url: `${baseUrl}/o/${org.slug}/services`,
              lastModified: new Date().toISOString(),
              changeFrequency: 'weekly',
              priority: 0.7,
              type: 'page'
            });

            services.forEach((service: SitemapServiceItem) => {
              sitemap.push({
                url: `${baseUrl}/o/${org.slug}/services/${service.id}`,
                lastModified: service.updated_at || service.created_at || new Date().toISOString(),
                changeFrequency: 'monthly',
                priority: 0.6,
                type: 'service'
              });
            });
          }

          // 事例一覧・詳細
          if (case_studies && case_studies.length > 0) {
            sitemap.push({
              url: `${baseUrl}/o/${org.slug}/case-studies`,
              lastModified: new Date().toISOString(),
              changeFrequency: 'weekly',
              priority: 0.7,
              type: 'page'
            });

            case_studies.forEach((caseStudy: SitemapCaseStudyItem) => {
              sitemap.push({
                url: `${baseUrl}/o/${org.slug}/case-studies/${caseStudy.id}`,
                lastModified: caseStudy.updated_at || caseStudy.created_at || new Date().toISOString(),
                changeFrequency: 'monthly',
                priority: 0.6,
                type: 'case-study'
              });
            });
          }

          // FAQ
          if (faqs && faqs.length > 0) {
            sitemap.push({
              url: `${baseUrl}/o/${org.slug}/faq`,
              lastModified: new Date().toISOString(),
              changeFrequency: 'monthly',
              priority: 0.5,
              type: 'faq'
            });
          }

          // 記事一覧・詳細
          if (posts && posts.length > 0) {
            sitemap.push({
              url: `${baseUrl}/o/${org.slug}/posts`,
              lastModified: new Date().toISOString(),
              changeFrequency: 'daily',
              priority: 0.7,
              type: 'page'
            });

            posts.forEach((post: SitemapPostItem) => {
              sitemap.push({
                url: `${baseUrl}/o/${org.slug}/posts/${post.id}`,
                lastModified: post.updated_at || post.created_at || new Date().toISOString(),
                changeFrequency: 'monthly',
                priority: 0.5,
                type: 'post'
              });
            });
          }
        }
      } catch (error) {
        logger.error(`Failed to fetch data for organization ${org.slug}:`, { data: error });
        // 企業データ取得に失敗しても他の企業は処理を続行
      }
    }

    // 日付順でソート（新しいものが先）
    sitemap.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    const response = {
      sitemap,
      metadata: {
        totalUrls: sitemap.length,
        generatedAt: new Date().toISOString(),
        baseUrl,
        organizations: organizations.length,
        note: 'This is a JSON sitemap. XML version may be implemented in the future.'
      }
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 1時間キャッシュ
      }
    });

  } catch (error) {
    logger.error('Failed to generate sitemap', { data: error instanceof Error ? error : new Error(String(error)) });
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}