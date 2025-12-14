import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// .env.localを確実に読み込む
dotenv.config({ path: '.env.local' });

// BASE_URLの一元管理: CI時も開発時もポート3099を使用
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3099';

/**
 * LuxuCare E2Eテスト設定
 * 主要ユーザーフローの自動化テスト
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // SSL/TLS security: only bypass for local self-signed certificates
    ignoreHTTPSErrors: process.env.LOCAL_SELF_SIGNED === 'true',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Future: Firefox and WebKit can be added here
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: process.env.CI ? 'npm run start:e2e' : 'PORT=3099 npm run dev',
    url: 'http://localhost:3099',
    reuseExistingServer: true,
    timeout: 120000,
  },

  // グローバル設定（一時的に無効化）
  // globalSetup: './tests/global-setup.ts',
  // globalTeardown: './tests/global-teardown.ts',
  
  // ダッシュボード smoke テスト専用の設定を適用
  globalSetup: process.env.CI ? undefined : './tests/global-setup.ts',

  // テスト環境固有の設定
  expect: {
    timeout: 10000,
  },

  // 並列実行時の分離
  // fullyParallel is already set at line 9
  
  // テストタイムアウト
  timeout: 60000,
});