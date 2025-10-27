// const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化設定
  images: {
    domains: ['localhost', 'via.placeholder.com', 'images.unsplash.com', 'aiohub.jp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'chyicolujwhkycpkxbej.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1年
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // 最適化を有効化（Next.js 15対応）
    loader: 'default',
    unoptimized: false,
  },
  
  // セキュリティ & パフォーマンスヘッダー
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Basic security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // HSTS (production only)
          ...(isProduction ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          }] : []),
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              isProduction 
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://vercel.live"
                : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://vercel.live http://localhost:*",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.aiohub.jp https://vercel.com",
              isProduction
                ? "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://vercel.live"
                : "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com wss://*.supabase.co https://vercel.live http://localhost:* ws://localhost:*",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://vercel.live",
              "media-src 'self' https://*.supabase.co",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://checkout.stripe.com",
              "frame-ancestors 'none'",
              ...(isProduction ? ["upgrade-insecure-requests"] : [])
            ].join('; '),
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'accelerometer=()',
              'ambient-light-sensor=()',
              'autoplay=(self)',
              'battery=()',
              'camera=()',
              'display-capture=()',
              'document-domain=()',
              'encrypted-media=()',
              'execution-while-not-rendered=()',
              'execution-while-out-of-viewport=()',
              'fullscreen=(self)',
              'geolocation=()',
              'gyroscope=()',
              'magnetometer=()',
              'microphone=()',
              'midi=()',
              'navigation-override=()',
              'payment=(self)',
              'picture-in-picture=()',
              'publickey-credentials-get=(self)',
              'screen-wake-lock=()',
              'sync-xhr=()',
              'usb=()',
              'web-share=(self)',
              'xr-spatial-tracking=()'
            ].join(', '),
          },
        ],
      },
      // 静的アセット用の長期キャッシュ
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API用のキャッシュ設定
      {
        source: '/api/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          },
        ],
      },
      // JSON-LD用の長期キャッシュ
      {
        source: '/api/public/:path*/jsonld',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400',
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
  serverExternalPackages: [],
  
  // 実験的機能
  experimental: {
    optimizePackageImports: ['lucide-react'],
    optimizeCss: true, // CSS最適化を有効化
  },
  
  // Turbopack設定（非推奨のturbo設定から移行）
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['css-loader'],
        as: 'css',
      },
    },
  },

  // 本番ビルド最適化
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // TypeScript設定
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint設定
  eslint: {
    ignoreDuringBuilds: false,
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

// 本番環境でのみSentry設定を有効化
module.exports = process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN 
  ? require('@sentry/nextjs').withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;