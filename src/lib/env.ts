/**
 * 環境変数の安全読み出しユーティリティ
 * すべての環境変数をトリム・正規化して提供
 * 改行検出とバリデーション機能付き
 */

// 改行検出ヘルパー
function cleanEnvValue(value: string): string {
  return value.replace(/\r?\n/g, '').trim();
}

// 改行検出チェック
function hasNewline(value: string): boolean {
  return /\r?\n/.test(value);
}

export const env = {
  // App基本設定
  APP_URL: cleanEnvValue(process.env.NEXT_PUBLIC_APP_URL || ''),
  NEXT_PUBLIC_APP_URL: cleanEnvValue(process.env.NEXT_PUBLIC_APP_URL || ''),
  COOKIE_DOMAIN: cleanEnvValue(process.env.SUPABASE_COOKIE_DOMAIN || process.env.COOKIE_DOMAIN || ''),
  
  // 管理者設定
  ADMIN_EMAIL: cleanEnvValue(process.env.ADMIN_EMAIL || '').toLowerCase(),
  ADMIN_OPS_PASSWORD: cleanEnvValue(process.env.ADMIN_OPS_PASSWORD || ''),
  
  // セキュリティ設定
  JWT_SECRET: cleanEnvValue(process.env.JWT_SECRET || ''),
  
  // フィーチャーフラグ
  SHOW_BUILD_BANNER: process.env.SHOW_BUILD_BANNER === 'true',
  SHOW_BUILD_BADGE: process.env.SHOW_BUILD_BADGE !== 'false', // デフォルトtrue、本番でfalse
  ENABLE_PARTNER_FLOW: process.env.ENABLE_PARTNER_FLOW !== 'false', // デフォルトtrue
  
  // 監視・エラー管理
  NEXT_PUBLIC_SENTRY_DSN: cleanEnvValue(process.env.NEXT_PUBLIC_SENTRY_DSN || ''),
  
  // Stripe設定
  STRIPE_SECRET_KEY: cleanEnvValue(process.env.STRIPE_SECRET_KEY || ''),
  STRIPE_PUBLISHABLE_KEY: cleanEnvValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''),
  STRIPE_WEBHOOK_SECRET: cleanEnvValue(process.env.STRIPE_WEBHOOK_SECRET || ''),
  STRIPE_BASIC_PRICE_ID: cleanEnvValue(process.env.STRIPE_BASIC_PRICE_ID || ''),
  
  // Segment-based Stripe Pricing (新しい価格体系)
  // Normal pricing (基準価格)
  STRIPE_NORMAL_BASIC_PRICE_ID: cleanEnvValue(process.env.STRIPE_NORMAL_BASIC_PRICE_ID || ''),
  STRIPE_NORMAL_PRO_PRICE_ID: cleanEnvValue(process.env.STRIPE_NORMAL_PRO_PRICE_ID || ''),
  STRIPE_NORMAL_BUSINESS_PRICE_ID: cleanEnvValue(process.env.STRIPE_NORMAL_BUSINESS_PRICE_ID || ''),
  // Early user pricing (20% discount)
  STRIPE_EARLY_BASIC_PRICE_ID: cleanEnvValue(process.env.STRIPE_EARLY_BASIC_PRICE_ID || ''),
  STRIPE_EARLY_PRO_PRICE_ID: cleanEnvValue(process.env.STRIPE_EARLY_PRO_PRICE_ID || ''),
  STRIPE_EARLY_BUSINESS_PRICE_ID: cleanEnvValue(process.env.STRIPE_EARLY_BUSINESS_PRICE_ID || ''),
  // Test user pricing (30% discount)
  STRIPE_TEST_BASIC_PRICE_ID: cleanEnvValue(process.env.STRIPE_TEST_BASIC_PRICE_ID || ''),
  STRIPE_TEST_PRO_PRICE_ID: cleanEnvValue(process.env.STRIPE_TEST_PRO_PRICE_ID || ''),
  STRIPE_TEST_BUSINESS_PRICE_ID: cleanEnvValue(process.env.STRIPE_TEST_BUSINESS_PRICE_ID || ''),
  
  // 外部サービス
  RESEND_API_KEY: cleanEnvValue(process.env.RESEND_API_KEY || ''),
  SLACK_WEBHOOK_URL: cleanEnvValue(process.env.SLACK_WEBHOOK_URL || ''),
  
  // Supabase
  SUPABASE_URL: cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
  SUPABASE_ANON_KEY: cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
  SUPABASE_SERVICE_KEY: cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
} as const;

