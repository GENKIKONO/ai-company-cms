/**
 * AI Crawler Utility Functions & Public/Internal Path Management
 * 「公開ページはすべて AI に読ませる／内部ページはすべて AI からブロック」の一元管理
 */

// AI crawler user agents
export const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User', 
  'CCBot',
  'PerplexityBot',
  'Claude-Web',
  'Bard',
  'Meta-AI'
] as const;

/**
 * 🌐 公開パス（ログインなしで誰でも見えるもの）
 * AI クローラーを含む全ての正当なクローラーに読み取り許可
 */
export const PUBLIC_PATHS = [
  '/',
  '/organizations',
  '/search',
  '/contact',
  '/privacy',
  '/terms',
  '/about',
  '/hearing-service',
  '/features',
  '/support',
  '/news',
  '/docs',
  '/api/docs', // API documentation
  '/robots.txt',
  '/sitemap.xml'
] as const;

/**
 * 🌐 公開プレフィックス（動的パス）
 */
export const PUBLIC_PREFIXES = [
  '/o/', // 組織ページ (公開設定されているもののみ)
  '/search/' // 検索結果ページ
] as const;

/**
 * 🔒 内部プレフィックス（ログイン必須・管理画面・個人情報など）
 * AI クローラーを含む全てのクローラーからブロック
 */
export const INTERNAL_PREFIXES = [
  '/dashboard/',
  '/admin/',
  '/management-console/',
  '/auth/',
  '/my/',
  '/agency/',
  '/partners/dashboard',
  '/test/',
  '/api/auth/',
  '/webhooks/',
  '/checkout/',
  '/billing/',
  '/preview/',
  '/private/',
  '/_next/',
  '/monitor',
  '/security',
  '/aio' // TODO: 用途確認
] as const;

/**
 * 🔒 内部パターン（編集・作成系）
 */
export const INTERNAL_PATTERNS = [
  /\/organizations\/[^\/]+\/edit/,
  /\/organizations\/[^\/]+\/.*\/new/,
  /\/organizations\/new/,
  /\/.*\/edit$/,
  /\/.*\/new$/,
  /\.pdf$/,
  /\/temp\//
] as const;

/**
 * ユーザーエージェントがAIクローラーかどうかを判定
 */
export function isAiCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return AI_CRAWLERS.some(crawler => ua.includes(crawler.toLowerCase()));
}

/**
 * 具体的なAIクローラータイプを特定
 */
export function getAiCrawlerType(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  for (const crawler of AI_CRAWLERS) {
    if (ua.includes(crawler.toLowerCase())) {
      return crawler;
    }
  }
  return null;
}

/**
 * 🌐 パスが公開ページかどうかを判定
 * robots.ts / middleware.ts / sitemap.ts で共通利用
 */
export function isPublicPath(pathname: string): boolean {
  // 静的な公開パス
  if (PUBLIC_PATHS.includes(pathname as any)) {
    return true;
  }
  
  // 公開プレフィックス
  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }
  
  return false;
}

/**
 * 🔒 パスが内部ページかどうかを判定
 */
export function isInternalPath(pathname: string): boolean {
  // 内部プレフィックス
  if (INTERNAL_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return true;
  }
  
  // 内部パターン（編集・作成系）
  if (INTERNAL_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  
  return false;
}

/**
 * @deprecated 後方互換性のため残すが、isPublicPath() を使用してください
 */
export function isAiAllowedPath(pathname: string): boolean {
  return isPublicPath(pathname);
}

/**
 * AIクローラー用のrobots ruleを生成
 * AI Visibility の設定に応じて適切なルールを返す
 */
export function generateAiCrawlerRules(aiVisibilityEnabled: boolean) {
  const rules = [];
  
  for (const crawler of AI_CRAWLERS) {
    if (aiVisibilityEnabled) {
      // AI Visibility有効時：公開ページを普通に読めるようにする
      // User-Agent: * と同じルール「公開 OK / 内部 NG」に統一
      // 重要：Disallow: / は絶対に出力しない
      rules.push({
        userAgent: crawler,
        allow: [...PUBLIC_PATHS, ...PUBLIC_PREFIXES],
        disallow: [...INTERNAL_PREFIXES, '*.pdf$', '*/temp/*']
      });
    } else {
      // AI Visibility無効時：完全ブロック
      rules.push({
        userAgent: crawler,
        disallow: '/'
      });
    }
  }
  
  return rules;
}

/**
 * 📋 設定別の動作説明:
 * 
 * 🟢 AI Visibility 有効時:
 * - GPTBot / ChatGPT-User / CCBot / PerplexityBot が公開ページにアクセス可能
 * - Allow: /, /organizations, /search, /o/, /contact, /privacy, /terms, etc.
 * - Disallow: /dashboard/, /admin/, /management-console/, etc.
 * 
 * 🔴 AI Visibility 無効時:
 * - GPTBot / ChatGPT-User / CCBot / PerplexityBot を完全ブロック
 * - Disallow: / (全てのパスを禁止)
 * 
 * ⚡ ポリシー:
 * - 公開ページはすべて AI に読ませる
 * - 内部ページはすべて AI からブロック
 * - GPTBot だけ特別扱いしない
 */