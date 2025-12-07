export const dynamic = 'force-dynamic';

import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PATHS } from '@/lib/utils/ai-crawler'
import { logger } from '@/lib/log';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  
  // ⚡ 公開ページの一元管理：robots.ts と同じ PUBLIC_PATHS を使用
  // 内部ページ（/dashboard, /admin, /management-console など）は完全除外
  const staticPages: MetadataRoute.Sitemap = []
  
  // PUBLIC_PATHS から sitemap に含める静的ページを生成
  PUBLIC_PATHS.forEach(path => {
    // robots.txt, sitemap.xml などメタファイルは除外
    if (path === '/robots.txt' || path === '/sitemap.xml') {
      return;
    }
    
    // 各ページの特性に応じて優先度・更新頻度を設定
    let priority = 0.5;
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' = 'monthly';
    
    if (path === '/') {
      priority = 1.0;
      changeFrequency = 'daily';
    } else if (path === '/organizations' || path === '/search') {
      priority = 0.9;
      changeFrequency = 'daily';
    } else if (path === '/hearing-service' || path === '/features') {
      priority = 0.7;
      changeFrequency = 'weekly';
    } else if (path === '/about' || path === '/support' || path === '/news') {
      priority = 0.6;
      changeFrequency = 'weekly';
    } else if (path === '/docs' || path === '/api/docs') {
      priority = 0.5;
      changeFrequency = 'monthly';
    } else {
      // /contact, /privacy, /terms など
      priority = 0.4;
      changeFrequency = 'monthly';
    }
    
    staticPages.push({
      url: path === '/' ? baseUrl : `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    });
  });

  try {
    // 📋 公開組織の動的ページ（ユーザーが公開設定した組織のみ）
    // /o/{slug} 形式 = PUBLIC_PREFIXES で AI クローラーに許可済み
    // ⚠️ 重要：status='published' のもののみ含める（内部ページ除外の方針）
    const { data: organizations } = await supabase
      .from('organizations')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    // Add published organization pages to sitemap
    const organizationPages: MetadataRoute.Sitemap = []
    
    organizations?.forEach((org) => {
      organizationPages.push({
        url: `${baseUrl}/o/${org.slug}`,
        lastModified: new Date(org.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })
    })

    return [...staticPages, ...organizationPages]
  } catch (error) {
    logger.error('Failed to generate sitemap:', { data: error })
    return staticPages
  }
}

/**
 * 📋 sitemap.ts と robots.ts の整合性チェック:
 * 
 * ✅ 必須: 以下のパスリストが一致していること
 * - robots.ts の PUBLIC_PATHS = sitemap.ts に含まれる静的ページ
 * - robots.ts の PUBLIC_PREFIXES (/o/) = sitemap.ts の動的ページ
 * 
 * 🔒 除外済み: 以下は sitemap に含まれない
 * - /dashboard/* (認証必須)
 * - /admin/* (管理画面)
 * - /management-console/* (内部システム)
 * - /auth/* (認証ページ)
 * - 全ての内部・編集系パス
 * 
 * ⚡ 変更時の注意:
 * 公開ページを追加/削除する際は ai-crawler.ts の PUBLIC_PATHS を修正し、
 * robots.ts と sitemap.ts の両方に反映させること
 */