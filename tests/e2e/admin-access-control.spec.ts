/**
 * Admin Access Control E2E Tests
 *
 * Phase 2-2a 受け入れ条件の実測テスト
 * - site_admin ユーザー → /admin アクセス可能
 * - 非 site_admin ユーザー → /admin アクセス拒否（AdminAccessDenied）
 *
 * 環境変数（必須）:
 * - ADMIN_TEST_EMAIL: site_admin ユーザーのメール
 * - ADMIN_TEST_PASSWORD: site_admin ユーザーのパスワード
 * - USER_TEST_EMAIL: 非 site_admin ユーザーのメール
 * - USER_TEST_PASSWORD: 非 site_admin ユーザーのパスワード
 *
 * CI実行時:
 * - 環境変数が未設定の場合はエラーで落ちる（skipではない）
 * - GitHub Secrets から渡される前提
 */

import { test, expect, Page } from '@playwright/test';

// CI環境かどうか
const isCI = process.env.CI === 'true';

// 認証情報のバリデーション（CI時は必須）
function validateCredentials(email: string | undefined, password: string | undefined, type: 'admin' | 'user'): void {
  if (!email || !password) {
    if (isCI) {
      throw new Error(`[CI ERROR] Missing ${type.toUpperCase()}_TEST_EMAIL or ${type.toUpperCase()}_TEST_PASSWORD. Set these in GitHub Secrets.`);
    }
  }
}

// ログインヘルパー関数
async function login(page: Page, email: string, password: string): Promise<boolean> {
  // /auth/signin または /auth/login のどちらかにアクセス
  await page.goto('/auth/signin');

  // リダイレクトされた場合も対応（signin → login への揺れ）
  await page.waitForURL(/\/auth\/(signin|login)/, { timeout: 5000 }).catch(() => {});

  // フォームが表示されるまで待機
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });

  // email 入力（name="email" または type="email"）
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(email);

  // password 入力
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.fill(password);

  // submit
  await page.click('button[type="submit"]');

  // ログイン結果を待機（リダイレクトまたはエラー）
  try {
    await page.waitForURL(/.*\/(dashboard|admin|organizations)/, { timeout: 15000 });
    return true;
  } catch {
    // ログイン失敗
    return false;
  }
}

test.describe('Admin Access Control - site_admin required', () => {

  test.describe('非 site_admin ユーザーのアクセス拒否', () => {

    test('非admin で /admin にアクセス → AccessDenied 表示', async ({ page }) => {
      const userEmail = process.env.USER_TEST_EMAIL;
      const userPassword = process.env.USER_TEST_PASSWORD;

      // CI時は環境変数必須、ローカルはskip許容
      validateCredentials(userEmail, userPassword, 'user');
      if (!userEmail || !userPassword) {
        test.skip(true, 'USER_TEST_EMAIL / USER_TEST_PASSWORD が未設定（ローカル実行時はスキップ可）');
        return;
      }

      // 1. 非admin ユーザーでログイン
      const loginSuccess = await login(page, userEmail, userPassword);
      expect(loginSuccess).toBe(true);

      // 2. /admin にアクセス
      const response = await page.goto('/admin');
      const status = response?.status();

      // 3. HTTP status を記録
      console.log(`[実測] /admin HTTP status: ${status}`);

      // 4. 画面表示を確認
      const pageContent = await page.content();

      // AdminAccessDenied の特徴的な文言を確認
      const hasAccessDenied =
        pageContent.includes('アクセス権限がありません') ||
        pageContent.includes('site_admin_required') ||
        pageContent.includes('管理者権限が必要');

      console.log(`[実測] 画面表示: ${hasAccessDenied ? 'AccessDenied表示あり' : 'AccessDenied表示なし'}`);

      // 5. 期待値の検証
      // - HTTP 200 で AdminAccessDenied コンポーネントが表示される
      // - または HTTP 403
      // - または リダイレクト
      if (status === 200) {
        // 200の場合は AccessDenied が表示されているべき
        expect(hasAccessDenied).toBe(true);
      } else if (status === 403) {
        // 403 は期待通り
        expect(status).toBe(403);
      } else if (status === 307 || status === 302) {
        // リダイレクトの場合は Location を確認
        const finalUrl = page.url();
        console.log(`[実測] リダイレクト先: ${finalUrl}`);
        expect(finalUrl).not.toContain('/admin');
      } else {
        // 想定外のステータス
        throw new Error(`想定外の HTTP status: ${status}`);
      }
    });

  });

  test.describe('site_admin ユーザーのアクセス許可', () => {

    test('admin で /admin にアクセス → 正常表示', async ({ page }) => {
      const adminEmail = process.env.ADMIN_TEST_EMAIL;
      const adminPassword = process.env.ADMIN_TEST_PASSWORD;

      if (!adminEmail || !adminPassword) {
        test.skip(true, 'ADMIN_TEST_EMAIL / ADMIN_TEST_PASSWORD が未設定');
        return;
      }

      // 1. admin ユーザーでログイン
      const loginSuccess = await login(page, adminEmail, adminPassword);
      expect(loginSuccess).toBe(true);

      // 2. /admin にアクセス
      const response = await page.goto('/admin');
      const status = response?.status();

      // 3. HTTP status を記録
      console.log(`[実測] /admin HTTP status (admin): ${status}`);

      // 4. 正常にページが表示されることを確認
      expect(status).toBe(200);

      // 5. AccessDenied が表示されていないことを確認
      const pageContent = await page.content();
      const hasAccessDenied =
        pageContent.includes('アクセス権限がありません') ||
        pageContent.includes('site_admin_required');

      expect(hasAccessDenied).toBe(false);

      console.log(`[実測] admin アクセス: 正常表示`);
    });

  });

  test.describe('未認証ユーザーのリダイレクト', () => {

    test('未ログインで /admin にアクセス → ログインへリダイレクト', async ({ page }) => {
      // 1. 未認証で /admin にアクセス
      const response = await page.goto('/admin');
      const status = response?.status();

      // ページ遷移を待機（クライアントサイドリダイレクトの場合）
      await page.waitForURL(/\/auth\/(login|signin)/, { timeout: 10000 }).catch(() => {});
      const finalUrl = page.url();

      // 2. 結果を記録
      console.log(`[実測] /admin HTTP status (未認証): ${status}`);
      console.log(`[実測] リダイレクト先: ${finalUrl}`);

      // 3. リダイレクトされていることを確認
      // Next.js では SSR redirect は 307、CSR redirect は 200 になる場合がある
      // 最終的にログインページに遷移していればOK
      expect(finalUrl).toMatch(/\/auth\/(login|signin)/);
      expect(finalUrl).toContain('redirect=');
    });

  });

});

// テスト失敗時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = `test-results/admin-access-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[スクリーンショット] ${screenshotPath}`);
  }
});
