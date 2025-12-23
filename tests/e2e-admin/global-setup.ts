/**
 * E2E Admin Tests - Global Setup
 *
 * Cookie + localStorage 両方を設定してSSR認証にも対応
 *
 * 方式:
 * 1. /api/test/login を叩いてCookieを取得
 * 2. localStorage にもセッションを設定
 * 3. storageState を保存（Cookie + localStorage両方含む）
 *
 * 必要な環境変数:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - E2E_ADMIN_EMAIL
 * - E2E_ADMIN_PASSWORD
 */

import { chromium, FullConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// .env.localを読み込み
dotenv.config({ path: '.env.local' });

const STORAGE_STATE_PATH = path.join(__dirname, '.storage-state.json');
const AUTH_STATE_PATH = path.join(__dirname, '.auth-state.json');

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 E2E Admin Tests - Global Setup (Cookie + localStorage 方式)');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const E2E_ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
  const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3099';

  // 環境変数チェック
  const missingVars: string[] = [];
  if (!SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!E2E_ADMIN_EMAIL) missingVars.push('E2E_ADMIN_EMAIL');
  if (!E2E_ADMIN_PASSWORD) missingVars.push('E2E_ADMIN_PASSWORD');

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach((v) => console.error(`   - ${v}`));
    console.error('\n📝 Create .env.local with these variables');
    throw new Error('Missing required environment variables for E2E admin tests');
  }

  // Supabase project ref を抽出
  const projectRef = SUPABASE_URL!.split('//')[1]?.split('.')[0] ?? 'unknown';
  const storageKey = `sb-${projectRef}-auth-token`;

  // Step 1: ブラウザを起動
  console.log('🌐 Step 1: ブラウザ起動...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Step 2: E2E Login API を叩いてCookieを取得
  console.log('🔐 Step 2: /api/test/login でCookie取得...');

  let loginResponse;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // まずベースURLにアクセス（サーバー起動確認）
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      break;
    } catch (e) {
      retryCount++;
      if (retryCount === maxRetries) {
        console.error('❌ サーバーに接続できません:', BASE_URL);
        throw new Error(`Cannot connect to server: ${BASE_URL}`);
      }
      console.log(`⏳ サーバー起動待ち... (${retryCount}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // API Login を実行
  try {
    const apiResponse = await page.request.post(`${BASE_URL}/api/test/login`, {
      data: {
        email: E2E_ADMIN_EMAIL,
        password: E2E_ADMIN_PASSWORD,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!apiResponse.ok()) {
      const errorText = await apiResponse.text();
      console.error('❌ Login API failed:', apiResponse.status(), errorText);
      throw new Error(`Login API failed: ${apiResponse.status()} ${errorText}`);
    }

    loginResponse = await apiResponse.json();
    console.log('✅ Login API 成功');
    console.log(`   User ID: ${loginResponse.user?.id}`);
  } catch (e) {
    console.error('❌ Login API エラー:', e);
    throw e;
  }

  // Step 3: localStorage にもセッションを設定（クライアント側Supabase用）
  console.log('💾 Step 3: localStorage にセッション設定...');

  if (loginResponse.session) {
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key: storageKey, value: loginResponse.session }
    );
    console.log(`   Storage Key: ${storageKey}`);
  }

  // Auth state保存（後方互換性のため）
  if (loginResponse.session) {
    const authState = {
      accessToken: loginResponse.session.access_token,
      refreshToken: loginResponse.session.refresh_token,
      userId: loginResponse.user?.id ?? '',
    };
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(authState, null, 2));
  }

  // Step 4: storageState を保存（Cookie + localStorage 両方）
  console.log('📦 Step 4: storageState 保存...');
  await context.storageState({ path: STORAGE_STATE_PATH });
  console.log(`   保存先: ${STORAGE_STATE_PATH}`);

  // 保存されたstorageStateの内容を確認
  const savedState = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf-8'));
  console.log(`   Cookies: ${savedState.cookies?.length ?? 0} 件`);
  console.log(`   Origins: ${savedState.origins?.length ?? 0} 件`);

  await browser.close();

  // 環境変数としても設定（他のスクリプトで使用可能）
  if (loginResponse.session) {
    process.env.E2E_ACCESS_TOKEN = loginResponse.session.access_token;
    process.env.E2E_REFRESH_TOKEN = loginResponse.session.refresh_token;
  }
  if (loginResponse.user) {
    process.env.E2E_USER_ID = loginResponse.user.id;
  }

  console.log('✅ Global setup completed\n');
}

export default globalSetup;
