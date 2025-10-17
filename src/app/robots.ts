import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// AI Visibility Guard Enhanced Robots.txt Generation
export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';
  
  try {
    // Get dynamic configuration from Supabase
    const config = await getAIVisibilityConfig();
    
    return {
      rules: generateRobotRules(config),
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    // Fallback to static configuration
    return getStaticRobots(baseUrl);
  }
}

async function getAIVisibilityConfig(): Promise<any> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from('ai_visibility_config')
    .select('config_key, config_value')
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching AI visibility config:', error);
    return getDefaultConfig();
  }
  
  // Convert array to object
  const config: any = {};
  data?.forEach((item) => {
    config[item.config_key] = item.config_value;
  });
  
  return config;
}

function generateRobotRules(config: any): MetadataRoute.Robots['rules'] {
  const allowedCrawlers = config.allowed_crawlers || getDefaultConfig().allowed_crawlers;
  const blockedPaths = config.blocked_paths || getDefaultConfig().blocked_paths;
  
  const rules: MetadataRoute.Robots['rules'] = [];
  
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
    disallow: [
      ...blockedPaths,
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
    ],
  });
  
  // 2. AI Crawlers (restricted to /o/ paths only)
  const aiCrawlers = ['GPTBot', 'ChatGPT-User', 'CCBot', 'PerplexityBot'];
  aiCrawlers.forEach(crawler => {
    rules.push({
      userAgent: crawler,
      allow: [
        '/o/', // Only allow organization pages
        '/robots.txt',
        '/sitemap.xml',
      ],
      disallow: '/', // Disallow everything else
    });
  });
  
  // 3. Known good search engines (full access)
  const searchEngines = ['Googlebot', 'Bingbot'];
  searchEngines.forEach(bot => {
    rules.push({
      userAgent: bot,
      allow: '/',
      disallow: [
        ...blockedPaths,
        '/api/auth/',
        '/management-console/',
        '/dashboard/',
        '/settings/',
        '/billing/',
        '/checkout/',
        '/webhooks/',
        '/preview/',
      ],
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

function getDefaultConfig(): any {
  return {
    allowed_crawlers: {
      search_engines: ["Googlebot", "Bingbot"],
      ai_crawlers: ["GPTBot", "CCBot", "PerplexityBot"],
      paths: {
        "/o/": ["GPTBot", "CCBot", "PerplexityBot"],
        "/": ["Googlebot", "Bingbot"]
      }
    },
    blocked_paths: [
      "/dashboard",
      "/api/auth", 
      "/billing",
      "/checkout",
      "/preview",
      "/webhooks",
      "/admin",
      "/management-console"
    ]
  };
}

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