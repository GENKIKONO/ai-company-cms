// Vercel Production Deployment Configuration
// Ensures consistent production deployments

module.exports = {
  // Project configuration
  name: 'aiohub-cms-production',
  version: 2,
  
  // Build configuration
  builds: [
    {
      src: 'package.json',
      use: '@vercel/node'
    }
  ],
  
  // Environment handling
  env: {
    NODE_ENV: 'production'
  },
  
  // Route configuration
  routes: [
    {
      src: '/(.*)',
      dest: '/$1'
    }
  ],
  
  // GitHub integration settings
  github: {
    enabled: true,
    autoAlias: false, // Disable auto-aliasing to prevent preview deployments
    silent: false
  },
  
  // Domain configuration
  alias: ['aiohub.jp', 'www.aiohub.jp'],
  
  // Deployment settings
  targets: {
    production: {
      domain: 'aiohub.jp',
      alias: ['www.aiohub.jp']
    }
  },
  
  // Function configuration
  functions: {
    'src/app/api/admin/ai-visibility/run/route.ts': {
      maxDuration: 30
    },
    'src/app/api/cron/daily/route.ts': {
      maxDuration: 120
    }
  },
  
  // Regional configuration
  regions: ['nrt1'], // Tokyo region for better performance in Japan
  
  // Security headers
  headers: [
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-cache, no-store, must-revalidate'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        }
      ]
    }
  ],
  
  // Build command override for production
  buildCommand: 'npm run prod:build',
  
  // Install command
  installCommand: 'npm ci',
  
  // Output directory
  outputDirectory: '.next',
  
  // Development command
  devCommand: 'npm run dev',
  
  // Framework detection
  framework: 'nextjs'
};