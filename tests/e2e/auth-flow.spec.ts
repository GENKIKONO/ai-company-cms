import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // テスト環境での前提条件設定
    await page.goto('/');
  });

  test('should complete login flow and access dashboard', async ({ page }) => {
    // 1. ログインページへのアクセス
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/ログイン|Login/);

    // 2. ログインフォームの存在確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // 3. テストユーザーでログイン（環境変数から取得）
    const testEmail = process.env.TEST_USER_EMAIL || 'test@example.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'testpassword123';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 4. ダッシュボードへのリダイレクト確認
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // 5. ダッシュボード要素の確認
    await expect(page.locator('h1, h2')).toContainText(/ダッシュボード|Dashboard/);
    await expect(page.locator('[data-testid="user-menu"], [aria-label*="ユーザー"]')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // 無効な認証情報でログイン試行
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージの確認
    await expect(page.locator('.error, [role="alert"]')).toBeVisible();
    
    // ログインページに留まることを確認
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should handle signup flow', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/サインアップ|Sign.*up/);

    // サインアップフォームの基本要素確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name*="name"], input[placeholder*="名前"]')).toBeVisible();
  });

  test('should handle logout flow', async ({ page }) => {
    // 事前にログイン状態を作成（実際のE2Eでは認証状態をセットアップ）
    await page.goto('/dashboard');
    
    // ログアウトボタン/メニューの操作
    const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("ログアウト"), button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // ユーザーメニューからログアウト
      await page.locator('[data-testid="user-menu"]').click();
      await page.locator('button:has-text("ログアウト"), button:has-text("Logout")').click();
    }

    // ログイン画面または公開ページにリダイレクトされることを確認
    await page.waitForURL(/\/(auth\/login|$)/, { timeout: 10000 });
  });
});