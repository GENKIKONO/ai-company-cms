import { test, expect } from '@playwright/test';

/**
 * ヘッダ/ナビゲーション E2E テスト
 * 
 * 要件:
 * - ロゴクリックで常に / に遷移
 * - ログイン済みで「無料で始める」→ 組織ありは /dashboard、組織なしは /organizations/new
 * - 未ログインは /auth/login
 * - モバイルでメールが潰れず、Avatarメニューに畳まれる
 */
test.describe('ヘッダ/ナビゲーション', () => {
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL;
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD;
  const testUserEmail = process.env.TEST_USER_EMAIL;
  const testUserPassword = process.env.TEST_USER_PASSWORD;

  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
    
    // 既存のクッキーをクリア
    await page.context().clearCookies();
  });

  test('ロゴクリックで常に / に遷移（未認証）', async ({ page }) => {
    // 1. 任意のページに移動
    await page.goto('/organizations');
    await expect(page).toHaveURL(/.*\/organizations/);

    // 2. ロゴをクリック
    await page.click('text=AIO Hub AI企業CMS');

    // 3. ホームページに遷移することを確認
    await expect(page).toHaveURL('/');
  });

  test('ロゴクリックで常に / に遷移（認証済み）', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. ダッシュボードでロゴをクリック
    await page.click('text=AIO Hub AI企業CMS');

    // 3. ホームページに遷移することを確認（ダッシュボードではない）
    await expect(page).toHaveURL('/');
  });

  test('未認証時のCTA「無料で始める」動作', async ({ page }) => {
    // 1. ホームページでCTAボタンを確認
    await expect(page.locator('text=無料で始める')).toBeVisible();

    // 2. CTAボタンをクリック
    await page.click('text=無料で始める');

    // 3. ログインページに遷移することを確認
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('認証済み（企業あり）でのCTA動作', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン（管理者は企業を持っている想定）
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. ホームページに移動
    await page.goto('/');

    // 3. CTAボタンがダッシュボードを示すことを確認
    const ctaButton = page.locator('text=ダッシュボード').or(page.locator('text=無料で始める'));
    await expect(ctaButton).toBeVisible();

    // 4. CTAボタンをクリックしてダッシュボードに遷移
    await ctaButton.click();
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('認証済み（企業なし）でのCTA動作', async ({ page }) => {
    if (!testUserEmail || !testUserPassword) {
      test.skip('必要な環境変数が設定されていません (TEST_USER_EMAIL, TEST_USER_PASSWORD)');
    }

    // 1. 一般ユーザーでログイン（企業を持たない想定）
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testUserEmail!);
    await page.fill('input[name="password"]', testUserPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. ホームページに移動
    await page.goto('/');

    // 3. CTAボタンが企業作成を示すことを確認
    const ctaButton = page.locator('text=企業を作成').or(page.locator('text=無料で始める'));
    await expect(ctaButton).toBeVisible();

    // 4. CTAボタンをクリック
    await ctaButton.click();
    
    // 5. 企業作成ページまたはダッシュボードに遷移
    await expect(page).toHaveURL(/.*\/(organizations\/new|dashboard)/);
  });

  test('デスクトップでのメール表示確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. デスクトップサイズに設定
    await page.setViewportSize({ width: 1024, height: 768 });

    // 2. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 3. ヘッダでメールが表示されることを確認
    await expect(page.locator('text=こんにちは')).toBeVisible();
    await expect(page.locator(`text=${testAdminEmail}`)).toBeVisible();

    // 4. サインアウトボタンが表示されることを確認
    await expect(page.locator('button:has-text("ログアウト")')).toBeVisible();
  });

  test('モバイルでのAvatarメニュー表示確認', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. モバイルサイズに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 3. メール表示が隠れていることを確認（モバイルでは非表示）
    await expect(page.locator('text=こんにちは')).not.toBeVisible();

    // 4. Avatarボタンが表示されることを確認
    const avatarButton = page.locator('button').filter({ hasText: /^[A-Z]{1,2}$/ });
    await expect(avatarButton).toBeVisible();

    // 5. Avatarボタンをクリックしてメニューを開く
    await avatarButton.click();

    // 6. ドロップダウンメニューが表示されることを確認
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
    await expect(page.locator('text=ログアウト')).toBeVisible();
    await expect(page.locator(`text=${testAdminEmail}`)).toBeVisible();
  });

  test('認証済みでのナビゲーションメニュー表示', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. ナビゲーションメニューが表示されることを確認
    await expect(page.locator('nav a:has-text("ダッシュボード")')).toBeVisible();
    await expect(page.locator('nav a:has-text("サブスクリプション")')).toBeVisible();
  });

  test('未認証でのナビゲーションメニュー非表示', async ({ page }) => {
    // 1. 未認証状態でホームページにアクセス
    await page.goto('/');

    // 2. ナビゲーションメニューが表示されていないことを確認
    await expect(page.locator('nav a:has-text("ダッシュボード")')).not.toBeVisible();
    await expect(page.locator('nav a:has-text("サブスクリプション")')).not.toBeVisible();

    // 3. ログインボタンが表示されることを確認
    await expect(page.locator('a:has-text("ログイン")')).toBeVisible();
  });

  test('レスポンシブブレークポイントでの表示切り替え', async ({ page }) => {
    if (!testAdminEmail || !testAdminPassword) {
      test.skip('必要な環境変数が設定されていません');
    }

    // 1. ログイン
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', testAdminEmail!);
    await page.fill('input[name="password"]', testAdminPassword!);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. デスクトップサイズでメール表示確認
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('text=こんにちは')).toBeVisible();

    // 3. タブレットサイズに変更
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('text=こんにちは')).toBeVisible();

    // 4. モバイルサイズに変更してメール非表示確認
    await page.setViewportSize({ width: 640, height: 960 });
    await expect(page.locator('text=こんにちは')).not.toBeVisible();

    // 5. Avatarボタンが表示されることを確認
    const avatarButton = page.locator('button').filter({ hasText: /^[A-Z]{1,2}$/ });
    await expect(avatarButton).toBeVisible();
  });
});

// エラー時のスクリーンショット
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ 
      path: `test-results/header-nav-failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`,
      fullPage: true 
    });
  }
});