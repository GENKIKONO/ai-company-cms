/**
 * Playwright Config for Admin E2E Tests
 *
 * 認証済み管理者ユーザーでの管理ページテスト用設定
 * storageStateを使用してSSR認証にも対応
 */

import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.localを読み込み
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3099';
const STORAGE_STATE_PATH = path.join(__dirname, '.storage-state.json');

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // 認証状態を共有するためシリアル実行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // シングルワーカーで実行
  reporter: [
    ['html', { outputFolder: './html-report' }],
    ['list'],
  ],

  outputDir: './test-results',

  use: {
    baseURL: BASE_URL,
    // storageStateを使用して認証状態を復元
    storageState: STORAGE_STATE_PATH,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Global setup for authentication
  globalSetup: './global-setup.ts',

  // Web server configuration
  webServer: {
    command: process.env.CI ? 'npm run start:e2e' : 'PORT=3099 npm run dev',
    url: 'http://localhost:3099',
    reuseExistingServer: true,
    timeout: 120000,
  },

  expect: {
    timeout: 10000,
  },

  timeout: 60000,
});
