import { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseBrowser = await supabaseServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'
  
  // Generate basic pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/organizations`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  try {
    // 公開企業の動的ページ
    const { data: organizations } = await supabaseBrowser
      .from('organizations')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    // Add organization pages
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
    console.error('Failed to generate sitemap:', error)
    return staticPages
  }
}