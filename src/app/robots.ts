import { MetadataRoute } from 'next';
import { getAiVisibilityStatus } from '@/lib/ai-visibility-config';
import { logger } from '@/lib/utils/logger';

// AI Visibility Guard Enhanced Robots.txt Generation
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  
  try {
    // Get AI visibility status (enabled/disabled only)
    const status = await getAiVisibilityStatus();
    
    return {
      rules: generateRobotRules(status.enabled),
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  } catch (error) {
    logger.error('Error generating robots.txt', error instanceof Error ? error : new Error(String(error)));
    // Fallback to static configuration (AI monitoring enabled by default)
    return getStaticRobots(baseUrl);
  }
}

function generateRobotRules(aiVisibilityEnabled: boolean): MetadataRoute.Robots['rules'] {
  const rules: MetadataRoute.Robots['rules'] = [];
  
  const standardDisallowPaths = [
    '/api/auth/',
    '/management-console/',
    '/dashboard/',
    '/settings/',
    '/billing/',
    '/checkout/',
    '/webhooks/',
    '/preview/',
    '/_next/',
    '/private/',
    '*.pdf$',
    '*/temp/*',
  ];
  
  // 1. General search engines (full access)
  rules.push({
    userAgent: '*',
    allow: [
      '/',
      '/o/', // Organization pages
      '/pricing',
      '/hearing-service',
      '/search',
      '/organizations',
      '/api/docs', // API documentation
    ],
    disallow: standardDisallowPaths,
  });
  
  // 2. AI Crawlers - access depends on AI visibility setting
  const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'CCBot', 'PerplexityBot'];
  aiCrawlers.forEach(crawler => {
    if (aiVisibilityEnabled) {
      // Allow AI crawlers to access organization pages
      rules.push({
        userAgent: crawler,
        allow: [
          '/o/', // Only allow organization pages
          '/robots.txt',
          '/sitemap.xml',
        ],
        disallow: '/', // Disallow everything else
      });
    } else {
      // Block AI crawlers completely when visibility is disabled
      rules.push({
        userAgent: crawler,
        disallow: '/',
      });
    }
  });
  
  // 3. Known good search engines (full access)
  const searchEngines = ['Googlebot', 'Bingbot'];
  searchEngines.forEach(bot => {
    rules.push({
      userAgent: bot,
      allow: '/',
      disallow: standardDisallowPaths,
    });
  });
  
  // 4. Aggressive scrapers and unwanted bots (block everything)
  const blockedBots = [
    'SemrushBot',
    'AhrefsBot', 
    'MJ12bot',
    'SeznamBot',
    'BLEXBot',
    'DataForSeoBot',
    'dotbot',
    'Applebot', // Can be aggressive
    'facebookexternalhit', // Facebook scraper
    'Twitterbot', // Twitter scraper
  ];
  
  blockedBots.forEach(bot => {
    rules.push({
      userAgent: bot,
      disallow: '/',
    });
  });
  
  return rules;
}

// Removed: getDefaultConfig() - no longer needed with enabled-only approach

function getStaticRobots(baseUrl: string): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/o/',
          '/pricing',
          '/hearing-service',
          '/search',
          '/organizations',
        ],
        disallow: [
          '/api/auth/',
          '/management-console/',
          '/dashboard/',
          '/settings/',
          '/billing/',
          '/checkout/',
          '/webhooks/',
          '/preview/',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/o/',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/o/',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/o/',
        disallow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/o/',
        disallow: '/',
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}