/**
 * 環境変数の健全性チェック（拡張版）
 */
export function validateEnvVars(): { valid: boolean; issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // 改行チェック
  Object.entries(process.env).forEach(([key, value]) => {
    if (value && hasNewline(value)) {
      issues.push(`ENV ${key} contains newline characters`);
    }
  });
  
  // CRITICAL: 必須環境変数チェック
  const critical = [
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  critical.forEach(key => {
    if (!process.env[key]?.trim()) {
      issues.push(`🚨 CRITICAL: Missing required environment variable: ${key}`);
    }
  });
  
  // HIGH PRIORITY: 主要機能チェック
  const high = [
    'ADMIN_EMAIL',
    'RESEND_API_KEY',
    'OPENAI_API_KEY',
    'JWT_SECRET'
  ];
  
  high.forEach(key => {
    if (!process.env[key]?.trim()) {
      warnings.push(`⚠️  HIGH: Missing environment variable for main features: ${key}`);
    }
  });
  
  // セキュリティチェック
  if (env.ADMIN_OPS_PASSWORD && env.ADMIN_OPS_PASSWORD.length < 20) {
    issues.push('🔒 ADMIN_OPS_PASSWORD should be at least 20 characters');
  }
  
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    issues.push('🔒 JWT_SECRET should be at least 32 characters');
  }
  
  // URL検証
  if (env.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(env.NEXT_PUBLIC_APP_URL);
    } catch {
      issues.push('🌐 NEXT_PUBLIC_APP_URL is not a valid URL');
    }
  }
  
  // 本番環境特別チェック
  if (process.env.NODE_ENV === 'production') {
    if (env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      issues.push('🚨 PRODUCTION: NEXT_PUBLIC_APP_URL should not contain localhost');
    }
    
    if (!env.NEXT_PUBLIC_SENTRY_DSN) {
      warnings.push('📊 PRODUCTION: Consider setting NEXT_PUBLIC_SENTRY_DSN for error monitoring');
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * 起動時環境変数チェック（ログ付き）
 */
export function startupEnvCheck(): boolean {
  const result = validateEnvVars();
  
  // ログ出力（本番環境では軽量化）
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction || result.issues.length > 0) {
    console.log('🔍 Environment Variables Check');
    console.log('================================');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Total variables: ${Object.keys(process.env).length}`);
  }
  
  // Critical issues
  if (result.issues.length > 0) {
    console.error('❌ Environment Issues Found:');
    result.issues.forEach(issue => console.error(`  ${issue}`));
    
    if (isProduction) {
      console.error('🚨 Production deployment blocked due to environment issues');
      return false;
    }
  }
  
  // Warnings
  if (result.warnings.length > 0 && !isProduction) {
    console.warn('⚠️  Environment Warnings:');
    result.warnings.forEach(warning => console.warn(`  ${warning}`));
  }
  
  // Success
  if (result.valid && !isProduction) {
    console.log('✅ All critical environment variables are configured');
  }
  
  if (!isProduction || result.issues.length > 0) {
    console.log('================================');
  }
  
  return result.valid;
}

/**
 * 本番環境向け軽量チェック
 */
export function productionEnvCheck(): { critical: string[]; missing: number } {
  const critical = [
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  const missing = critical.filter(key => !process.env[key]?.trim());
  
  return {
    critical: missing,
    missing: missing.length
  };
}

/**
 * eTLD+1ドメイン抽出（フォールバック用）
 */
export function extractDomainFromHost(host: string): string {
  if (host.includes('.')) {
    const parts = host.split('.');
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join('.')}`;
    }
  }
  return host;
}

/**
 * Cookie用ドメイン取得（優先度順）
 */
export function getCookieDomain(request?: { headers: { get(name: string): string | null } }): string {
  if (env.COOKIE_DOMAIN) {
    return env.COOKIE_DOMAIN;
  }
  
  if (request) {
    const host = request.headers.get('host') || '';
    return extractDomainFromHost(host);
  }
  
  return '';
}