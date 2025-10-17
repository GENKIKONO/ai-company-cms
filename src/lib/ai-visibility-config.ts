import { createClient } from '@supabase/supabase-js';

interface AiVisibilityStatus {
  enabled: boolean;
  last_check?: string;
}

// Default safe configuration - enabled = true (allow monitoring)
const DEFAULT_STATUS: AiVisibilityStatus = {
  enabled: true // Safe default: monitoring enabled
};

let statusCache: AiVisibilityStatus | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAiVisibilityStatus(): Promise<AiVisibilityStatus> {
  // Return cached status if still valid
  if (statusCache && Date.now() < cacheExpiry) {
    return statusCache;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Simple singleton query: SELECT enabled, last_check FROM ai_visibility_config LIMIT 1
    const { data, error } = await supabase
      .from('ai_visibility_config')
      .select('enabled, last_check')
      .limit(1)
      .single();

    if (error) {
      console.warn('[AI Visibility] Database error, using fallback enabled=true:', error.message);
      await sendStatusErrorNotification(error);
      return DEFAULT_STATUS;
    }

    if (!data) {
      console.warn('[AI Visibility] No configuration record found, using fallback enabled=true');
      await sendStatusErrorNotification(new Error('No configuration record found'));
      return DEFAULT_STATUS;
    }

    const status: AiVisibilityStatus = {
      enabled: Boolean(data.enabled),
      last_check: data.last_check || undefined
    };

    // Cache the status
    statusCache = status;
    cacheExpiry = Date.now() + CACHE_DURATION;

    console.log('[AI Visibility] Status loaded successfully:', status);
    return status;

  } catch (error) {
    console.warn('[AI Visibility] Fatal error loading status, using fallback enabled=true:', error);
    await sendStatusErrorNotification(error);
    return DEFAULT_STATUS;
  }
}

// Update last_check timestamp (enabled-only DB schema)
export async function updateLastCheck(): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('ai_visibility_config')
      .update({ 
        last_check: new Date().toISOString() 
      })
      .limit(1); // Update first record only (singleton)

    if (error) {
      console.warn('[AI Visibility] Failed to update last_check:', error.message);
    } else {
      // Clear cache to force refresh on next read
      clearStatusCache();
      console.log('[AI Visibility] Last check timestamp updated successfully');
    }
  } catch (error) {
    console.warn('[AI Visibility] Error updating last_check:', error);
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

async function sendStatusErrorNotification(error: any) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "⚠️ AI Visibility Status Error - Using Fallback"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Error:* ${error instanceof Error ? error.message : 'Unknown error'}\n*Time:* ${new Date().toISOString()}\n*Mode:* Safe fallback enabled=true\n*Impact:* AI visibility monitoring enabled by default`
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*Action Required:* Check ai_visibility_config table schema (should have 'enabled' boolean column)"
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
    console.error('[AI Visibility] Failed to send error notification:', slackError);
  }
}

// Clear cache (useful for testing or manual refresh)
export function clearStatusCache() {
  statusCache = null;
  cacheExpiry = 0;
}