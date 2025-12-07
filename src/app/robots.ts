import { MetadataRoute } from 'next';
import { getAiVisibilityStatus } from '@/lib/ai-visibility-config';
import { logger } from '@/lib/utils/logger';
import { generateAiCrawlerRules, PUBLIC_PATHS, INTERNAL_PREFIXES } from '@/lib/utils/ai-crawler';

/**
 * AI Visibility Guard Enhanced Robots.txt Generation
 * 
 * 📋 動作確認用コマンド:
 * 
 * 1. robots.txt の内容確認:
 *    curl https://aiohub.jp/robots.txt
 *    
 * 2. GPTBot のトップページアクセス確認:
 *    curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/
 *    -> HTTP 200 が返されることを確認
 *    
 * 3. GPTBot の組織ページアクセス確認:
 *    curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/o/実在する-org-slug
 *    -> HTTP 200 が返されることを確認
 * 
 * 🎯 期待される robots.txt（AI Visibility 有効時）:
 * 
 * User-Agent: *
 * Allow: /
 * Allow: /o/
 * Allow: /organizations
 * Allow: /search
 * Allow: /help
 * Allow: /terms
 * Allow: /privacy
 * Allow: /contact
 * Allow: /pricing
 * Allow: /hearing-service
 * Allow: /api/docs
 * Disallow: /api/
 * Disallow: /management-console/
 * Disallow: /dashboard/
 * Disallow: /settings/
 * ... (その他内部パス)
 * 
 * User-Agent: GPTBot
 * Allow: /
 * Allow: /organizations
 * Allow: /search
 * Allow: /o/
 * Allow: /help
 * Allow: /terms
 * Allow: /privacy
 * Allow: /contact
 * Allow: /pricing
 * Allow: /hearing-service
 * Allow: /robots.txt
 * Allow: /sitemap.xml
 * Disallow: /dashboard/
 * Disallow: /settings/
 * ... (具体的な内部パスのみ、Disallow: / は含まれない)
 * 
 * ⚠️ 重要: GPTBot / ChatGPT-User / CCBot / PerplexityBot セクションに
 *         「Disallow: /」が含まれていてはいけません
 */
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
    logger.error('Error generating robots.txt', { data: error instanceof Error ? error : new Error(String(error)) });
    // Fallback to static configuration (AI monitoring enabled by default)
    return getStaticRobots(baseUrl);
  }
}

function generateRobotRules(aiVisibilityEnabled: boolean): MetadataRoute.Robots['rules'] {
  const rules: MetadataRoute.Robots['rules'] = [];
  
  // 🌐 公開パスの allow リスト（共通定数から生成）
  const publicAllowPaths = [...PUBLIC_PATHS];
  
  // 🔒 内部パスの disallow リスト（共通定数から生成 + 追加ルール）
  const internalDisallowPaths = [
    ...INTERNAL_PREFIXES,
    '*.pdf$',
    '*/temp/*'
  ];
  
  // 1. 基本ルール（User-Agent: *）- 公開 OK / 内部 NG の基本方針
  rules.push({
    userAgent: '*',
    allow: publicAllowPaths,
    disallow: internalDisallowPaths,
  });
  
  // 2. AI Crawlers - AI Visibility 設定に応じてルール生成
  // 有効時：User-Agent: * と同じ「公開 OK / 内部 NG」
  // 無効時：完全ブロック
  const aiCrawlerRules = generateAiCrawlerRules(aiVisibilityEnabled);
  rules.push(...aiCrawlerRules);
  
  // 3. 正当な検索エンジン（明示的に同じルール適用）
  const searchEngines = ['Googlebot', 'Bingbot'];
  searchEngines.forEach(bot => {
    rules.push({
      userAgent: bot,
      allow: publicAllowPaths,
      disallow: internalDisallowPaths,
    });
  });
  
  // 4. 攻撃的スクレイパー・不要ボット（完全ブロック）
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
  // フォールバック時も共通ルールを使用
  return {
    rules: generateRobotRules(true), // AI Visibility enabled by default in fallback
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

/**
 * 🎯 統一ポリシー実装完了:
 * 
 * 「公開ページはすべて AI に読ませる／内部ページはすべて AI からブロック」
 * 
 * 📋 実装内容:
 * - 公開/内部パスの定義を ai-crawler.ts に一元化
 * - AI Visibility 有効時：GPTBot等が User-Agent: * と同じルール
 * - AI Visibility 無効時：GPTBot等を完全ブロック
 * - 特定クローラーだけ特別扱いしない統一方針
 * 
 * 🌐 公開パス（Allow）:
 *   /, /organizations, /search, /o/*, /contact, /privacy, /terms, 
 *   /about, /hearing-service, /features, /support, /news, /docs, /api/docs
 * 
 * 🔒 内部パス（Disallow）:
 *   /dashboard/*, /admin/*, /management-console/*, /auth/*, /my/*, 
 *   /agency/*, /test/*, /api/auth/*, /webhooks/*, /checkout/*, /billing/*, 
 *   /preview/*, /private/*, /_next/*, *.pdf$, 一時ファイルパス
 * 
 * ⚡ 整合性:
 * - robots.ts / sitemap.ts / middleware.ts で同じパス定義を共有
 * - 変更時は ai-crawler.ts の定数を修正すれば全体に反映
 * 
 * 📋 動作確認チェックリスト:
 * 
 * # 1. robots.txt: GPTBot 専用 Disallow:/ が消えていること
 * curl https://aiohub.jp/robots.txt
 * 
 * # 2. GPTBot が公開ページを 200 で取得できること
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/organizations
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/o/実在する-org-slug
 * 
 * # 3. GPTBot が内部ページをブロックされること（認証リダイレクト or 401/403）
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/dashboard
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/admin
 * 
 * # 4. sitemap に内部ページが含まれていないこと
 * curl https://aiohub.jp/sitemap.xml | grep -E "(dashboard|admin|management-console)"
 * # → マッチしないことを確認
 * 
 * # 5. 公開ページで X-Robots-Tag: noindex が付いていないこと
 * curl -I -H "User-Agent: GPTBot/1.0" https://aiohub.jp/ | grep -i robots
 * curl -I -H "User-Agent: ChatGPT-User/1.0" https://aiohub.jp/organizations | grep -i robots
 * # → X-Robots-Tag: index, follow または X-Robots-Tag ヘッダーなしを確認
 * 
 * # 6. 他の AI クローラーでも同様の挙動
 * curl -I -H "User-Agent: ChatGPT-User/1.0" https://aiohub.jp/
 * curl -I -H "User-Agent: CCBot/1.0" https://aiohub.jp/
 * curl -I -H "User-Agent: PerplexityBot/1.0" https://aiohub.jp/
 */