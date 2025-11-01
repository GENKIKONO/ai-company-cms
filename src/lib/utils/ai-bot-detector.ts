/**
 * AI Bot Detection Utility
 * AI/検索クローラのUser-Agentを判定してボット種別を返す
 */

export interface BotDetectionResult {
  isBot: boolean;
  botName: string | null;
  category: 'ai' | 'search' | 'unknown' | null;
}

// 既知のAI Botパターン
const AI_BOT_PATTERNS = [
  { name: 'GPTBot', pattern: /GPTBot/i, category: 'ai' as const },
  { name: 'ChatGPT', pattern: /ChatGPT-User/i, category: 'ai' as const },
  { name: 'Bingbot', pattern: /bingbot/i, category: 'ai' as const },
  { name: 'PerplexityBot', pattern: /PerplexityBot/i, category: 'ai' as const },
  { name: 'Google-Extended', pattern: /Google-Extended/i, category: 'ai' as const },
  { name: 'ClaudeBot', pattern: /ClaudeBot/i, category: 'ai' as const },
  { name: 'FacebookBot', pattern: /facebookexternalhit/i, category: 'ai' as const },
  { name: 'TwitterBot', pattern: /Twitterbot/i, category: 'search' as const },
  { name: 'LinkedInBot', pattern: /LinkedInBot/i, category: 'search' as const },
  { name: 'Googlebot', pattern: /Googlebot/i, category: 'search' as const },
] as const;

/**
 * User-AgentからAI Botを検知
 */
export function detectAIBot(userAgent: string): BotDetectionResult {
  console.log('🔍 [AI Bot Detection] Analyzing User-Agent:', userAgent);
  
  if (!userAgent) {
    console.log('❌ [AI Bot Detection] No User-Agent provided');
    return { isBot: false, botName: null, category: null };
  }

  for (const bot of AI_BOT_PATTERNS) {
    if (bot.pattern.test(userAgent)) {
      console.log('✅ [AI Bot Detection] Bot detected:', { 
        name: bot.name, 
        category: bot.category, 
        pattern: bot.pattern.toString(),
        userAgent 
      });
      return {
        isBot: true,
        botName: bot.name,
        category: bot.category,
      };
    }
  }

  console.log('❌ [AI Bot Detection] No bot pattern matched for:', userAgent);
  return { isBot: false, botName: null, category: null };
}

/**
 * Request HeadersからBot情報を抽出
 * NextRequest.headersまたは標準のHeadersオブジェクトに対応
 */
export function extractBotInfoFromHeaders(headers: any): BotDetectionResult {
  let userAgent = '';
  
  try {
    if (headers && typeof headers.get === 'function') {
      // 標準のHeadersオブジェクト
      userAgent = headers.get('user-agent') || '';
    } else if (headers && typeof headers === 'object') {
      // NextRequest.headers (ReadonlyHeaders) - プロパティ直接アクセスを試行
      userAgent = headers['user-agent'] || 
                  headers.get?.('user-agent') || 
                  '';
    }
  } catch (error) {
    // ヘッダー取得に失敗した場合はデフォルトを返す
    console.warn('Failed to extract user-agent from headers:', error);
  }
  
  return detectAIBot(userAgent);
}

/**
 * ログ対象のBotかどうかを判定（AIカテゴリのみログ）
 */
export function shouldLogBot(botResult: BotDetectionResult): boolean {
  return botResult.isBot && botResult.category === 'ai';
}

/**
 * IPアドレスを取得（NextJSのHeadersから）
 * NextRequest.headersまたは標準のHeadersオブジェクトに対応
 */
export function extractClientIP(headers: any): string | null {
  let forwardedFor = '';
  let realIP = '';
  let clientIP = '';
  
  try {
    if (headers && typeof headers.get === 'function') {
      // 標準のHeadersオブジェクト
      forwardedFor = headers.get('x-forwarded-for') || '';
      realIP = headers.get('x-real-ip') || '';
      clientIP = headers.get('x-client-ip') || '';
    } else if (headers && typeof headers === 'object') {
      // NextRequest.headers (ReadonlyHeaders) - プロパティ直接アクセスを試行
      forwardedFor = headers['x-forwarded-for'] || headers.get?.('x-forwarded-for') || '';
      realIP = headers['x-real-ip'] || headers.get?.('x-real-ip') || '';
      clientIP = headers['x-client-ip'] || headers.get?.('x-client-ip') || '';
    }
  } catch (error) {
    // ヘッダー取得に失敗した場合はnullを返す
    console.warn('Failed to extract IP from headers:', error);
    return null;
  }

  if (forwardedFor) {
    // x-forwarded-forは複数IPがカンマ区切りで入る場合がある
    return forwardedFor.split(',')[0].trim();
  }

  return realIP || clientIP || null;
}