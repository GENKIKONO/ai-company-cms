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

  // Webpack設定（簡略化）
  webpack: (config) => {
    return config;
  },

  // 外部パッケージ設定（Next.js 15対応）
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 実験的機能
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;