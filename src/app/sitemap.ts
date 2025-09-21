import { MetadataRoute } from 'next'
import { supabaseServer } from '@/lib/supabase-server'
import { seoI18n } from '@/lib/seo-i18n'
import { locales } from '@/i18n'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = supabaseServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://luxucare.example.com'
  
  // Generate internationalized basic pages
  const staticPages: MetadataRoute.Sitemap = []
  
  // Add home pages for each locale
  locales.forEach(locale => {
    const alternateLanguages: Record<string, string> = {}
    locales.forEach(altLocale => {
      alternateLanguages[altLocale] = `${baseUrl}/${altLocale}`
    })
    
    staticPages.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: alternateLanguages,
      },
    })
  })
  
  // Add directory pages for each locale
  locales.forEach(locale => {
    const alternateLanguages: Record<string, string> = {}
    locales.forEach(altLocale => {
      alternateLanguages[altLocale] = `${baseUrl}/${altLocale}/directory`
    })
    
    staticPages.push({
      url: `${baseUrl}/${locale}/directory`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: alternateLanguages,
      },
    })
  })
  
  // Add search pages for each locale
  locales.forEach(locale => {
    const alternateLanguages: Record<string, string> = {}
    locales.forEach(altLocale => {
      alternateLanguages[altLocale] = `${baseUrl}/${altLocale}/search`
    })
    
    staticPages.push({
      url: `${baseUrl}/${locale}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: alternateLanguages,
      },
    })
  })

  // Add additional pages for each locale
  const additionalPages = ['/favorites', '/compare', '/dashboard', '/api/docs']
  additionalPages.forEach(page => {
    locales.forEach(locale => {
      const alternateLanguages: Record<string, string> = {}
      locales.forEach(altLocale => {
        alternateLanguages[altLocale] = `${baseUrl}/${altLocale}${page}`
      })
      
      staticPages.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '/api/docs' ? 0.6 : 0.5,
        alternates: {
          languages: alternateLanguages,
        },
      })
    })
  })

  try {
    // 公開企業の動的ページ
    const { data: organizations } = await supabase
      .from('organizations')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    // Add organization pages for each locale
    const organizationPages: MetadataRoute.Sitemap = []
    
    organizations?.forEach((org) => {
      locales.forEach(locale => {
        const alternateLanguages: Record<string, string> = {}
        locales.forEach(altLocale => {
          alternateLanguages[altLocale] = `${baseUrl}/${altLocale}/o/${org.slug}`
        })
        
        organizationPages.push({
          url: `${baseUrl}/${locale}/o/${org.slug}`,
          lastModified: new Date(org.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          alternates: {
            languages: alternateLanguages,
          },
        })
      })
    })

    return [...staticPages, ...organizationPages]
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    return staticPages
  }
}