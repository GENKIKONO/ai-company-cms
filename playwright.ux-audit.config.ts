import { defineConfig, devices } from '@playwright/test';

/**
 * AIOHub UX/UI監査専用設定
 * 本番環境の読み取り専用監査を実行
 */
export default defineConfig({
  testDir: './tests/ux-audit',
  fullyParallel: false, // 順次実行でレポート生成の一貫性を保つ
  forbidOnly: false,
  retries: 0,
  workers: 1, // シングルワーカーで一貫したレポート生成
  reporter: [
    ['html', { outputFolder: 'reports/responsive-audit/playwright-report' }],
    ['json', { outputFile: 'reports/responsive-audit/test-results.json' }]
  ],
  
  use: {
    baseURL: 'https://aiohub.jp',
    trace: 'retain-on-failure',
    screenshot: 'always',
    video: 'off', // 監査では不要
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'mobile-small',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 360, height: 720 }
      },
    },
    {
      name: 'mobile-large',
      use: { 
        ...devices['iPhone 12 Pro'],
        viewport: { width: 390, height: 844 }
      },
    },
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Mini'],
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'desktop-medium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      },
    },
    {
      name: 'desktop-large',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
  ],

  // 本番環境なのでwebServerは不要
  
  expect: {
    timeout: 15000,
  },
  
  timeout: 120000, // 監査は時間がかかる場合がある
});