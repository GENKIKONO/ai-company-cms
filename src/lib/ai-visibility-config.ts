import { createClient } from '@supabase/supabase-js';

interface AiVisibilityConfig {
  allowed_crawlers: {
    search_engines: string[];
    ai_crawlers: string[];
    paths: Record<string, string[]>;
  };
  rate_limits: {
    default: { requests: number; window_seconds: number };
    strict: { requests: number; window_seconds: number };
    ai_crawlers: { requests: number; window_seconds: number };
  };
  blocked_paths: string[];
  notification_settings: {
    slack_webhook: string;
    alert_thresholds: { P0: number; P1: number; P2: number };
    daily_summary: boolean;
  };
  content_protection: {
    jsonld_signing: boolean;
    origin_tags: boolean;
    signature_secret: string;
  };
}

// Default safe configuration - allows all access
const DEFAULT_CONFIG: AiVisibilityConfig = {
  allowed_crawlers: {
    search_engines: ["Googlebot", "Bingbot", "DuckDuckBot", "YandexBot"],
    ai_crawlers: ["GPTBot", "CCBot", "PerplexityBot", "Claude-Web"],
    paths: {
      "/o/": ["GPTBot", "CCBot", "PerplexityBot", "Claude-Web", "Googlebot", "Bingbot"], // Allow all for /o/ path
      "/": ["Googlebot", "Bingbot", "DuckDuckBot", "YandexBot"] // Search engines only for root
    }
  },
  rate_limits: {
    default: { requests: 5, window_seconds: 10 }, // More permissive
    strict: { requests: 2, window_seconds: 5 },
    ai_crawlers: { requests: 10, window_seconds: 60 } // More permissive for AI crawlers
  },
  blocked_paths: [
    "/dashboard", "/api/auth", "/billing", "/checkout", 
    "/preview", "/webhooks", "/admin", "/management-console"
  ],
  notification_settings: {
    slack_webhook: "",
    alert_thresholds: { P0: 1, P1: 5, P2: 10 },
    daily_summary: true
  },
  content_protection: {
    jsonld_signing: false, // Disabled in fallback mode
    origin_tags: true,
    signature_secret: "fallback-mode-secret"
  }
};

let configCache: AiVisibilityConfig | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAiVisibilityConfig(): Promise<AiVisibilityConfig> {
  // Return cached config if still valid
  if (configCache && Date.now() < cacheExpiry) {
    return configCache;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: configs, error } = await supabase
      .from('ai_visibility_config')
      .select('config_key, config_value')
      .eq('is_active', true);

    if (error) {
      console.warn('[AI Visibility Config] Database error, using fallback config:', error.message);
      await sendConfigErrorNotification(error);
      return DEFAULT_CONFIG;
    }

    if (!configs || configs.length === 0) {
      console.warn('[AI Visibility Config] No active configuration found, using fallback config');
      await sendConfigErrorNotification(new Error('No active configuration found'));
      return DEFAULT_CONFIG;
    }

    // Parse database configuration
    const dbConfig: Partial<AiVisibilityConfig> = {};
    
    configs.forEach(({ config_key, config_value }) => {
      try {
        switch (config_key) {
          case 'allowed_crawlers':
            dbConfig.allowed_crawlers = config_value;
            break;
          case 'rate_limits':
            dbConfig.rate_limits = config_value;
            break;
          case 'blocked_paths':
            dbConfig.blocked_paths = config_value;
            break;
          case 'notification_settings':
            dbConfig.notification_settings = config_value;
            break;
          case 'content_protection':
            dbConfig.content_protection = config_value;
            break;
        }
      } catch (parseError) {
        console.warn(`[AI Visibility Config] Failed to parse ${config_key}:`, parseError);
      }
    });

    // Merge with defaults to ensure all required fields are present
    const mergedConfig: AiVisibilityConfig = {
      allowed_crawlers: dbConfig.allowed_crawlers || DEFAULT_CONFIG.allowed_crawlers,
      rate_limits: dbConfig.rate_limits || DEFAULT_CONFIG.rate_limits,
      blocked_paths: dbConfig.blocked_paths || DEFAULT_CONFIG.blocked_paths,
      notification_settings: dbConfig.notification_settings || DEFAULT_CONFIG.notification_settings,
      content_protection: dbConfig.content_protection || DEFAULT_CONFIG.content_protection
    };

    // Cache the configuration
    configCache = mergedConfig;
    cacheExpiry = Date.now() + CACHE_DURATION;

    console.log('[AI Visibility Config] Configuration loaded successfully from database');
    return mergedConfig;

  } catch (error) {
    console.error('[AI Visibility Config] Fatal error loading configuration, using fallback:', error);
    await sendConfigErrorNotification(error);
    return DEFAULT_CONFIG;
  }
}

export function getStaticRobots(): string {
  // Static robots.txt content when dynamic generation fails
  return `# Fallback robots.txt - Safe defaults
# Generated in fallback mode due to configuration error

User-agent: *
Disallow: /dashboard
Disallow: /api/auth
Disallow: /billing
Disallow: /checkout
Disallow: /preview
Disallow: /webhooks
Disallow: /admin
Disallow: /management-console

# Allow search engines everywhere else
User-agent: Googlebot
Disallow: /dashboard
Disallow: /api/auth
Disallow: /billing
Disallow: /checkout
Disallow: /preview
Disallow: /webhooks
Disallow: /admin
Disallow: /management-console

User-agent: Bingbot
Disallow: /dashboard
Disallow: /api/auth
Disallow: /billing
Disallow: /checkout
Disallow: /preview
Disallow: /webhooks
Disallow: /admin
Disallow: /management-console

# AI crawlers - allow /o/ path only
User-agent: GPTBot
Disallow: /
Allow: /o/

User-agent: CCBot
Disallow: /
Allow: /o/

User-agent: PerplexityBot
Disallow: /
Allow: /o/

User-agent: Claude-Web
Disallow: /
Allow: /o/

Sitemap: https://aiohub.jp/sitemap.xml
`;
}

async function sendConfigErrorNotification(error: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "⚠️ AI Visibility Config Error - Using Fallback"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* ${error instanceof Error ? error.message : 'Unknown error'}\n*Time:* ${new Date().toISOString()}\n*Mode:* Safe fallback configuration active\n*Impact:* All AI crawlers allowed on /o/ path, search engines on all paths`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Action Required:* Check ai_visibility_config table in Supabase"
          }
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

  } catch (slackError) {
    console.error('[AI Visibility Config] Failed to send error notification:', slackError);
  }
}

// Clear cache (useful for testing or manual refresh)
export function clearConfigCache() {
  configCache = null;
  cacheExpiry = 0;
}