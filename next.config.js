const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化設定
  images: {
    domains: ['localhost', 'via.placeholder.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // リダイレクト設定
  async redirects() {
    return [
      {
        source: '/org/:slug',
        destination: '/organizations/:slug',
        permanent: true,
      },
    ];
  },

  // Webpack設定（環境バリデーション付き）
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    if (!dev && isServer) {
      // Build-time environment validation
      const adminEmail = process.env.ADMIN_EMAIL;
      const opsPassword = process.env.ADMIN_OPS_PASSWORD;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      console.log('\n🔍 [BUILD] Environment Validation:');
      console.log(`ADMIN_EMAIL: ${adminEmail ? '✅ Set' : '❌ Missing'}`);
      console.log(`ADMIN_OPS_PASSWORD: ${opsPassword ? (opsPassword.trim().length >= 20 ? '✅ Set (length ok)' : `⚠️ Set (${opsPassword.trim().length} chars, need >=20)`) : '❌ Missing'}`);
      console.log(`NEXT_PUBLIC_APP_URL: ${appUrl === 'https://aiohub.jp' ? '✅ aiohub.jp' : `⚠️ ${appUrl || 'Missing'}`}`);
      console.log('');
      
      // Run acceptance test
      if (process.env.NODE_ENV === 'production') {
        console.log('🧪 [BUILD] Production acceptance test will run after deployment');
      }
    }
    
    return config;
  },

  // 外部パッケージ設定（Next.js 15対応）
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 実験的機能
  experimental: {
    webpackBuildWorker: true,
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin.
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  
  // Upload source maps in production only
  dryRun: process.env.NODE_ENV !== 'production',
  
  // Automatically tree-shake Sentry logger statements for production
  disableLogger: true,
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);