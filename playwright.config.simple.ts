import { defineConfig, devices } from '@playwright/test';

/**
 * 簡易 E2E テスト設定（Supabase dependency なし）
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: 'line',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://aiohub.jp',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // グローバル設定なし（Supabase dependency 回避）
  timeout: 60000,
});